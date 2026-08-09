(ns car-rental.backend.test-runner
  "Entry point for `clojure -M:test`. Requires and runs every *_test
   namespace under test/, exits non-zero on failure so CI can gate on it."
  (:require [clojure.test :as t]
            car-rental.backend.domain.money-test
            car-rental.backend.domain.pricing-test
            car-rental.backend.domain.validation-test
            car-rental.backend.store.core-test
            car-rental.backend.api-test))

(defn -main [& _args]
  (let [{:keys [fail error]}
        (t/run-tests 'car-rental.backend.domain.money-test
                      'car-rental.backend.domain.pricing-test
                      'car-rental.backend.domain.validation-test
                      'car-rental.backend.store.core-test
                      'car-rental.backend.api-test)]
    (System/exit (if (zero? (+ fail error)) 0 1))))
