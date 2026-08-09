(ns car-rental.backend.store.availability
  "Pure(ish) read-only queries over a db snapshot for vehicle availability."
  (:require [car-rental.backend.store.core :as store]))

(def blocking-booking-statuses #{"pending_payment" "confirmed" "in_progress"})

(defn booked-ranges [db vehicle_id]
  (->> (store/list-all db :bookings)
       (filter #(and (= vehicle_id (:vehicle_id %))
                     (contains? blocking-booking-statuses (:status %))))
       (map (fn [b] {:booking_id (:id b) :start_date (:pickup_date b) :end_date (:return_date b)}))))

(defn blocked-ranges [db vehicle_id]
  (->> (store/list-all db :blocked_dates)
       (filter #(= vehicle_id (:vehicle_id %)))
       (map #(select-keys % [:id :start_date :end_date :reason]))))

(defn public-blocked-ranges
  "Combined view for the public Vehicle Detail `availability_blocked_ranges`
   field (no booking/customer detail exposed, just the date windows)."
  [db vehicle_id]
  (->> (concat (booked-ranges db vehicle_id) (blocked-ranges db vehicle_id))
       (map #(select-keys % [:start_date :end_date]))
       vec))

(defn available?
  "True if no blocking booking or maintenance block overlaps
   [pickup-date, return-date). `exclude-booking-id` lets a booking's own
   re-quote (e.g. during cancellation flows) ignore itself."
  [db vehicle_id pickup-date return-date & {:keys [exclude-booking-id]}]
  (let [ranges (concat
                (->> (booked-ranges db vehicle_id)
                     (remove #(= exclude-booking-id (:booking_id %))))
                (blocked-ranges db vehicle_id))]
    (not-any? #(store/dates-overlap? pickup-date return-date (:start_date %) (:end_date %))
              ranges)))
