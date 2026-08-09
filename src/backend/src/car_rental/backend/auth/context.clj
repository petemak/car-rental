(ns car-rental.backend.auth.context
  "Auth helpers used by handlers. Handlers receive a `ctx` map
   ({:db <atom> :config <map>}) as their first argument (see
   car-rental.backend.routes), so these all take ctx + request rather than
   relying on ring middleware to have already stashed an :identity —
   different endpoints need different auth strategies (optional, customer,
   admin+role, or guest reference+email), which is easier to express as
   explicit calls at the top of each handler than as generic middleware."
  (:require [car-rental.backend.auth.jwt :as jwt]
            [car-rental.backend.domain.errors :as errors]))

(defn- secret [ctx] (get-in ctx [:config :auth :jwt-secret]))

(defn decode-token [ctx request]
  (when-let [token (jwt/bearer-token request)]
    (jwt/unsign (secret ctx) token)))

(defn customer-claims
  "Returns claims if the request bears a valid customer token, else nil."
  [ctx request]
  (let [claims (decode-token ctx request)]
    (when (= "customer" (:type claims)) claims)))

(defn admin-claims
  [ctx request]
  (let [claims (decode-token ctx request)]
    (when (= "admin" (:type claims)) claims)))

(defn require-customer!
  [ctx request]
  (or (customer-claims ctx request)
      (errors/unauthorized! "UNAUTHENTICATED" "A valid customer token is required.")))

(defn require-admin!
  "roles: optional set of allowed roles, e.g. #{\"super_admin\"}."
  ([ctx request] (require-admin! ctx request nil))
  ([ctx request roles]
   (let [claims (or (admin-claims ctx request)
                     (errors/unauthorized! "UNAUTHENTICATED" "A valid admin token is required."))]
     (when (and roles (not (contains? roles (:role claims))))
       (errors/forbidden! "FORBIDDEN" "Your role does not have access to this resource."))
     claims)))

(defn customer-token [ctx customer]
  (jwt/sign (secret ctx) {:sub (:id customer) :type "customer"}
            (get-in ctx [:config :auth :customer-token-ttl-seconds])))

(defn admin-token [ctx admin]
  (jwt/sign (secret ctx) {:sub (:id admin) :type "admin" :role (:role admin)}
            (get-in ctx [:config :auth :admin-token-ttl-seconds])))
