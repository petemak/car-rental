(ns car-rental.backend.store.core-test
  (:require [clojure.test :refer [deftest is]]
            [car-rental.backend.store.core :as store]))

(deftest paginate-test
  (let [items (map (fn [i] {:id i}) (range 25))
        page1 (store/paginate items {:page 1 :per-page 10})
        page3 (store/paginate items {:page 3 :per-page 10})]
    (is (= 10 (count (:data page1))))
    (is (= {:page 1 :per_page 10 :total_count 25 :total_pages 3} (:meta page1)))
    (is (= 5 (count (:data page3))))))

(deftest next-id-test
  (let [db (atom {:counters {}})]
    (is (= "veh_1001" (store/next-id! db :veh)))
    (is (= "veh_1002" (store/next-id! db :veh)))
    (is (= "bk_1001" (store/next-id! db :bk)))))

(deftest dates-overlap-test
  (is (true? (store/dates-overlap? "2026-09-01" "2026-09-05" "2026-09-03" "2026-09-10")))
  (is (false? (store/dates-overlap? "2026-09-01" "2026-09-05" "2026-09-05" "2026-09-10"))))
