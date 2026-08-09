(ns car-rental.backend.routes
  "All HTTP routes, wired to handler functions. Route *shapes* (paths,
   methods) follow api-contract.md exactly; handler bodies live in
   car-rental.backend.handlers.*. Every handler is a plain
   (fn [ctx request] -> ring-response) — kept out of reitit's data-driven
   config so they stay easy to unit test without an HTTP server."
  (:require [reitit.ring :as ring]
            [reitit.ring.middleware.muuntaja :as muuntaja-mw]
            [muuntaja.core :as m]
            [ring.middleware.params :refer [wrap-params]]
            [ring.middleware.multipart-params :refer [wrap-multipart-params]]
            [car-rental.backend.middleware.errors :refer [wrap-errors]]
            [car-rental.backend.middleware.idempotency :as idempotency]
            [car-rental.backend.handlers.catalog :as catalog]
            [car-rental.backend.handlers.pricing :as pricing]
            [car-rental.backend.handlers.bookings :as bookings]
            [car-rental.backend.handlers.payments :as payments]
            [car-rental.backend.handlers.auth-customer :as auth-customer]
            [car-rental.backend.handlers.reviews :as reviews]
            [car-rental.backend.handlers.destinations :as destinations]
            [car-rental.backend.handlers.contact :as contact]
            [car-rental.backend.handlers.admin.auth :as admin-auth]
            [car-rental.backend.handlers.admin.fleet :as admin-fleet]
            [car-rental.backend.handlers.admin.bookings :as admin-bookings]
            [car-rental.backend.handlers.admin.customers :as admin-customers]
            [car-rental.backend.handlers.admin.pricing :as admin-pricing]
            [car-rental.backend.handlers.admin.reviews :as admin-reviews]
            [car-rental.backend.handlers.admin.content :as admin-content]
            [car-rental.backend.handlers.admin.users :as admin-users]
            [car-rental.backend.handlers.admin.settings :as admin-settings]
            [car-rental.backend.handlers.admin.contact-submissions :as admin-contact]
            [car-rental.backend.handlers.admin.dashboard :as admin-dashboard]))

(def muuntaja-instance
  (m/create (-> m/default-options
                (assoc-in [:formats "application/json" :decoder-opts] {:decode-key-fn keyword}))))

(defn- h
  "Binds a (fn [ctx request]) handler to a fixed ctx, producing the plain
   (fn [request]) reitit expects."
  [ctx f]
  (fn [request] (f ctx request)))

(defn- idem
  [route-name ctx f]
  (idempotency/wrap-idempotent route-name ctx f))

