(ns car-rental.backend.handlers.bookings
  "Section 3: bookings."
  (:require [clojure.string :as str]
            [buddy.hashers :as hashers]
            [car-rental.backend.store.core :as store]
            [car-rental.backend.store.availability :as availability]
            [car-rental.backend.domain.pricing :as calc]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]
            [car-rental.backend.handlers.notifications :as notify]))

(def CustomerSchema
  [:map
   [:first_name :string]
   [:last_name :string]
   [:email :string]
   [:phone :string]
   [:country :string]
   [:license_number {:optional true} [:maybe :string]]
   [:license_expiry {:optional true} [:maybe :string]]])

(def BookingCreateRequest
  [:map
   [:vehicle_id :string]
   [:pickup_date :string]
   [:pickup_time :string]
   [:return_date :string]
   [:return_time :string]
   [:pickup_location_id :string]
   [:dropoff_location_id :string]
   [:service_type [:enum "self_drive" "chauffeur"]]
   [:airport_pickup {:optional true} :boolean]
   [:flight_number {:optional true} [:maybe :string]]
   [:additional_driver {:optional true} :boolean]
   [:child_seat {:optional true} :boolean]
   [:customer CustomerSchema]
   [:special_requests {:optional true} [:maybe :string]]
   [:create_account {:optional true} :boolean]
   [:password {:optional true} [:maybe :string]]
   [:accepted_terms :boolean]])

(defn- blank? [s] (or (nil? s) (str/blank? s)))

(defn- validate-business-rules! [body]
  (when-not (:accepted_terms body)
    (errors/validation! {"accepted_terms" "must be accepted to complete a booking"}))
  (when (= "self_drive" (:service_type body))
    (let [fields (cond-> {}
                   (blank? (get-in body [:customer :license_number]))
                   (assoc "customer.license_number" "is required for self-drive bookings")
                   (blank? (get-in body [:customer :license_expiry]))
                   (assoc "customer.license_expiry" "is required for self-drive bookings"))]
      (when (seq fields) (errors/validation! fields))))
  (when (and (:create_account body) (blank? (:password body)))
    (errors/validation! {"password" "is required when create_account is true"})))

(defn- find-customer-by-email [db email]
  (->> (store/list-all db :customers) (filter #(= email (:email %))) first))

(defn- maybe-create-account! [ctx body]
  (let [db-atom (:db ctx)
        db @db-atom
        email (get-in body [:customer :email])]
    (if (and (:create_account body) (not (find-customer-by-email db email)))
      (let [id (store/next-id! db-atom :cust)
            customer (store/insert! db-atom :customers id
                                     {:first_name (get-in body [:customer :first_name])
                                      :last_name (get-in body [:customer :last_name])
                                      :email email
                                      :phone (get-in body [:customer :phone])
                                      :country (get-in body [:customer :country])
                                      :license_number (get-in body [:customer :license_number])
                                      :license_expiry (get-in body [:customer :license_expiry])
                                      :password_hash (hashers/derive (:password body))
                                      :created_at (str (java.time.Instant/now))})]
        {:created? true :customer customer :token (auth/customer-token ctx customer)})
      {:created? false :customer (find-customer-by-email db email) :token nil})))

(defn create [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        body (validation/validate! BookingCreateRequest (:body-params request))
        vehicle (store/get-one db :vehicles (:vehicle_id body))]
    (when (or (nil? vehicle) (= "retired" (:status vehicle)))
      (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
    (calc/validate-date-range! (:pickup_date body) (:return_date body) (str (java.time.LocalDate/now)))
    (validate-business-rules! body)
    (when-not (availability/available? db (:vehicle_id body) (:pickup_date body) (:return_date body))
      (errors/conflict! "VEHICLE_NOT_AVAILABLE" "This vehicle is not available for the selected dates."))
    (let [pricing-settings (store/get-singleton db :pricing_settings)
          breakdown (calc/compute-breakdown
                      {:price-per-day (:price_per_day vehicle)
                       :pickup-date (:pickup_date body)
                       :return-date (:return_date body)
                       :service-type (:service_type body)
                       :airport-pickup? (boolean (:airport_pickup body))
                       :additional-driver? (boolean (:additional_driver body))
                       :child-seat? (boolean (:child_seat body))
                       :currency (:currency vehicle)
                       :pricing-settings pricing-settings})
          breakdown (dissoc breakdown :days)
          token-claims (auth/customer-claims ctx request)
          {:keys [created? customer token]} (if token-claims
                                               {:created? false
                                                :customer (store/get-one db :customers (:sub token-claims))
                                                :token nil}
                                               (maybe-create-account! ctx body))
          n (store/next-counter! db-atom :booking)
          id (str "bk_" n)
          reference (str "RR-" n)
          _booking (store/insert! db-atom :bookings id
                                  {:reference reference
                                   :status "pending_payment"
                                   :vehicle_id (:vehicle_id body)
                                   :pickup_date (:pickup_date body)
                                   :pickup_time (:pickup_time body)
                                   :return_date (:return_date body)
                                   :return_time (:return_time body)
                                   :pickup_location_id (:pickup_location_id body)
                                   :dropoff_location_id (:dropoff_location_id body)
                                   :service_type (:service_type body)
                                   :airport_pickup (boolean (:airport_pickup body))
                                   :flight_number (:flight_number body)
                                   :additional_driver (boolean (:additional_driver body))
                                   :child_seat (boolean (:child_seat body))
                                   :chauffeur_id nil
                                   :customer (:customer body)
                                   :customer_id (:id customer)
                                   :special_requests (:special_requests body)
                                   :internal_notes ""
                                   :price_breakdown breakdown
                                   :payment_status "pending"
                                   :payment_provider_transaction_id nil
                                   :created_at (str (java.time.Instant/now))
                                   :updated_at (str (java.time.Instant/now))})]
      {:status 201
       :body {:booking_id id
              :reference reference
              :status "pending_payment"
              :price_breakdown breakdown
              :customer_account_created created?
              :customer_token token}})))

(defn- owns-booking-by-token? [ctx request booking]
  (when-let [claims (auth/customer-claims ctx request)]
    (= (:customer_id booking) (:sub claims))))

(defn- owns-booking-by-guest-body? [request booking]
  (let [{:keys [reference email]} (:body-params request)]
    (and reference email
         (= (:reference booking) reference)
         (= (get-in booking [:customer :email]) email))))

(defn lookup [ctx request]
  (let [db @(:db ctx)
        {:strs [reference email]} (:query-params request)
        booking (->> (store/list-all db :bookings)
                     (filter #(and (= reference (:reference %))
                                    (= email (get-in % [:customer :email]))))
                     first)]
    (when-not booking (errors/not-found! "BOOKING_NOT_FOUND" "No booking matches that reference and email."))
    {:status 200 :body (p/booking-detail db booking)}))

(defn get-by-id [ctx request]
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])
        booking (store/get-one db :bookings id)]
    (when-not booking (errors/not-found! "BOOKING_NOT_FOUND" "This booking could not be found."))
    (when-not (owns-booking-by-token? ctx request booking)
      (errors/forbidden! "FORBIDDEN" "You do not have access to this booking."))
    {:status 200 :body (p/booking-detail db booking)}))

