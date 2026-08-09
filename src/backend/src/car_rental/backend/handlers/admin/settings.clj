(ns car-rental.backend.handlers.admin.settings
  "Section 13: admin — business settings."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.auth.context :as auth]))

(defn get-settings [ctx request]
  (auth/require-admin! ctx request)
  {:status 200 :body (store/get-singleton @(:db ctx) :settings)})

(def SettingsPatchSchema
  [:map
   [:business_name {:optional true} :string]
   [:contact_email {:optional true} :string]
   [:contact_phone {:optional true} :string]
   [:whatsapp_number {:optional true} :string]
   [:office_address {:optional true} :string]
   [:notification_templates {:optional true} :map]
   [:payment_provider {:optional true}
    [:map [:provider {:optional true} :string] [:public_key {:optional true} :string]]]])

(defn patch-settings [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  (let [db-atom (:db ctx)
        body (validation/validate! SettingsPatchSchema (:body-params request))
        updated (store/update-singleton! db-atom :settings
                                          (fn [current]
                                            (-> current
                                                (merge (dissoc body :notification_templates :payment_provider))
                                                (update :notification_templates merge (:notification_templates body))
                                                (update :payment_provider merge (:payment_provider body)))))]
    {:status 200 :body updated}))