(defn app-routes [ctx]
  [["/api/v1"
    ["/vehicle-categories" {:get {:handler (h ctx catalog/list-categories)}}]
    ["/locations" {:get {:handler (h ctx catalog/list-locations)}}]
    ["/vehicles" {:get {:handler (h ctx catalog/list-vehicles)}}]
    ["/vehicles/:id" {:get {:handler (h ctx catalog/get-vehicle)}}]

    ["/pricing/quote" {:post {:handler (h ctx pricing/quote)}}]

    ["/bookings" {:post {:handler (idem "bookings.create" ctx bookings/create)}}]
    ["/bookings/lookup" {:get {:handler (h ctx bookings/lookup)}}]
    ["/bookings/:id" {:get {:handler (h ctx bookings/get-by-id)}}]
    ["/bookings/:id/cancel" {:post {:handler (h ctx bookings/cancel)}}]
    ["/bookings/:id/payment-status" {:get {:handler (h ctx payments/payment-status)}}]

    ["/account/bookings" {:get {:handler (h ctx bookings/account-bookings)}}]
    ["/account/profile" {:get {:handler (h ctx auth-customer/profile)}
                          :patch {:handler (h ctx auth-customer/update-profile)}}]

    ["/payments/intent" {:post {:handler (idem "payments.intent" ctx payments/create-intent)}}]
    ["/payments/webhook" {:post {:handler (h ctx payments/webhook)}}]
    ["/payments/:id/simulate-success" {:post {:handler (h ctx payments/simulate-success)}}]

    ["/auth/customer/register" {:post {:handler (h ctx auth-customer/register)}}]
    ["/auth/customer/login" {:post {:handler (h ctx auth-customer/login)}}]
    ["/auth/customer/logout" {:post {:handler (h ctx auth-customer/logout)}}]
    ["/auth/customer/refresh" {:post {:handler (h ctx auth-customer/refresh)}}]
    ["/auth/customer/forgot-password" {:post {:handler (h ctx auth-customer/forgot-password)}}]
    ["/auth/customer/reset-password" {:post {:handler (h ctx auth-customer/reset-password)}}]

    ["/reviews" {:get {:handler (h ctx reviews/list-reviews)}
                 :post {:handler (h ctx reviews/create)}}]

    ["/destinations" {:get {:handler (h ctx destinations/list-destinations)}}]
    ["/destinations/:slug" {:get {:handler (h ctx destinations/get-destination)}}]

    ["/contact" {:post {:handler (h ctx contact/submit)}}]
    ["/newsletter/subscribe" {:post {:handler (h ctx contact/subscribe)}}]

    ["/admin/auth/login" {:post {:handler (h ctx admin-auth/login)}}]
    ["/admin/auth/logout" {:post {:handler (h ctx admin-auth/logout)}}]
    ["/admin/auth/refresh" {:post {:handler (h ctx admin-auth/refresh)}}]

    ["/admin/vehicles" {:get {:handler (h ctx admin-fleet/list-vehicles)}
                         :post {:handler (h ctx admin-fleet/create)}}]
    ["/admin/vehicles/:id" {:get {:handler (h ctx admin-fleet/get-vehicle)}
                             :patch {:handler (h ctx admin-fleet/patch-vehicle)}
                             :delete {:handler (h ctx admin-fleet/delete-vehicle)}}]
    ["/admin/vehicles/:id/photos" {:post {:handler (h ctx admin-fleet/upload-photo)}}]
    ["/admin/vehicles/:id/photos/:photo_id" {:delete {:handler (h ctx admin-fleet/delete-photo)}}]
    ["/admin/vehicles/:id/availability" {:get {:handler (h ctx admin-fleet/get-availability)}}]
    ["/admin/vehicles/:id/block-dates" {:post {:handler (h ctx admin-fleet/block-dates)}}]
    ["/admin/vehicles/:id/block-dates/:block_id" {:delete {:handler (h ctx admin-fleet/delete-block)}}]

    ["/admin/bookings" {:get {:handler (h ctx admin-bookings/list-bookings)}}]
    ["/admin/bookings/:id" {:get {:handler (h ctx admin-bookings/get-booking)}
                             :patch {:handler (h ctx admin-bookings/patch-booking)}}]
    ["/admin/bookings/:id/resend-confirmation" {:post {:handler (h ctx admin-bookings/resend-confirmation)}}]

    ["/admin/customers" {:get {:handler (h ctx admin-customers/list-customers)}}]
    ["/admin/customers/:id" {:get {:handler (h ctx admin-customers/get-customer)}}]

    ["/admin/pricing/settings" {:get {:handler (h ctx admin-pricing/get-settings)}
                                 :patch {:handler (h ctx admin-pricing/patch-settings)}}]
    ["/admin/pricing/seasonal-rates" {:get {:handler (h ctx admin-pricing/list-seasonal-rates)}
                                       :post {:handler (h ctx admin-pricing/create-seasonal-rate)}}]
    ["/admin/pricing/seasonal-rates/:id" {:delete {:handler (h ctx admin-pricing/delete-seasonal-rate)}}]

    ["/admin/reviews" {:get {:handler (h ctx admin-reviews/list-reviews)}}]
    ["/admin/reviews/:id" {:patch {:handler (h ctx admin-reviews/patch-review)}}]

    ["/admin/destinations" {:get {:handler (h ctx admin-content/list-destinations)}
                             :post {:handler (h ctx admin-content/create)}}]
    ["/admin/destinations/:id" {:patch {:handler (h ctx admin-content/patch)}
                                 :delete {:handler (h ctx admin-content/delete)}}]

    ["/admin/users" {:get {:handler (h ctx admin-users/list-users)}
                      :post {:handler (h ctx admin-users/create)}}]
    ["/admin/users/:id" {:patch {:handler (h ctx admin-users/patch)}
                          :delete {:handler (h ctx admin-users/delete)}}]

    ["/admin/settings" {:get {:handler (h ctx admin-settings/get-settings)}
                         :patch {:handler (h ctx admin-settings/patch-settings)}}]

    ["/admin/dashboard/summary" {:get {:handler (h ctx admin-dashboard/summary)}}]

    ["/admin/contact-submissions" {:get {:handler (h ctx admin-contact/list-submissions)}}]
    ["/admin/contact-submissions/:id" {:get {:handler (h ctx admin-contact/get-submission)}
                                        :patch {:handler (h ctx admin-contact/patch-submission)}}]]])

(defn- not-found-handler [_request]
  {:status 404 :body {:error {:code "NOT_FOUND" :message "No such route." :fields {}}}})

(defn- wrap-json-fallback
  "Reitit's muuntaja format-middleware only wraps matched routes, so
   responses produced *outside* a route's own middleware chain — the
   catch-all 404 handler, and any error map wrap-errors builds after
   catching an exception that unwound past a route's middleware — would
   otherwise reach Jetty as a raw Clojure map instead of JSON. This backstops
   both cases by encoding any still-unencoded map/vector body to JSON."
  [handler]
  (fn [request]
    (let [response (handler request)
          body (:body response)]
      (if (or (nil? body) (string? body) (bytes? body)
              (instance? java.io.InputStream body) (instance? java.io.File body))
        response
        (-> response
            (assoc :body (m/encode muuntaja-instance "application/json" body))
            (update :headers assoc "Content-Type" "application/json; charset=utf-8"))))))

(defn- wrap-cors [handler allowed-origins]
  (fn [request]
    (if (= :options (:request-method request))
      {:status 200
       :headers {"Access-Control-Allow-Origin" allowed-origins
                 "Access-Control-Allow-Methods" "GET,POST,PATCH,DELETE,OPTIONS"
                 "Access-Control-Allow-Headers" "Content-Type,Authorization,Idempotency-Key"}
       :body ""}
      (let [response (handler request)]
        (update response :headers merge {"Access-Control-Allow-Origin" allowed-origins})))))

(defn make-handler [ctx]
  (let [allowed-origins (get-in ctx [:config :cors :allowed-origins] "*")]
    (-> (ring/ring-handler
         (ring/router
          (app-routes ctx)
          {:conflicts (constantly nil) ; static segments (e.g. /bookings/lookup)
                                        ; intentionally take priority over
                                        ; sibling path-param routes
                                        ; (/bookings/:id) — reitit's trie
                                        ; router resolves this correctly at
                                        ; match time, this option just
                                        ; silences its conflict-detection
                                        ; warning/error for the pattern.
           :data {:muuntaja muuntaja-instance
                  :middleware [muuntaja-mw/format-middleware]}})
         (ring/create-default-handler {:not-found not-found-handler}))
        wrap-multipart-params
        wrap-params
        wrap-errors
        wrap-json-fallback
        (wrap-cors allowed-origins))))
