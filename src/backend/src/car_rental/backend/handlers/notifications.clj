(ns car-rental.backend.handlers.notifications
  "Section 9 of api-contract.md: an event catalog, not endpoints. No SMTP
   provider is configured for this build, so `notify!` records the event
   (for the admin dashboard badge counts + so tests/dev can assert a
   notification fired) and logs it, standing in for actually sending mail.
   Swapping in a real mailer later only means changing `send!` below.")

(def valid-events
  #{:booking_confirmed :booking_reminder :booking_cancelled :payment_failed
    :admin_new_booking :admin_review_submitted :admin_contact_received})

(defn- send! [event payload]
  (println (format "[notify] %s -> %s" (name event) (pr-str (select-keys payload [:reference :email :ticket_id :id])))))

(defn notify! [db-atom event payload]
  (assert (contains? valid-events event) (str "unknown notification event: " event))
  (swap! db-atom update :notifications conj
         {:event (name event) :payload payload :at (str (java.time.Instant/now))})
  (send! event payload)
  nil)
