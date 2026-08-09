(ns car-rental.backend.domain.errors
  "API errors as ex-info, matching the contract's error envelope:
   { \"error\": { \"code\": ..., \"message\": ..., \"fields\": {} } }.
   Thrown from handlers/domain code, turned into HTTP responses by
   car-rental.backend.middleware.errors/wrap-errors.")

(defn api-ex
  ([status code message] (api-ex status code message {}))
  ([status code message fields]
   (ex-info message {:status status :code code :message message :fields (or fields {})})))

(defn throw-api! [status code message & [fields]]
  (throw (api-ex status code message fields)))

(defn bad-request! [code message & [fields]] (throw-api! 400 code message fields))
(defn unauthorized! [code message & [fields]] (throw-api! 401 code message fields))
(defn forbidden! [code message & [fields]] (throw-api! 403 code message fields))
(defn not-found! [code message & [fields]] (throw-api! 404 code message fields))
(defn conflict! [code message & [fields]] (throw-api! 409 code message fields))
(defn validation! [fields & [message]]
  (throw-api! 422 "VALIDATION_ERROR" (or message "Validation failed.") fields))
