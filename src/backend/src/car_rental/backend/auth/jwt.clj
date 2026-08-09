(ns car-rental.backend.auth.jwt
  "Thin wrapper around buddy-sign for the Bearer JWT tokens the contract
   requires (Section 0: 'Auth: Bearer JWT in Authorization: Bearer <token>
   header'). Two token 'kinds' share this: customer tokens (:sub customer
   id) and admin tokens (:sub admin id, :role super_admin|booking_staff)."
  (:require [buddy.sign.jwt :as jwt]
            [clojure.string :as str]))

(defn sign
  "claims: a map, must include :sub. exp is set ttl-seconds from now."
  [secret claims ttl-seconds]
  (jwt/sign (assoc claims :exp (+ (quot (System/currentTimeMillis) 1000) ttl-seconds))
            secret
            {:alg :hs256}))

(defn unsign
  "Returns the claims map, or nil if the token is missing/invalid/expired."
  [secret token]
  (try
    (jwt/unsign token secret {:alg :hs256})
    (catch Exception _ nil)))

(defn bearer-token [request]
  (when-let [header (get-in request [:headers "authorization"])]
    (when (re-find #"(?i)^bearer\s+" header)
      (str/trim (str/replace-first header #"(?i)^bearer\s+" "")))))
