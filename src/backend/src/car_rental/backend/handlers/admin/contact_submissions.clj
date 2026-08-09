(ns car-rental.backend.handlers.admin.contact-submissions
  "Admin surface for contact-form tickets created by POST /contact
   (api-contract.md Section 8). Not part of the original contract — added
   post-QA because the contract fired an `admin_contact_received`
   notification (Section 9) but never gave admins a way to actually read
   the messages. See api-contract.md Section 13a for the documented shape;
   this mirrors the existing admin list/patch patterns (GET /admin/bookings,
   PATCH /admin/reviews/{id}) — no super_admin restriction, since contact
   triage isn't listed among the contract's super_admin-only areas
   (Pricing Settings, Admin Users)."
  (:require [car-rental.backend.store.core :as store]
            [car-rental.backend.domain.validation :as validation]
            [car-rental.backend.domain.errors :as errors]
            [car-rental.backend.auth.context :as auth]))

(defn list-submissions [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        qp (:query-params request)
        status (get qp "status")
        page (some-> (get qp "page") Integer/parseInt)
        per-page (some-> (get qp "per_page") Integer/parseInt)
        tickets (cond->> (store/list-all db :contact_tickets)
                  status (filter #(= status (:status %))))
        paginated (store/paginate (sort-by :created_at #(compare %2 %1) tickets)
                                   {:page page :per-page per-page})]
    {:status 200 :body paginated}))

(defn get-submission [ctx request]
  (auth/require-admin! ctx request)
  (let [db @(:db ctx)
        id (get-in request [:path-params :id])
        ticket (store/get-one db :contact_tickets id)]
    (when-not ticket (errors/not-found! "CONTACT_SUBMISSION_NOT_FOUND" "This contact submission could not be found."))
    {:status 200 :body ticket}))

(def PatchSchema
  [:map [:status [:enum "new" "read" "resolved"]]])

(defn patch-submission [ctx request]
  (auth/require-admin! ctx request)
  (let [db-atom (:db ctx)
        id (get-in request [:path-params :id])
        _ (when-not (store/get-one @db-atom :contact_tickets id)
            (errors/not-found! "CONTACT_SUBMISSION_NOT_FOUND" "This contact submission could not be found."))
        body (validation/validate! PatchSchema (:body-params request))
        ticket (store/update! db-atom :contact_tickets id merge body)]
    {:status 200 :body ticket}))
