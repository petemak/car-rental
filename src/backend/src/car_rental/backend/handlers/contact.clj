(ns car-rental.backend.handlers.contact
  "Section 8: contact & newsletter."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.handlers.notifications :as notify]))

(def ContactRequest
  [:map [:name :string] [:email :string] [:subject :string] [:message :string]])

(defn submit [ctx request]
  (let [db-atom (:db ctx)
        body (validation/validate! ContactRequest (:body-params request))
        id (store/next-id! db-atom :tk)
        ;; internal lifecycle status for admin moderation (see
        ;; handlers.admin.contact-submissions) starts at "new" — distinct
        ;; from the public response's "received" ack below, which is a
        ;; fixed literal per api-contract.md Section 8 and doesn't change
        ;; as an admin reads/resolves the ticket.
        _ticket (store/insert! db-atom :contact_tickets id
                                (assoc body :status "new" :created_at (str (java.time.Instant/now))))]
    (notify/notify! db-atom :admin_contact_received {:ticket_id id})
    {:status 201 :body {:ticket_id id :status "received"}}))

(def NewsletterRequest [:map [:email :string]])

(defn subscribe [ctx request]
  (let [db-atom (:db ctx)
        {:keys [email]} (validation/validate! NewsletterRequest (:body-params request))]
    (store/put-raw! db-atom :newsletter_subscribers email
                     {:email email :subscribed_at (str (java.time.Instant/now))})
    {:status 200 :body {:status "subscribed"}}))
