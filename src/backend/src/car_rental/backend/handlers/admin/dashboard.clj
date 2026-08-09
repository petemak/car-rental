(ns car-rental.backend.handlers.admin.dashboard
  "Section 13: admin — dashboard summary."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.money :as money]
            [car-rental.backend.auth.context :as auth])
  (:import [java.time LocalDate]))

(defn- same-day? [date-str ^LocalDate today]
  (and date-str (= (LocalDate/parse date-str) today)))

(defn- created-this-week? [created-at ^LocalDate today]
  (try
    (let [instant (java.time.Instant/parse created-at)
          d (.toLocalDate (.atZone instant java.time.ZoneOffset/UTC))]
      (not (.isBefore d (.minusDays today 7))))
    (catch Exception _ false)))

(defn- created-this-month? [created-at ^LocalDate today]
  (try
    (let [instant (java.time.Instant/parse created-at)
          d (.toLocalDate (.atZone instant java.time.ZoneOffset/UTC))]
      (and (= (.getMonth d) (.getMonth today)) (= (.getYear d) (.getYear today))))
    (catch Exception _ false)))

(defn summary [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        today (LocalDate/now)
        bookings (store/list-all db :bookings)
        reviews (store/list-all db :reviews)
        contact-tickets (store/list-all db :contact_tickets)
        currency (get-in (store/get-singleton db :pricing_settings) [:currency_default] "USD")]
    {:status 200
     :body {:upcoming_pickups_today (count (filter #(same-day? (:pickup_date %) today) bookings))
            :upcoming_returns_today (count (filter #(same-day? (:return_date %) today) bookings))
            :new_bookings_this_week (count (filter #(created-this-week? (:created_at %) today) bookings))
            :pending_reviews_count (count (filter #(= "pending_moderation" (:status %)) reviews))
            ;; added post-QA alongside GET/PATCH /admin/contact-submissions
            ;; — closes the loop on the admin_contact_received notification
            ;; (Section 9), which previously had no dashboard-visible count.
            :pending_contact_submissions_count (count (filter #(= "new" (:status %)) contact-tickets))
            :revenue_this_month (str (apply money/add
                                             (->> bookings
                                                  (filter #(and (= "paid" (:payment_status %))
                                                                (created-this-month? (:created_at %) today)))
                                                  (map #(get-in % [:price_breakdown :total]))
                                                  (cons 0M))))
            :currency currency}}))
