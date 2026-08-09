(ns car-rental.backend.domain.pricing
  "Pure pricing calculations. No I/O — callers (handlers) fetch the vehicle
   and pricing-settings data and pass plain maps in here.

   Business rules inferred from api-contract.md's worked example in
   Section 2 (subtotal 900 / chauffeur_fee 250 / airport_pickup_fee 40 /
   child_seat_fee 25 / taxes_fees 60.75 / total 1275.75 / deposit_due 382.73
   for a 5-day chauffeured booking with airport pickup + child seat):
     - chauffeur_fee     = chauffeur_fee_per_day * days (250 = 50 * 5)
     - airport_pickup_fee = flat fee, not multiplied by days (40 = 40)
     - child_seat_fee    = child_seat_fee_per_day * days (25 = 5 * 5)
     - additional_driver_fee = additional_driver_fee_per_day * days
       (assumption: same per-day pattern as chauffeur/child seat, since it's
       an ongoing extra for the length of the rental rather than a one-time
       transfer like airport pickup — not directly exercised by the
       contract's example, flagged as an assumption)
     - taxes_fees = 5% of (subtotal + all extras), HALF_UP to 2dp
       (60.75 = (900+250+40+0+25) * 0.05 — derived from the example, not
       stated explicitly in api-contract.md; flagged as an assumption. This
       rate is a backend constant, not currently exposed via
       /admin/pricing/settings since the contract doesn't document a tax
       rate field there.)
     - total = subtotal + all extras + taxes_fees
     - deposit_due = total * deposit_percentage%, HALF_UP
       (382.73 = 1275.75 * 30% = 382.725 -> 382.73)
     - balance_due = total - deposit_due"
  (:require [car-rental.backend.domain.money :as money]
            [car-rental.backend.domain.errors :as errors])
  (:import [java.time LocalDate]
           [java.time.temporal ChronoUnit]))

(def tax-rate 0.05M)

(defn parse-date ^LocalDate [s]
  (try
    (LocalDate/parse s)
    (catch Exception _
      (errors/validation! {"date" "must be a valid YYYY-MM-DD date"}))))

(defn days-between
  "Number of rental days (nights) between pickup and return dates."
  [pickup-date return-date]
  (let [p (parse-date pickup-date)
        r (parse-date return-date)]
    (.between ChronoUnit/DAYS p r)))

(defn validate-date-range!
  [pickup-date return-date today]
  (let [p (parse-date pickup-date)
        r (parse-date return-date)
        t (parse-date today)]
    (cond
      (.isBefore p t)
      (errors/validation! {"pickup_date" "cannot be in the past"})

      (not (.isBefore p r))
      (errors/validation! {"return_date" "must be after pickup_date"})

      :else true)))

(defn extras-fee [per-day flat? days enabled?]
  (if enabled?
    (if flat? (money/round2 per-day) (money/mul per-day days))
    0M))

(defn compute-breakdown
  "opts: {:price-per-day :pickup-date :return-date :service-type
          :airport-pickup? :additional-driver? :child-seat?
          :currency :pricing-settings}
   pricing-settings: {:payment-model :deposit-percentage
                       :extras {:chauffeur-fee-per-day :airport-pickup-fee
                                :additional-driver-fee :child-seat-fee}}
   Returns a map matching the /pricing/quote response shape (values as
   money strings)."
  [{:keys [price-per-day pickup-date return-date service-type
           airport-pickup? additional-driver? child-seat?
           currency pricing-settings]}]
  (let [days (days-between pickup-date return-date)
        _ (when (<= days 0)
            (errors/validation! {"return_date" "must be after pickup_date"}))
        ;; pricing-settings comes straight from the store, whose keys match
        ;; the wire/contract shape (snake_case), e.g. :chauffeur_fee_per_day.
        extras (:extras pricing-settings)
        subtotal (money/mul price-per-day days)
        chauffeur-fee (extras-fee (:chauffeur_fee_per_day extras) false days
                                   (= service-type "chauffeur"))
        airport-fee (extras-fee (:airport_pickup_fee extras) true days airport-pickup?)
        additional-driver-fee (extras-fee (:additional_driver_fee extras) false days
                                           (boolean additional-driver?))
        child-seat-fee (extras-fee (:child_seat_fee extras) false days (boolean child-seat?))
        pre-tax (money/add subtotal chauffeur-fee airport-fee additional-driver-fee child-seat-fee)
        taxes-fees (money/mul pre-tax tax-rate)
        total (money/add pre-tax taxes-fees)
        payment-model (or (:payment_model pricing-settings) "full")
        deposit-due (if (= payment-model "deposit")
                      (money/percent-of total (:deposit_percentage pricing-settings 30))
                      total)
        balance-due (money/sub total deposit-due)]
    {:days days
     :subtotal (money/->str subtotal)
     :chauffeur_fee (money/->str chauffeur-fee)
     :airport_pickup_fee (money/->str airport-fee)
     :additional_driver_fee (money/->str additional-driver-fee)
     :child_seat_fee (money/->str child-seat-fee)
     :taxes_fees (money/->str taxes-fees)
     :total (money/->str total)
     :currency currency
     :payment_model payment-model
     :deposit_due (money/->str deposit-due)
     :balance_due (money/->str balance-due)}))

(defn vehicle-detail-breakdown
  "The Vehicle Detail endpoint's `price_breakdown` shape differs slightly
   (base_rate_per_day/days instead of extras split) — reuses the same
   underlying calc for the base fare + taxes only (no service_type/extras
   context available on a plain vehicle-detail date query)."
  [{:keys [price-per-day pickup-date return-date currency]}]
  (let [days (days-between pickup-date return-date)
        _ (when (<= days 0)
            (errors/validation! {"return_date" "must be after pickup_date"}))
        subtotal (money/mul price-per-day days)
        taxes-fees (money/mul subtotal tax-rate)
        total (money/add subtotal taxes-fees)]
    {:base_rate_per_day (money/->str price-per-day)
     :days days
     :subtotal (money/->str subtotal)
     :chauffeur_fee "0.00"
     :airport_pickup_fee "0.00"
     :taxes_fees (money/->str taxes-fees)
     :total (money/->str total)
     :currency currency}))
