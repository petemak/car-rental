(ns car-rental.backend.handlers.reviews
  "Section 6: reviews."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]
            [car-rental.backend.handlers.notifications :as notify]))

(defn- aggregate [reviews]
  (if (empty? reviews)
    {:average_rating 0.0 :count 0}
    {:average_rating (double (/ (reduce + (map :rating reviews)) (count reviews)))
     :count (count reviews)}))

(defn list-reviews [ctx request]
  (let [db @(:db ctx)
        qp (:query-params request)
        vehicle_id (get qp "vehicle_id")
        category (get qp "category")
        page (some-> (get qp "page") Integer/parseInt)
        per-page (some-> (get qp "per_page") Integer/parseInt)
        approved (->> (store/list-all db :reviews) (filter #(= "approved" (:status %))))
        by-vehicle (cond->> approved
                     vehicle_id (filter #(= vehicle_id (:vehicle_id %)))
                     category (filter (fn [r]
                                         (= category (get-in (store/get-one db :vehicles (:vehicle_id r))
                                                              [:category_id])))))
        paginated (store/paginate (sort-by :created_at #(compare %2 %1) by-vehicle)
                                   {:page page :per-page per-page})]
    {:status 200
     :body (-> paginated
               (update :data #(mapv p/review-public %))
               (assoc :aggregate (aggregate by-vehicle)))}))

(def ReviewCreateRequest
  [:map [:booking_id :string] [:rating [:int {:min 1 :max 5}]] [:comment :string]])

(defn create [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        claims (auth/require-customer! ctx request)
        body (validation/validate! ReviewCreateRequest (:body-params request))
        booking (store/get-one db :bookings (:booking_id body))]
    (when (or (nil? booking)
              (not= "completed" (:status booking))
              (not= (:customer_id booking) (:sub claims)))
      (errors/forbidden! "BOOKING_NOT_ELIGIBLE" "This booking is not eligible for a review."))
    (when (->> (store/list-all db :reviews) (some #(= (:booking_id body) (:booking_id %))))
      (errors/conflict! "REVIEW_ALREADY_EXISTS" "A review already exists for this booking."))
    (let [vehicle (store/get-one db :vehicles (:vehicle_id booking))
          id (store/next-id! db-atom :rev)
          review (store/insert! db-atom :reviews id
                                 {:customer_name (str (get-in booking [:customer :first_name]) " "
                                                       (subs (get-in booking [:customer :last_name]) 0 1) ".")
                                  :country (get-in booking [:customer :country])
                                  :rating (:rating body)
                                  :comment (:comment body)
                                  :vehicle_id (:vehicle_id booking)
                                  :vehicle_name (:name vehicle)
                                  :booking_id (:booking_id body)
                                  :customer_id (:sub claims)
                                  :status "pending_moderation"
                                  :admin_reply nil
                                  :created_at (str (java.time.Instant/now))})]
      (notify/notify! db-atom :admin_review_submitted {:id (:id review)})
      {:status 201 :body {:id id :status "pending_moderation"}})))
