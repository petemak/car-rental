(ns car-rental.backend.middleware.idempotency
  "Section 0: `POST /bookings` and `POST /payments/intent` accept an
   optional Idempotency-Key header; replaying the same key returns the
   original response instead of creating a duplicate."
  (:require [car-rental.backend.store.core :as store]))

(defn header-key [request]
  (get-in request [:headers "idempotency-key"]))

(defn wrap-idempotent
  "Wraps a handler-fn (ctx request -> ring response) so that if the request
   carries an Idempotency-Key header, a prior successful (2xx) response for
   the same key + route is replayed instead of re-running handler-fn."
  [route-name ctx handler-fn]
  (fn [request]
    (let [db-atom (:db ctx)
          key (header-key request)
          cache-key (when key (str route-name ":" key))]
      (if-let [cached (and cache-key (store/get-one @db-atom :idempotency cache-key))]
        cached
        (let [response (handler-fn ctx request)]
          (when (and cache-key (<= 200 (:status response) 299))
            (store/put-raw! db-atom :idempotency cache-key response))
          response)))))
