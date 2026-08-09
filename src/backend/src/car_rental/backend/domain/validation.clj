(ns car-rental.backend.domain.validation
  "Malli-based validation. `validate!` throws a 422 VALIDATION_ERROR
   (via car-rental.backend.domain.errors) whose `:fields` map is a flat
   field-path -> message map, matching the api-contract error shape."
  (:require [clojure.string :as str]
            [malli.core :as m]
            [malli.error :as me]
            [car-rental.backend.domain.errors :as errors]))

(defn- path->field [path]
  (str/join "." (map name path)))

(defn explain->fields
  "Flattens malli's humanized error structure (nested maps/vectors mirroring
   the input shape) into a single field-path -> message string map, e.g.
   {\"customer.email\" \"should be an email\"}."
  [explanation]
  (let [humanized (me/humanize explanation)]
    (letfn [(walk [node prefix acc]
              (cond
                (map? node)
                (reduce-kv (fn [acc k v] (walk v (conj prefix k) acc)) acc node)

                (and (sequential? node) (every? string? node) (seq node))
                (assoc acc (path->field prefix) (str/join " " node))

                (sequential? node)
                (reduce (fn [acc [idx v]] (walk v (conj prefix (str idx)) acc))
                        acc
                        (map-indexed vector node))

                (nil? node) acc

                :else
                (assoc acc (path->field prefix) (str node))))]
      (walk humanized [] {}))))

(defn validate!
  "Validates `data` against malli `schema`. Returns `data` unchanged on
   success. Throws a 422 VALIDATION_ERROR ex-info (see domain.errors) with a
   flattened `fields` map on failure."
  [schema data]
  (if (m/validate schema data)
    data
    (let [explanation (m/explain schema data)]
      (errors/validation! (explain->fields explanation)))))
