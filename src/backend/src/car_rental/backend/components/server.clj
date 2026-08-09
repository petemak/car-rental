(ns car-rental.backend.components.server
  (:require [com.stuartsierra.component :as component]
            [ring.adapter.jetty :as jetty]
            [car-rental.backend.routes :as routes]))

(defrecord Server [config store jetty]
  component/Lifecycle
  (start [this]
    (if jetty
      this
      (let [ctx {:db (:conn store) :config config}
            handler (routes/make-handler ctx)
            opts (assoc (:http config) :join? false)
            server (jetty/run-jetty handler opts)]
        (println (format "Server listening on port %s" (:port opts)))
        (assoc this :jetty server))))
  (stop [this]
    (when jetty (.stop jetty))
    (assoc this :jetty nil)))

(defn new-server []
  (map->Server {}))
