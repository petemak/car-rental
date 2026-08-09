(ns car-rental.backend.handlers.admin.fleet
  "Section 11: admin — fleet."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.store.availability :as availability]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(def VehicleWriteSchema
  [:map
   [:name {:optional true} :string]
   [:category_id {:optional true} :string]
   [:seats {:optional true} :int]
   [:transmission {:optional true} [:enum "automatic" "manual"]]
   [:fuel_type {:optional true} :string]
   [:price_per_day {:optional true} :string]
   [:currency {:optional true} :string]
   [:thumbnail_url {:optional true} [:maybe :string]]
   [:features {:optional true} [:vector :string]]
   [:specs {:optional true} :map]
   [:policies {:optional true} :map]
   [:chauffeur_available {:optional true} :boolean]
   [:airport_pickup_available {:optional true} :boolean]
   [:status {:optional true} [:enum "active" "maintenance" "retired"]]])

(def required-create-fields [:name :category_id :seats :transmission :fuel_type :price_per_day :currency])

(defn- validate-create! [body]
  (let [missing (remove #(contains? body %) required-create-fields)]
    (when (seq missing)
      (errors/validation! (into {} (map (fn [k] [(name k) "is required"]) missing))))))

(defn list-vehicles [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        qp (:query-params request)
        status (get qp "status")
        category (get qp "category")
        page (some-> (get qp "page") Integer/parseInt)
        per-page (some-> (get qp "per_page") Integer/parseInt)
        vehicles (cond->> (store/list-all db :vehicles)
                   status (filter #(= status (:status %)))
                   category (filter #(= category (:category_id %))))
        paginated (store/paginate (sort-by :id vehicles) {:page page :per-page per-page})]
    {:status 200 :body (update paginated :data #(mapv (fn [v] (p/vehicle-summary db v :admin? true)) %))}))

(defn create [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        body (validation/validate! VehicleWriteSchema (:body-params request))
        _ (validate-create! body)
        id (store/next-id! db-atom :veh)
        now (str (java.time.Instant/now))
        vehicle (store/insert! db-atom :vehicles id
                                (merge {:photos [] :rating_avg 0.0 :rating_count 0
                                        :chauffeur_available false :airport_pickup_available false
                                        :status "active" :created_at now :updated_at now}
                                       body))]
    {:status 201 :body (p/vehicle-admin-full @db-atom vehicle)}))

(defn get-vehicle [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])
        vehicle (store/get-one db :vehicles id)]
    (when-not vehicle (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
    {:status 200 :body (p/vehicle-admin-full db vehicle)}))

(defn patch-vehicle [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        _ (when-not (store/get-one @db-atom :vehicles id)
            (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
        body (validation/validate! VehicleWriteSchema (:body-params request))
        vehicle (store/update! db-atom :vehicles id
                                #(assoc (merge % body) :updated_at (str (java.time.Instant/now))))]
    {:status 200 :body (p/vehicle-admin-full @db-atom vehicle)}))

(defn delete-vehicle [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])]
    (when-not (store/get-one @db-atom :vehicles id)
      (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
    (store/update! db-atom :vehicles id #(assoc % :status "retired" :updated_at (str (java.time.Instant/now))))
    {:status 204}))

(defn upload-photo [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        vehicle (store/get-one @db-atom :vehicles id)
        _ (when-not vehicle (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
        file (get-in request [:multipart-params "file"])
        _ (when-not file (errors/validation! {"file" "is required"}))
        filename (:filename file "upload.jpg")
        photo-id (store/next-id! db-atom :ph)
        url (str "https://example.com/uploads/" id "/" photo-id "-" filename)]
    (store/update! db-atom :vehicles id #(update % :photos (fnil conj []) {:id photo-id :url url}))
    {:status 201 :body {:photo_id photo-id :url url}}))

(defn delete-photo [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        {:keys [id photo_id]} (:path-params request)]
    (when-not (store/get-one @db-atom :vehicles id)
      (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
    (store/update! db-atom :vehicles id #(update % :photos (fn [ps] (vec (remove (fn [p] (= photo_id (:id p))) ps)))))
    {:status 204}))

(defn get-availability [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])]
    (when-not (store/get-one db :vehicles id)
      (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
    {:status 200
     :body {:blocked_ranges (vec (availability/blocked-ranges db id))
            :booked_ranges (vec (availability/booked-ranges db id))}}))

(def BlockDatesSchema
  [:map [:start_date :string] [:end_date :string] [:reason {:optional true} [:maybe :string]]])

(defn block-dates [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        _ (when-not (store/get-one @db-atom :vehicles id)
            (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
        body (validation/validate! BlockDatesSchema (:body-params request))
        block-id (store/next-id! db-atom :blk)
        block (store/insert! db-atom :blocked_dates block-id (assoc body :vehicle_id id))]
    {:status 201 :body block}))

(defn delete-block [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        {:keys [block_id]} (:path-params request)]
    (store/delete! db-atom :blocked_dates block_id)
    {:status 204}))
