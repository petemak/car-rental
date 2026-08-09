(ns car-rental.backend.handlers.pricing
  "Section 2: POST /pricing/quote."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.store.availability :as availability]
            [car-rental.backend.domain.pricing :as calc]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]))

(def QuoteRequest
  [:map
   [:vehicle_id :string]
   [:pickup_date :string]
   [:return_date :string]
   [:service_type [:enum "self_drive" "chauffeur"]]
   [:airport_pickup {:optional true} :boolean]
   [:additional_driver {:optional true} :boolean]
   [:child_seat {:optional true} :boolean]])

(defn quote [ctx request]
  (let [db @(:db ctx)
        body (validation/validate! QuoteRequest (:body-params request))
        vehicle (store/get-one db :vehicles (:vehicle_id body))]
    (when (or (nil? vehicle) (= "retired" (:status vehicle)))
      (errors/not-found! "VEHICLE_NOT_FOUND" "This vehicle could not be found."))
    (calc/validate-date-range! (:pickup_date body) (:return_date body) (str (java.time.LocalDate/now)))
    (when-not (availability/available? db (:vehicle_id body) (:pickup_date body) (:return_date body))
      (errors/conflict! "VEHICLE_NOT_AVAILABLE" "This vehicle is not available for the selected dates."))
    (let [breakdown (calc/compute-breakdown
                      {:price-per-day (:price_per_day vehicle)
                       :pickup-date (:pickup_date body)
                       :return-date (:return_date body)
                       :service-type (:service_type body)
                       :airport-pickup? (boolean (:airport_pickup body))
                       :additional-driver? (boolean (:additional_driver body))
                       :child-seat? (boolean (:child_seat body))
                       :currency (:currency vehicle)
                       :pricing-settings (store/get-singleton db :pricing_settings)})]
      {:status 200 :body (dissoc breakdown :days)})))
