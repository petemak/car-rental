(ns car-rental.backend.components.store
  "The Store component wraps a single atom holding the whole in-memory
   'database' (see car-rental.backend.store.seed for the shape). No real DB
   is specified by the contract, so this stands in for one; handlers only
   ever touch data through car-rental.backend.store.core's functions on
   (:conn this)."
  (:require [com.stuartsierra.component :as component]
            [car-rental.backend.store.seed :as seed]))

(defrecord Store [seed? conn]
  component/Lifecycle
  (start [this]
    (if conn
      this
      (assoc this :conn (atom (if (false? seed?) {} (seed/initial-db))))))
  (stop [this]
    (assoc this :conn nil)))

(defn new-store [{:keys [seed?]}]
  (map->Store {:seed? seed?}))
