(ns car-rental.backend.domain.validation-test
  (:require [clojure.test :refer [deftest is]]
            [car-rental.backend.domain.validation :as validation]))

(def Schema
  [:map [:email :string] [:rating [:int {:min 1 :max 5}]]])

(deftest validate-pass
  (is (= {:email "a@b.com" :rating 5} (validation/validate! Schema {:email "a@b.com" :rating 5}))))

(deftest validate-fail-shape
  (try
    (validation/validate! Schema {:rating 9})
    (is false "should have thrown")
    (catch clojure.lang.ExceptionInfo e
      (let [{:keys [status code fields]} (ex-data e)]
        (is (= 422 status))
        (is (= "VALIDATION_ERROR" code))
        (is (contains? fields "email"))
        (is (contains? fields "rating"))))))
