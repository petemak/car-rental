(ns car-rental.backend.domain.pricing-test
  "Asserts the worked example from api-contract.md Section 2 exactly."
  (:require [clojure.test :refer [deftest is]]
            [car-rental.backend.domain.pricing :as pricing]))

(def pricing-settings
  {:payment_model "deposit"
   :deposit_percentage 30
   :extras {:chauffeur_fee_per_day "50.00"
            :airport_pickup_fee "40.00"
            :additional_driver_fee "15.00"
            :child_seat_fee "5.00"}})

(deftest contract-worked-example
  (let [result (pricing/compute-breakdown
                {:price-per-day "180.00"
                 :pickup-date "2026-09-10"
                 :return-date "2026-09-15"
                 :service-type "chauffeur"
                 :airport-pickup? true
                 :additional-driver? false
                 :child-seat? true
                 :currency "USD"
                 :pricing-settings pricing-settings})]
    (is (= "900.00" (:subtotal result)))
    (is (= "250.00" (:chauffeur_fee result)))
    (is (= "40.00" (:airport_pickup_fee result)))
    (is (= "0.00" (:additional_driver_fee result)))
    (is (= "25.00" (:child_seat_fee result)))
    (is (= "60.75" (:taxes_fees result)))
    (is (= "1275.75" (:total result)))
    (is (= "deposit" (:payment_model result)))
    (is (= "382.73" (:deposit_due result)))
    (is (= "893.02" (:balance_due result)))))

(deftest vehicle-detail-example
  (let [result (pricing/vehicle-detail-breakdown
                {:price-per-day "180.00" :pickup-date "2026-09-10"
                 :return-date "2026-09-15" :currency "USD"})]
    (is (= 5 (:days result)))
    (is (= "900.00" (:subtotal result)))
    (is (= "45.00" (:taxes_fees result)))
    (is (= "945.00" (:total result)))))

(deftest invalid-date-range
  (is (thrown-with-msg? clojure.lang.ExceptionInfo #"Validation failed"
                         (pricing/compute-breakdown
                          {:price-per-day "180.00" :pickup-date "2026-09-15"
                           :return-date "2026-09-10" :service-type "self_drive"
                           :currency "USD" :pricing-settings pricing-settings}))))
