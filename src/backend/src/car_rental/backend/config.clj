(ns car-rental.backend.config
  "Configuration loading via aero. Kept as a single pure function so tests
   can pass an override map instead of reading resources/config.edn."
  (:require [aero.core :as aero]
            [clojure.java.io :as io]))

(defn load-config
  "Reads resources/config.edn (or a given resource path) through aero,
   honouring #env and #or tags."
  ([] (load-config "config.edn"))
  ([resource-name]
   (aero/read-config (io/resource resource-name))))
