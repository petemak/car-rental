(ns car-rental.backend.handlers.destinations
  "Section 7: destinations / content."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.errors :as errors]))

(defn list-destinations [ctx _request]
  (let [db @(:db ctx)
        published (->> (store/list-all db :destinations) (filter #(= "published" (:status %))))]
    {:status 200 :body {:data (mapv p/destination-summary published)}}))

(defn get-destination [ctx request]
  (let [db @(:db ctx)
        slug (get-in request [:path-params :slug])
        d (->> (store/list-all db :destinations)
               (filter #(and (= slug (:slug %)) (= "published" (:status %))))
               first)]
    (when-not d (errors/not-found! "DESTINATION_NOT_FOUND" "This guide could not be found."))
    {:status 200 :body (p/destination-detail db d)}))
