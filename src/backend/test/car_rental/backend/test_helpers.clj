(ns car-rental.backend.test-helpers
  "Builds a fresh in-process app (routes/make-handler over a fresh in-memory
   store) per test, and helpers to fire real ring request maps through it —
   exercising the full middleware stack (muuntaja encode/decode, params,
   errors, idempotency) rather than calling handler fns directly."
  (:require [cheshire.core :as json]
            [car-rental.backend.config :as config]
            [car-rental.backend.components.store :as store]
            [car-rental.backend.routes :as routes])
  (:import [java.io ByteArrayInputStream]
           [java.nio.charset StandardCharsets]))

(defn fresh-ctx []
  (let [cfg (config/load-config)
        st (store/new-store {:seed? true})
        started (.start st)]
    {:db (:conn started) :config cfg}))

(defn fresh-app []
  (routes/make-handler (fresh-ctx)))

(defn- body-stream [data]
  (ByteArrayInputStream. (.getBytes (json/generate-string data) StandardCharsets/UTF_8)))

(defn req
  ([app method uri] (req app method uri nil {}))
  ([app method uri body] (req app method uri body {}))
  ([app method uri body {:keys [headers query-string]}]
   (let [base {:request-method method
               :uri uri
               :query-string query-string
               :headers (merge {"content-type" "application/json"} headers)}
         base (if body (assoc base :body (body-stream body)) base)]
     (app base))))

(defn json-body [response]
  (let [b (:body response)]
    (cond
      (string? b) (json/parse-string b true)
      (instance? java.io.InputStream b) (json/parse-string (slurp b) true)
      :else b)))

(defn auth-header [token]
  {"authorization" (str "Bearer " token)})
