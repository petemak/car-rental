(ns car-rental.backend.domain.presenters
  "Pure functions turning store records (snake_case keys already matching
   the wire shape, see store.seed) into the exact response maps documented
   in api-contract.md. `db` here is always a plain dereferenced map (a
   snapshot), never the atom — keeps these pure."
  (:require [car-rental.backend.store.core :as store]))

(defn category-ref [db category_id]
  (when-let [c (store/get-one db :categories category_id)]
    {:id (:id c) :name (:name c)}))

(defn location-ref [db location_id]
  (when-let [l (store/get-one db :locations location_id)]
    {:id (:id l) :name (:name l)}))

(defn vehicle-summary
  "Shape for GET /vehicles list items and GET /admin/vehicles list items."
  [db vehicle & {:keys [available admin?]}]
  (cond-> {:id (:id vehicle)
           :name (:name vehicle)
           :category (category-ref db (:category_id vehicle))
           :seats (:seats vehicle)
           :transmission (:transmission vehicle)
           :fuel_type (:fuel_type vehicle)
           :price_per_day (:price_per_day vehicle)
           :currency (:currency vehicle)
           :thumbnail_url (:thumbnail_url vehicle)
           :available (if (some? available) available (not= "retired" (:status vehicle)))
           :chauffeur_available (:chauffeur_available vehicle)
           :airport_pickup_available (:airport_pickup_available vehicle)
           :rating_avg (:rating_avg vehicle)
           :rating_count (:rating_count vehicle)}
    admin? (assoc :status (:status vehicle)
                   :created_at (:created_at vehicle)
                   :updated_at (:updated_at vehicle))))

(defn vehicle-detail
  [db vehicle & {:keys [price_breakdown availability_blocked_ranges]}]
  {:id (:id vehicle)
   :name (:name vehicle)
   :category (category-ref db (:category_id vehicle))
   :seats (:seats vehicle)
   :transmission (:transmission vehicle)
   :fuel_type (:fuel_type vehicle)
   :price_per_day (:price_per_day vehicle)
   :currency (:currency vehicle)
   :photos (mapv :url (:photos vehicle))
   :features (:features vehicle)
   :specs (:specs vehicle)
   :policies (:policies vehicle)
   :chauffeur_available (:chauffeur_available vehicle)
   :airport_pickup_available (:airport_pickup_available vehicle)
   :rating_avg (:rating_avg vehicle)
   :rating_count (:rating_count vehicle)
   :availability_blocked_ranges (or availability_blocked_ranges [])
   :price_breakdown price_breakdown})

(defn vehicle-admin-full
  "Admin single-vehicle view: same as public detail, plus status/category_id
   (editable foreign key)/timestamps."
  [db vehicle]
  (assoc (vehicle-detail db vehicle :price_breakdown nil)
         :category_id (:category_id vehicle)
         :status (:status vehicle)
         :created_at (:created_at vehicle)
         :updated_at (:updated_at vehicle)))

(defn review-public [review]
  (select-keys review [:id :customer_name :country :rating :comment :vehicle_name :created_at]))

(defn review-admin [review]
  (select-keys review [:id :customer_name :country :rating :comment :vehicle_name :vehicle_id
                        :booking_id :customer_id :status :admin_reply :created_at]))

(defn destination-summary [d]
  (select-keys d [:id :title :slug :thumbnail_url :excerpt]))

(defn destination-detail [db d]
  {:id (:id d)
   :title (:title d)
   :slug (:slug d)
   :thumbnail_url (:thumbnail_url d)
   :hero_image_url (:hero_image_url d)
   :excerpt (:excerpt d)
   :body_html (:body_html d)
   :suggested_category (category-ref db (:suggested_category_id d))})

(defn destination-admin [db d]
  (assoc (destination-detail db d) :status (:status d)))

(defn booking-summary-customer [db booking]
  (let [vehicle (store/get-one db :vehicles (:vehicle_id booking))]
    {:id (:id booking)
     :reference (:reference booking)
     :status (:status booking)
     :vehicle {:id (:id vehicle) :name (:name vehicle) :thumbnail_url (:thumbnail_url vehicle)}
     :pickup_date (:pickup_date booking)
     :return_date (:return_date booking)
     :total (get-in booking [:price_breakdown :total])
     :currency (get-in booking [:price_breakdown :currency])}))

(defn booking-summary-admin [db booking]
  (let [vehicle (store/get-one db :vehicles (:vehicle_id booking))
        customer (:customer booking)]
    {:id (:id booking)
     :reference (:reference booking)
     :customer_name (str (:first_name customer) " " (:last_name customer))
     :vehicle_name (:name vehicle)
     :pickup_date (:pickup_date booking)
     :return_date (:return_date booking)
     :status (:status booking)
     :payment_status (:payment_status booking)
     :total (get-in booking [:price_breakdown :total])
     :currency (get-in booking [:price_breakdown :currency])}))

(defn booking-detail [db booking & {:keys [admin?]}]
  (let [vehicle (store/get-one db :vehicles (:vehicle_id booking))]
    (cond-> {:id (:id booking)
             :reference (:reference booking)
             :status (:status booking)
             :vehicle {:id (:id vehicle) :name (:name vehicle) :thumbnail_url (:thumbnail_url vehicle)}
             :pickup_date (:pickup_date booking)
             :pickup_time (:pickup_time booking)
             :return_date (:return_date booking)
             :return_time (:return_time booking)
             :pickup_location (location-ref db (:pickup_location_id booking))
             :dropoff_location (location-ref db (:dropoff_location_id booking))
             :service_type (:service_type booking)
             :airport_pickup (:airport_pickup booking)
             :flight_number (:flight_number booking)
             :chauffeur_assigned (when-let [cid (:chauffeur_id booking)] {:id cid})
             :customer (select-keys (:customer booking) [:first_name :last_name :email :phone])
             :price_breakdown (:price_breakdown booking)
             :payment_status (:payment_status booking)
             :created_at (:created_at booking)}
      admin? (-> (assoc :internal_notes (:internal_notes booking))
                 (assoc :payment_provider_transaction_id (:payment_provider_transaction_id booking))))))

(defn customer-profile [customer]
  (select-keys customer [:id :first_name :last_name :email :phone :country
                          :license_number :license_expiry]))

(defn admin-user [a]
  (select-keys a [:id :name :email :role]))
