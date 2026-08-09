(ns car-rental.backend.handlers.admin.pricing
  "Section 13: admin — pricing & extras. Both the settings and
   seasonal-rates endpoints are super_admin only per api-contract.md."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(defn get-settings [ctx request]
  (auth/require-admin! ctx request)
  {:status 200 :body (store/get-singleton @(:db ctx) :pricing_settings)})

(def PricingSettingsPatch
  [:map
   [:payment_model {:optional true} [:enum "full" "deposit"]]
   [:deposit_percentage {:optional true} :int]
   [:currency_default {:optional true} :string]
   [:extras {:optional true}
    [:map
     [:chauffeur_fee_per_day {:optional true} :string]
     [:airport_pickup_fee {:optional true} :string]
     [:additional_driver_fee {:optional true} :string]
     [:child_seat_fee {:optional true} :string]]]])

(defn patch-settings [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  (let [db-atom (:db ctx)
        body (validation/validate! PricingSettingsPatch (:body-params request))
        updated (store/update-singleton! db-atom :pricing_settings
                                          (fn [current]
                                            (-> current
                                                (merge (dissoc body :extras))
                                                (update :extras merge (:extras body)))))]
    {:status 200 :body updated}))

(defn list-seasonal-rates [ctx request]
  (auth/require-admin! ctx request)
  {:status 200 :body {:data (vec (store/list-all @(:db ctx) :seasonal_rates))}})

(def SeasonalRateSchema
  [:map
   [:vehicle_id {:optional true} [:maybe :string]]
   [:category_id {:optional true} [:maybe :string]]
   [:start_date :string]
   [:end_date :string]
   [:price_per_day :string]
   [:currency :string]])

(defn create-seasonal-rate [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  (let [db-atom (:db ctx)
        body (validation/validate! SeasonalRateSchema (:body-params request))
        id (store/next-id! db-atom :sr)
        rate (store/insert! db-atom :seasonal_rates id body)]
    {:status 201 :body rate}))

(defn delete-seasonal-rate [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])]
    (when-not (store/get-one @db-atom :seasonal_rates id)
      (errors/not-found! "SEASONAL_RATE_NOT_FOUND" "This seasonal rate could not be found."))
    (store/delete! db-atom :seasonal_rates id)
    {:status 204}))
