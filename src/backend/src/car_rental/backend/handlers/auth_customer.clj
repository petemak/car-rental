(ns car-rental.backend.handlers.auth-customer
  "Section 5: customer auth & account."
  (:require [buddy.hashers :as hashers]
            [car-rental.backend.store.core :as store]
            [car-rental.backend.store.tokens :as tokens]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth])
  (:import [java.util UUID]))

(def RegisterRequest
  [:map
   [:first_name :string]
   [:last_name :string]
   [:email :string]
   [:password :string]
   [:phone {:optional true} [:maybe :string]]])

(def LoginRequest
  [:map [:email :string] [:password :string]])

(defn- find-by-email [db email]
  (->> (store/list-all db :customers) (filter #(= email (:email %))) first))

(defn- issue-pair [ctx db-atom customer]
  {:token (auth/customer-token ctx customer)
   :refresh_token (tokens/issue! db-atom :customer (:id customer)
                                  (get-in ctx [:config :auth :refresh-token-ttl-seconds]))})

(defn register [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        body (validation/validate! RegisterRequest (:body-params request))]
    (when (find-by-email db (:email body))
      (errors/throw-api! 422 "EMAIL_TAKEN" "An account with this email already exists."
                          {"email" "is already registered"}))
    (let [id (store/next-id! db-atom :cust)
          customer (store/insert! db-atom :customers id
                                   {:first_name (:first_name body)
                                    :last_name (:last_name body)
                                    :email (:email body)
                                    :phone (:phone body)
                                    :country nil
                                    :license_number nil
                                    :license_expiry nil
                                    :password_hash (hashers/derive (:password body))
                                    :created_at (str (java.time.Instant/now))})
          {:keys [token refresh_token]} (issue-pair ctx db-atom customer)]
      {:status 201 :body {:customer_id id :token token :refresh_token refresh_token}})))

(defn login [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        body (validation/validate! LoginRequest (:body-params request))
        customer (find-by-email db (:email body))]
    (when (or (nil? customer) (not (hashers/check (:password body) (:password_hash customer))))
      (errors/unauthorized! "INVALID_CREDENTIALS" "Email or password is incorrect."))
    (let [{:keys [token refresh_token]} (issue-pair ctx db-atom customer)]
      {:status 200
       :body {:token token
              :refresh_token refresh_token
              :customer {:id (:id customer) :first_name (:first_name customer) :email (:email customer)}}})))

(defn logout [ctx request]
  (let [db-atom (:db ctx)
        {:keys [refresh_token]} (:body-params request)]
    (when refresh_token (tokens/revoke! db-atom :customer refresh_token))
    {:status 204}))

(defn refresh [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        {:keys [refresh_token]} (:body-params request)
        customer-id (and refresh_token (tokens/lookup db :customer refresh_token))]
    (when-not customer-id
      (errors/unauthorized! "INVALID_REFRESH_TOKEN" "Refresh token is invalid or expired."))
    (let [customer (store/get-one db :customers customer-id)]
      {:status 200 :body {:token (auth/customer-token ctx customer)}})))

(defn forgot-password [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        {:keys [email]} (:body-params request)
        customer (find-by-email db email)]
    (when customer
      (let [token (str (UUID/randomUUID))]
        (store/put-raw! db-atom :password_reset_tokens token
                         {:customer-id (:id customer)
                          :expires-at (.plusSeconds (java.time.Instant/now) 3600)})))
    {:status 204}))

(defn reset-password [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        {:keys [token new_password]} (:body-params request)
        entry (get-in db [:password_reset_tokens token])]
    (when (or (nil? entry) (.isBefore (:expires-at entry) (java.time.Instant/now)))
      (errors/unauthorized! "INVALID_RESET_TOKEN" "This reset token is invalid or expired."))
    (store/update! db-atom :customers (:customer-id entry)
                   #(assoc % :password_hash (hashers/derive new_password)))
    (store/delete! db-atom :password_reset_tokens token)
    {:status 204}))

(defn profile [ctx request]
  (let [db @(:db ctx)
        claims (auth/require-customer! ctx request)
        customer (store/get-one db :customers (:sub claims))]
    (when-not customer (errors/not-found! "CUSTOMER_NOT_FOUND" "Customer not found."))
    {:status 200 :body (p/customer-profile customer)}))

(def ProfileUpdateRequest
  [:map
   [:first_name {:optional true} :string]
   [:last_name {:optional true} :string]
   [:phone {:optional true} :string]
   [:country {:optional true} :string]
   [:license_number {:optional true} :string]
   [:license_expiry {:optional true} :string]])

(defn update-profile [ctx request]
  (let [db-atom (:db ctx)
        claims (auth/require-customer! ctx request)
        body (validation/validate! ProfileUpdateRequest (:body-params request))
        updated (store/update! db-atom :customers (:sub claims) merge body)]
    {:status 200 :body (p/customer-profile updated)}))
