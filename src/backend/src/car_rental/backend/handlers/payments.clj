(ns car-rental.backend.handlers.payments
  "Section 4: payments. Provider choice is out of scope per api-contract.md
   Section 14 ('backend decision outside this contract's scope') — this
   implements a Stripe-shaped stub (`client_secret`) since that's the
   example given, without calling out to a real payment provider."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]
            [car-rental.backend.handlers.notifications :as notify])
  (:import [java.util UUID]))

(def IntentRequest
  [:map
   [:booking_id :string]
   [:amount :string]
   [:currency :string]
   [:payment_method [:enum "card" "paypal"]]
   [:reference {:optional true} [:maybe :string]]
   [:email {:optional true} [:maybe :string]]])

(defn- authorized-for-booking? [ctx request booking]
  (or (when-let [claims (auth/customer-claims ctx request)]
        (= (:customer_id booking) (:sub claims)))
      (let [{:keys [reference email]} (:body-params request)]
        (and reference email
             (= (:reference booking) reference)
             (= (get-in booking [:customer :email]) email)))
      ;; guest checkout with no account at all: allow when the booking has
      ;; no linked customer account and the request carries no token.
      (and (nil? (:customer_id booking)) (nil? (auth/decode-token ctx request)))))

(defn create-intent [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        body (validation/validate! IntentRequest (:body-params request))
        booking (store/get-one db :bookings (:booking_id body))]
    (when-not booking (errors/not-found! "BOOKING_NOT_FOUND" "This booking could not be found."))
    (when-not (authorized-for-booking? ctx request booking)
      (errors/forbidden! "FORBIDDEN" "You do not have access to this booking."))
    (let [provider (get-in (store/get-singleton db :settings) [:payment_provider :provider] "stripe")
          id (store/next-id! db-atom :pay)
          client-secret (str id "_secret_" (subs (str (UUID/randomUUID)) 0 18))
          payment (store/insert! db-atom :payments id
                                  {:booking_id (:booking_id body)
                                   :amount (:amount body)
                                   :currency (:currency body)
                                   :payment_method (:payment_method body)
                                   :provider provider
                                   :status "requires_confirmation"
                                   :client_secret client-secret
                                   :created_at (str (java.time.Instant/now))})]
      {:status 200
       :body {:payment_id id
              :provider provider
              :client_secret (:client_secret payment)
              :amount (:amount payment)
              :currency (:currency payment)}})))

(defn payment-status [ctx request]
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])
        booking (store/get-one db :bookings id)]
    (when-not booking (errors/not-found! "BOOKING_NOT_FOUND" "This booking could not be found."))
    (let [amount-paid (case (:payment_status booking)
                         "paid" (get-in booking [:price_breakdown :total])
                         "partially_paid" (get-in booking [:price_breakdown :deposit_due])
                         "0.00")]
      {:status 200
       :body {:payment_status (:payment_status booking)
              :amount_paid amount-paid
              :currency (get-in booking [:price_breakdown :currency])}})))

(defn- mark-paid! [db-atom booking-id amount-label]
  (let [updated (store/update! db-atom :bookings booking-id
                                #(assoc % :payment_status (if (= amount-label :total) "paid" "partially_paid")
                                        :status "confirmed"
                                        :updated_at (str (java.time.Instant/now))))]
    (notify/notify! db-atom :booking_confirmed {:reference (:reference updated)
                                                 :email (get-in updated [:customer :email])})
    (notify/notify! db-atom :admin_new_booking {:reference (:reference updated)})
    updated))

(defn- process-succeeded!
  "Shared by the real webhook and the dev-only simulate-success endpoint
   below: marks the payment + linked booking paid/confirmed and fires the
   booking_confirmed + admin_new_booking notifications. Returns the
   updated booking."
  [db-atom payment]
  (let [db @db-atom
        booking (store/get-one db :bookings (:booking_id payment))
        pricing-model (get-in booking [:price_breakdown :payment_model])
        paid-full? (or (not= pricing-model "deposit")
                        (>= (bigdec (:amount payment)) (bigdec (get-in booking [:price_breakdown :total]))))]
    (mark-paid! db-atom (:booking_id payment) (if paid-full? :total :deposit_due))))

(defn- process-failed! [db-atom payment]
  (let [booking (store/get-one @db-atom :bookings (:booking_id payment))]
    (notify/notify! db-atom :payment_failed {:reference (:reference booking)
                                              :email (get-in booking [:customer :email])})))

(defn webhook
  "Server-to-server only — never called by the frontend. Accepts a minimal
   provider-agnostic stub payload ({\"payment_id\": ..., \"status\":
   \"succeeded\"|\"failed\"}) since the real provider's webhook schema is
   an implementation detail outside api-contract.md's scope; what matters
   for the contract is the *effect*: on success, the linked booking's
   payment_status/status update and booking_confirmed fires."
  [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        {:keys [payment_id status]} (:body-params request)
        payment (store/get-one db :payments payment_id)]
    (when-not payment
      (errors/not-found! "PAYMENT_NOT_FOUND" "Unknown payment_id."))
    (store/update! db-atom :payments payment_id #(assoc % :status status))
    (if (= status "succeeded")
      (process-succeeded! db-atom payment)
      (process-failed! db-atom payment))
    {:status 204}))

(defn- dev-simulation-enabled? [ctx]
  ;; Config-flag-gated per the dev/demo nature of this endpoint (see
  ;; docstring below) — set DEV_PAYMENT_SIMULATION_ENABLED=false (or edit
  ;; resources/config.edn) to turn it off; anything other than the literal
  ;; string "false" is treated as enabled, since this is a dev convenience
  ;; that should be *explicitly* opted out of, not opted into.
  (not= "false" (get-in ctx [:config :features :dev-payment-simulation-enabled])))

(defn simulate-success
  "DEV/DEMO-ONLY. Not part of api-contract.md's original payment provider
   integration (that's explicitly out of scope, Section 14) — added so the
   full booking flow (search -> quote -> book -> pay -> confirmed) can be
   demoed end-to-end without a real Stripe/payment-provider integration.
   Does exactly what POST /payments/webhook does for a \"succeeded\" event
   (marks the payment + booking paid/confirmed, fires booking_confirmed),
   but is safe for the frontend to call directly after POST
   /payments/intent instead of waiting on a real provider round-trip.
   Gated by config (see dev-simulation-enabled?) so it's obviously not
   meant to ship enabled in a real deployment; returns 404 when disabled,
   as if the route didn't exist."
  [ctx request]
  (when-not (dev-simulation-enabled? ctx)
    (errors/not-found! "NOT_FOUND" "No such route."))
  (let [db-atom (:db ctx)
        db @db-atom
        payment_id (get-in request [:path-params :id])
        payment (store/get-one db :payments payment_id)]
    (when-not payment
      (errors/not-found! "PAYMENT_NOT_FOUND" "Unknown payment_id."))
    (store/update! db-atom :payments payment_id #(assoc % :status "succeeded"))
    (let [booking (process-succeeded! db-atom payment)]
      {:status 200
       :body {:payment_id payment_id
              :booking_id (:id booking)
              :booking_status (:status booking)
              :payment_status (:payment_status booking)
              :amount_paid (get-in booking [:price_breakdown
                                             (if (= "paid" (:payment_status booking)) :total :deposit_due)])
              :currency (get-in booking [:price_breakdown :currency])}})))
