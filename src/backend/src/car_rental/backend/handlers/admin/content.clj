(ns car-rental.backend.handlers.admin.content
  "Section 13: admin — destinations / content management."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(defn list-destinations [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)]
    {:status 200 :body {:data (mapv (partial p/destination-admin db) (store/list-all db :destinations))}}))

(def DestinationWriteSchema
  [:map
   [:title {:optional true} :string]
   [:slug {:optional true} :string]
   [:thumbnail_url {:optional true} [:maybe :string]]
   [:hero_image_url {:optional true} [:maybe :string]]
   [:excerpt {:optional true} [:maybe :string]]
   [:body_html {:optional true} [:maybe :string]]
   [:suggested_category_id {:optional true} [:maybe :string]]
   [:status {:optional true} [:enum "draft" "published"]]])

(defn create [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        body (validation/validate! DestinationWriteSchema (:body-params request))
        id (store/next-id! db-atom :dest)
        now (str (java.time.Instant/now))
        d (store/insert! db-atom :destinations id
                          (merge {:status "draft" :created_at now :updated_at now} body))]
    {:status 201 :body (p/destination-admin @db-atom d)}))

(defn patch [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        _ (when-not (store/get-one @db-atom :destinations id)
            (errors/not-found! "DESTINATION_NOT_FOUND" "This guide could not be found."))
        body (validation/validate! DestinationWriteSchema (:body-params request))
        d (store/update! db-atom :destinations id
                          #(assoc (merge % body) :updated_at (str (java.time.Instant/now))))]
    {:status 200 :body (p/destination-admin @db-atom d)}))

(defn delete [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])]
    (when-not (store/get-one @db-atom :destinations id)
      (errors/not-found! "DESTINATION_NOT_FOUND" "This guide could not be found."))
    (store/delete! db-atom :destinations id)
    {:status 204}))
