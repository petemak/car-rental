(ns car-rental.backend.handlers.admin.users
  "Section 13: admin — admin users & roles. super_admin only for all four
   endpoints per api-contract.md."
  (:require [buddy.hashers :as hashers]
            [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.presenters :as p]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(defn list-users [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  {:status 200 :body {:data (mapv p/admin-user (store/list-all @(:db ctx) :admin_users))}})

(def UserCreateSchema
  [:map
   [:name :string]
   [:email :string]
   [:password :string]
   [:role [:enum "super_admin" "booking_staff"]]])

(defn create [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  (let [db-atom (:db ctx)
        body (validation/validate! UserCreateSchema (:body-params request))
        id (store/next-id! db-atom :adm)
        admin (store/insert! db-atom :admin_users id
                              {:name (:name body) :email (:email body) :role (:role body)
                               :password_hash (hashers/derive (:password body))
                               :created_at (str (java.time.Instant/now))})]
    {:status 201 :body (p/admin-user admin)}))

(def UserPatchSchema
  [:map
   [:name {:optional true} :string]
   [:email {:optional true} :string]
   [:password {:optional true} :string]
   [:role {:optional true} [:enum "super_admin" "booking_staff"]]])

(defn patch [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        _ (when-not (store/get-one @db-atom :admin_users id)
            (errors/not-found! "ADMIN_USER_NOT_FOUND" "This admin user could not be found."))
        body (validation/validate! UserPatchSchema (:body-params request))
        update-fn (fn [current]
                    (cond-> (merge current (dissoc body :password))
                      (:password body) (assoc :password_hash (hashers/derive (:password body)))))
        admin (store/update! db-atom :admin_users id update-fn)]
    {:status 200 :body (p/admin-user admin)}))

(defn delete [ctx request]
  (auth/require-admin! ctx request #{"super_admin"})
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])]
    (when-not (store/get-one @db-atom :admin_users id)
      (errors/not-found! "ADMIN_USER_NOT_FOUND" "This admin user could not be found."))
    (store/delete! db-atom :admin_users id)
    {:status 204}))