(defn- refund-amount [booking]
  ;; Cancellation & Refund policy summary is stored per-vehicle
  ;; ("Full refund up to 72h before pickup."); modelled here as: full
  ;; refund of amount already paid if pickup is >=72h away, otherwise a
  ;; flat 50% of amount paid, matching the plain-language policy text.
  ;; The endpoint always succeeds in cancelling regardless (per contract).
  (let [pickup (java.time.LocalDate/parse (:pickup_date booking))
        now (java.time.LocalDate/now)
        hours-until (* 24 (.between java.time.temporal.ChronoUnit/DAYS now pickup))
        paid-amount (if (contains? #{"paid" "partially_paid"} (:payment_status booking))
                      (bigdec (or (get-in booking [:price_breakdown :deposit_due])
                                  (get-in booking [:price_breakdown :total])))
                      0M)]
    (if (>= hours-until 72)
      paid-amount
      (.setScale (* paid-amount 0.5M) 2 java.math.RoundingMode/HALF_UP))))

(defn cancel [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        id (get-in request [:path-params :id])
        booking (store/get-one db :bookings id)]
    (when-not booking (errors/not-found! "BOOKING_NOT_FOUND" "This booking could not be found."))
    (when-not (or (owns-booking-by-token? ctx request booking)
                  (owns-booking-by-guest-body? request booking))
      (errors/forbidden! "FORBIDDEN" "You do not have access to this booking."))
    (when (= "cancelled" (:status booking))
      (errors/conflict! "ALREADY_CANCELLED" "This booking is already cancelled."))
    (let [refund (refund-amount booking)
          updated (store/update! db-atom :bookings id
                                  #(assoc % :status "cancelled" :updated_at (str (java.time.Instant/now))
                                          :cancellation_reason (or (get-in request [:body-params :reason]) "")))]
      (notify/notify! db-atom :booking_cancelled {:reference (:reference updated)
                                                    :email (get-in updated [:customer :email])})
      {:status 200
       :body {:status "cancelled"
              :refund_amount (str (.setScale ^java.math.BigDecimal refund 2 java.math.RoundingMode/HALF_UP))
              :refund_status (if (pos? refund) "processing" "not_applicable")
              :currency (get-in updated [:price_breakdown :currency])}})))

(defn account-bookings [ctx request]
  (let [db @(:db ctx)
        claims (auth/require-customer! ctx request)
        qp (:query-params request)
        page (some-> (get qp "page") Integer/parseInt)
        per-page (some-> (get qp "per_page") Integer/parseInt)
        bookings (->> (store/list-all db :bookings)
                      (filter #(= (:sub claims) (:customer_id %)))
                      (sort-by :created_at)
                      reverse)
        paginated (store/paginate bookings {:page page :per-page per-page})]
    {:status 200 :body (update paginated :data #(mapv (partial p/booking-summary-customer db) %))}))
