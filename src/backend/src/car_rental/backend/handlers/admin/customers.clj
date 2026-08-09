(ns car-rental.backend.handlers.admin.customers
  "Section 13: admin — customers."
  (:require [clojure.string :as str]
            [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(defn- bookings-for [db customer_id]
  (->> (store/list-all db :bookings) (filter #(= customer_id (:customer_id %)))))

(defn- summary [db customer]
  (let [bookings (bookings-for db (:id customer))]
    {:id (:id customer)
     :first_name (:first_name customer)
     :last_name (:last_name customer)
     :email (:email customer)
     :phone (:phone customer)
     :bookings_count (count bookings)
     :last_booking_date (->> bookings (map :pickup_date) (sort) last)}))

(defn list-customers [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        qp (:query-params request)
        search (some-> (get qp "search") str/lower-case)
        page (some-> (get qp "page") Integer/parseInt)
        per-page (some-> (get qp "per_page") Integer/parseInt)
        customers (cond->> (store/list-all db :customers)
                    search (filter (fn [c] (or (str/includes? (str/lower-case (:email c "")) search)
                                                (str/includes? (str/lower-case (:first_name c "")) search)
                                                (str/includes? (str/lower-case (:last_name c "")) search)))))
        paginated (store/paginate (sort-by :email customers) {:page page :per-page per-page})]
    {:status 200 :body (update paginated :data #(mapv (partial summary db) %))}))

(defn get-customer [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])
        customer (store/get-one db :customers id)]
    (when-not customer (errors/not-found! "CUSTOMER_NOT_FOUND" "This customer could not be found."))
    {:status 200 :body (assoc (p/customer-profile customer)
                               :bookings (mapv (partial p/booking-summary-admin db) (bookings-for db id)))}))
