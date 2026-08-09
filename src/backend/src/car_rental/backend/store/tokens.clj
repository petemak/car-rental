(ns car-rental.backend.store.tokens
  "Opaque refresh-token bookkeeping (separate from short-lived signed JWT
   access tokens) for both customer and admin auth."
  (:require [car-rental.backend.store.core :as store])
  (:import [java.util UUID]
           [java.time Instant]))

(defn- table [kind] (case kind :customer :customer_refresh_tokens :admin :admin_refresh_tokens))

(defn issue! [db-atom kind subject-id ttl-seconds]
  (let [token (str (UUID/randomUUID))
        expires-at (.plusSeconds (Instant/now) ttl-seconds)]
    (store/put-raw! db-atom (table kind) token {:subject-id subject-id :expires-at expires-at})
    token))

(defn lookup [db kind token]
  (let [{:keys [subject-id expires-at] :as entry} (get-in db [(table kind) token])]
    (when (and entry (.isAfter ^Instant expires-at (Instant/now)))
      subject-id)))

(defn revoke! [db-atom kind token]
  (store/delete! db-atom (table kind) token))
