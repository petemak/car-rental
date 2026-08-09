(ns car-rental.backend.middleware.errors
  "Turns thrown ex-info (see car-rental.backend.domain.errors) and any
   other exception into the contract's error envelope:
   { \"error\": { \"code\": ..., \"message\": ..., \"fields\": {} } }.")

(defn- api-error-response [{:keys [status code message fields]}]
  {:status status
   :body {:error {:code code :message message :fields (or fields {})}}})

(defn wrap-errors [handler]
  (fn [request]
    (try
      (handler request)
      (catch clojure.lang.ExceptionInfo e
        (let [{:keys [status type] :as data} (ex-data e)]
          (cond
            status (api-error-response data)
            ;; muuntaja throws ex-info on malformed request bodies
            (= type :muuntaja/decode)
            {:status 400 :body {:error {:code "MALFORMED_REQUEST" :message "Request body could not be parsed." :fields {}}}}
            :else
            (do (println "Unexpected ex-info:" (.getMessage e) data)
                {:status 500 :body {:error {:code "INTERNAL_ERROR" :message "Something went wrong." :fields {}}}}))))
      (catch Exception e
        (println "Unhandled exception:" (.getMessage e))
        (.printStackTrace e)
        {:status 500 :body {:error {:code "INTERNAL_ERROR" :message "Something went wrong." :fields {}}}}))))
