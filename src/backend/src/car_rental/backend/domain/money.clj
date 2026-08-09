(ns car-rental.backend.domain.money
  "Pure helpers for the contract's money convention: decimal strings with an
   explicit `currency` field alongside, e.g. \"245.00\"."
  (:import [java.math BigDecimal RoundingMode]))

(defn ->bigdec
  "Coerces a decimal string, number, or nil (-> 0) into a BigDecimal."
  [v]
  (cond
    (nil? v) 0M
    (instance? BigDecimal v) v
    (string? v) (bigdec v)
    :else (bigdec v)))

(defn round2
  "Rounds a BigDecimal (or coercible value) to 2 decimal places, HALF_UP."
  [v]
  (.setScale ^BigDecimal (->bigdec v) 2 RoundingMode/HALF_UP))

(defn ->str
  "Formats a value as a 2-decimal-place money string, e.g. \"245.00\"."
  [v]
  (str (round2 v)))

(defn add [& vs]
  (round2 (reduce + 0M (map ->bigdec vs))))

(defn sub [a b]
  (round2 (- (->bigdec a) (->bigdec b))))

(defn mul [a b]
  (round2 (* (->bigdec a) (->bigdec b))))

(defn percent-of
  "e.g. (percent-of \"1275.75\" 30) => 382.73M (HALF_UP)."
  [amount pct]
  (round2 (* (->bigdec amount) (/ (->bigdec pct) 100M))))
