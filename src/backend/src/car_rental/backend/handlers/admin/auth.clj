(ns car-rental.backend.handlers.admin.auth
  "Section 10: admin auth."
  (:require [buddy.hashers :as hashers]
            [car-rental.backend.store.core :as store]
            [car-rental.backend.store.tokens :as tokens]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(def LoginRequest [:map [:email :string] [:password :string]])

(defn- find-by-email [db email]
  (->> (store/list-all db :admin_users) (filter #(= email (:email %))) first))

(defn login [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        body (validation/validate! LoginRequest (:body-params request))
        admin (find-by-email db (:email body))]
    (when (or (nil? admin) (not (hashers/check (:password body) (:password_hash admin))))
      (errors/unauthorized! "INVALID_CREDENTIALS" "Email or password is incorrect."))
    (let [token (auth/admin-token ctx admin)
          refresh-token (tokens/issue! db-atom :admin (:id admin)
                                        (get-in ctx [:config :auth :refresh-token-ttl-seconds]))]
      {:status 200 :body {:token token :refresh_token refresh-token :admin (p/admin-user admin)}})))

(defn logout [ctx request]
  (let [db-atom (:db ctx)
        {:keys [refresh_token]} (:body-params request)]
    (when refresh_token (tokens/revoke! db-atom :admin refresh_token))
    {:status 204}))

(defn refresh [ctx request]
  (let [db-atom (:db ctx)
        db @db-atom
        {:keys [refresh_token]} (:body-params request)
        admin-id (and refresh_token (tokens/lookup db :admin refresh_token))]
    (when-not admin-id
      (errors/unauthorized! "INVALID_REFRESH_TOKEN" "Refresh token is invalid or expired."))
    (let [admin (store/get-one db :admin_users admin-id)]
      {:status 200 :body {:token (auth/admin-token ctx admin)}})))
