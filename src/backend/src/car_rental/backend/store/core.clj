(ns car-rental.backend.store.core
  "Small in-memory 'database' built on a single atom holding a map of
   table-name -> {id -> record}, plus an id-counter map.

   No real DB is specified in api-contract.md / design-spec.md, so per the
   task instructions this uses a simple embedded store rather than standing
   up real infra. All access goes through this namespace so it could be
   swapped for next.jdbc + hikari-cp (already on the classpath) later
   without touching handler code."
  (:import [java.time LocalDate]))

(defn next-counter!
  "Atomically increments and returns the next number for a named counter,
   starting at 1001 (seed data hand-assigns lower/legible ids like veh_101,
   bk_9001 etc., so generated ids start well clear of those)."
  [db-atom kind]
  (-> (swap! db-atom update-in [:counters kind] (fnil inc 1000))
      (get-in [:counters kind])))

(defn next-id!
  "Atomically increments and returns a new id string like \"veh_1002\"."
  [db-atom kind]
  (str (name kind) "_" (next-counter! db-atom kind)))

(defn insert! [db-atom table id record]
  (swap! db-atom assoc-in [table id] (assoc record :id id))
  (get-in @db-atom [table id]))

(defn put-raw!
  "Like insert! but doesn't force :id (used for keyed-by-something-else
   tables like refresh tokens, keyed by the token itself)."
  [db-atom table k record]
  (swap! db-atom assoc-in [table k] record)
  (get-in @db-atom [table k]))

(defn get-one [db table id]
  (get-in db [table id]))

(defn get-singleton
  "For tables that hold a single record directly (e.g. :pricing_settings,
   :settings) rather than a map keyed by id."
  [db table]
  (get db table))

(defn update-singleton! [db-atom table f & args]
  (swap! db-atom update table #(apply f % args))
  (get @db-atom table))

(defn list-all [db table]
  (vals (get db table)))

(defn update! [db-atom table id f & args]
  (swap! db-atom update-in [table id] #(apply f % args))
  (get-in @db-atom [table id]))

(defn delete! [db-atom table id]
  (swap! db-atom update table dissoc id)
  nil)

(defn paginate
  "items: a seq. Returns {:data [...] :meta {...}} matching the contract's
   pagination envelope."
  [items {:keys [page per-page]}]
  (let [page (or page 1)
        per-page (min (or per-page 20) 100)
        total-count (count items)
        total-pages (max 1 (long (Math/ceil (/ total-count (double per-page)))))
        start (* (dec page) per-page)
        page-items (->> items (drop start) (take per-page) vec)]
    {:data page-items
     :meta {:page page :per_page per-page :total_count total-count :total_pages total-pages}}))

(defn parse-int-safe [v default]
  (cond
    (nil? v) default
    (integer? v) v
    (string? v) (try (Integer/parseInt v) (catch Exception _ default))
    :else default))

(defn dates-overlap?
  "Inclusive-exclusive overlap check: [s1,e1) intersects [s2,e2)."
  [s1 e1 s2 e2]
  (let [p (fn [s] (LocalDate/parse s))]
    (and (.isBefore (p s1) (p e2))
         (.isBefore (p s2) (p e1)))))
