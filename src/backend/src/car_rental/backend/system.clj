(ns car-rental.backend.system
  "Wires the component system: :config (plain data) -> :store (in-memory
   db) -> :server (Jetty + reitit), using stuartsierra/component."
  (:require [com.stuartsierra.component :as component]
            [car-rental.backend.config :as config]
            [car-rental.backend.components.store :as store]
            [car-rental.backend.components.server :as server]))

(defn build
  ([] (build (config/load-config)))
  ([config]
   (component/system-map
    :config config
    :store (store/new-store (:store config))
    :server (component/using (server/new-server) [:store :config]))))
