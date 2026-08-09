(ns car-rental.backend.handlers.admin.bookings
  "Section 12: admin — bookings."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]
            [car-rental.backend.handlers.notifications :as notify]))

(defn list-bookings [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        qp (:query-params request)
        status (get qp "status")
        date-from (get qp "date_from")
        date-to (get qp "date_to")
        vehicle_id (get qp "vehicle_id")
        page (some-> (get qp "page") Integer/parseInt)
        per-page (some-> (get qp "per_page") Integer/parseInt)
        bookings (cond->> (store/list-all db :bookings)
                   status (filter #(= status (:status %)))
                   vehicle_id (filter #(= vehicle_id (:vehicle_id %)))
                   date-from (filter #(>= (compare (:pickup_date %) date-from) 0))
                   date-to (filter #(<= (compare (:pickup_date %) date-to) 0)))
        paginated (store/paginate (sort-by :created_at #(compare %2 %1) bookings)
                                   {:page page :per-page per-page})]
    {:status 200 :body (update paginated :data #(mapv (partial p/booking-summary-admin db) %))}))

(defn get-booking [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])
        booking (store/get-one db :bookings id)]
    (when-not booking (errors/not-found! "BOOKING_NOT_FOUND" "This booking could not be found."))
    {:status 200 :body (p/booking-detail db booking :admin? true)}))

(def BookingPatchSchema
  [:map
   [:status {:optional true} [:enum "pending_payment" "confirmed" "in_progress" "completed" "cancelled"]]
   [:chauffeur_id {:optional true} [:maybe :string]]
   [:internal_notes {:optional true} :string]])

(defn patch-booking [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        _ (when-not (store/get-one @db-atom :bookings id)
            (errors/not-found! "BOOKING_NOT_FOUND" "This booking could not be found."))
        body (validation/validate! BookingPatchSchema (:body-params request))
        booking (store/update! db-atom :bookings id
                                #(assoc (merge % body) :updated_at (str (java.time.Instant/now))))]
    {:status 200 :body (p/booking-detail @db-atom booking :admin? true)}))

(defn resend-confirmation [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        db @db-atom
        id (get-in request [:path-params :id])
        booking (store/get-one db :bookings id)]
    (when-not booking (errors/not-found! "BOOKING_NOT_FOUND" "This booking could not be found."))
    (notify/notify! db-atom :booking_confirmed {:reference (:reference booking)
                                                 :email (get-in booking [:customer :email])})
    {:status 204}))
