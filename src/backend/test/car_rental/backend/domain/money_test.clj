(ns car-rental.backend.domain.money-test
  (:require [clojure.test :refer [deftest is testing]]
            [car-rental.backend.domain.money :as money]))

(deftest round2-test
  (is (= "22.05" (money/->str 22.05)))
  (is (= "382.73" (money/->str 382.725M)))) ; HALF_UP

(deftest add-test
  (is (= "1215.00" (money/->str (money/add "900.00" "250.00" "40.00" "0.00" "25.00")))))

(deftest percent-of-test
  (testing "matches api-contract.md's worked example"
    (is (= "382.73" (money/->str (money/percent-of "1275.75" 30))))))
