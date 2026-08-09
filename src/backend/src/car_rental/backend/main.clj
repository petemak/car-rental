(ns car-rental.backend.main
  (:require [com.stuartsierra.component :as component]
            [car-rental.backend.system :as system])
  (:gen-class))

(defn -main [& _args]
  (let [sys (component/start (system/build))]
    (println "car-rental backend started.")
    (.addShutdownHook (Runtime/getRuntime)
                       (Thread. ^Runnable (fn [] (component/stop sys))))
    ;; keep the JVM alive; Jetty runs non-daemon threads by default with
    ;; join? false in config, so block here explicitly instead.
    @(promise)))
