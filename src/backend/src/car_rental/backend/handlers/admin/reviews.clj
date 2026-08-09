(ns car-rental.backend.handlers.admin.reviews
  "Section 13: admin — reviews moderation."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(defn list-reviews [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        qp (:query-params request)
        status (get qp "status")
        page (some-> (get qp "page") Integer/parseInt)
        per-page (some-> (get qp "per_page") Integer/parseInt)
        reviews (cond->> (store/list-all db :reviews)
                  status (filter #(= status (:status %))))
        paginated (store/paginate (sort-by :created_at #(compare %2 %1) reviews)
                                   {:page page :per-page per-page})]
    {:status 200 :body (update paginated :data #(mapv p/review-admin %))}))

(def ReviewPatchSchema
  [:map
   [:status {:optional true} [:enum "pending_moderation" "approved" "rejected"]]
   [:admin_reply {:optional true} [:maybe :string]]])

(defn patch-review [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        _ (when-not (store/get-one @db-atom :reviews id)
            (errors/not-found! "REVIEW_NOT_FOUND" "This review could not be found."))
        body (validation/validate! ReviewPatchSchema (:body-params request))
        review (store/update! db-atom :reviews id merge body)]
    {:status 200 :body (p/review-admin review)}))
