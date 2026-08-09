(ns car-rental.backend.handlers.catalog
  "Section 1: public catalog / search endpoints."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.store.availability :as availability]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.pricing :as pricing]
            [car-rental.backend.domain.errors :as errors]))

(defn list-categories [ctx _request]
  (let [db @(:db ctx)]
    {:status 200 :body {:data (->> (store/list-all db :categories) (sort-by :id) vec)}}))

(defn list-locations [ctx _request]
  (let [db @(:db ctx)]
    {:status 200 :body {:data (->> (store/list-all db :locations) (sort-by :id) vec)}}))

(defn- active-vehicles [db]
  (->> (store/list-all db :vehicles) (remove #(= "retired" (:status %)))))

(defn- apply-filters [vehicles qp db]
  (cond->> vehicles
    (:category qp) (filter #(= (:category qp) (:category_id %)))
    (:service_type qp) (filter (fn [v] (case (:service_type qp)
                                          "chauffeur" (:chauffeur_available v)
                                          "self_drive" true
                                          true)))
    (:transmission qp) (filter #(= (:transmission qp) (:transmission %)))
    (:min_seats qp) (filter #(>= (:seats %) (:min_seats qp)))
    (:price_min qp) (filter #(>= (bigdec (:price_per_day %)) (bigdec (:price_min qp))))
    (:price_max qp) (filter #(<= (bigdec (:price_per_day %)) (bigdec (:price_max qp))))
    (and (:pickup_date qp) (:return_date qp))
    (map (fn [v] (assoc v :__available
                         (availability/available? db (:id v) (:pickup_date qp) (:return_date qp)))))))

(defn- apply-sort [vehicles sort-key]
  (case sort-key
    "price_asc" (sort-by #(bigdec (:price_per_day %)) vehicles)
    "price_desc" (sort-by #(bigdec (:price_per_day %)) #(compare %2 %1) vehicles)
    (sort-by (juxt #(- (:rating_avg % 0)) :name) vehicles)))

(defn- parse-query [qp]
  {:pickup_date (get qp "pickup_date")
   :return_date (get qp "return_date")
   :pickup_location_id (get qp "pickup_location_id")
   :category (get qp "category")
   :service_type (get qp "service_type")
   :transmission (get qp "transmission")
   :min_seats (some-> (get qp "min_seats") Integer/parseInt)
   :price_min (get qp "price_min")
   :price_max (get qp "price_max")
   :sort (get qp "sort" "recommended")
   :page (some-> (get qp "page") Integer/parseInt)
   :per_page (some-> (get qp "per_page") Integer/parseInt)})

(defn list-vehicles [ctx request]
  (let [db @(:db ctx)
        qp (parse-query (:query-params request))]
    (when (and (:pickup_date qp) (not (:return_date qp)))
      (errors/validation! {"return_date" "is required when pickup_date is given"}))
    (let [vehicles (-> (active-vehicles db) (apply-filters qp db) (apply-sort (:sort qp)))
          page (store/paginate vehicles {:page (:page qp) :per-page (:per_page qp)})]
      {:status 200
       :body (assoc page :data (mapv (fn [v] (p/vehicle-summary db v
                                                                  :available (:__available v (not= "retired" (:status v)))))
                                      (:data page)))})))

(defn get-vehicle [ctx request]
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])
        vehicle (store/get-one db :vehicles id)
        qp (:query-params request)
        pickup (get qp "pickup_date")
        return (get qp "return_date")]
    (when (or (nil? vehicle) (= "retired" (:status vehicle)))
      (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
    (let [breakdown (when (and pickup return)
                       (pricing/vehicle-detail-breakdown
                        {:price-per-day (:price_per_day vehicle)
                         :pickup-date pickup
                         :return-date return
                         :currency (:currency vehicle)}))]
      {:status 200
       :body (p/vehicle-detail db vehicle
                                :price_breakdown breakdown
                                :availability_blocked_ranges (availability/public-blocked-ranges db id))})))
