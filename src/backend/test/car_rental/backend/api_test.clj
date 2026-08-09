(ns car-rental.backend.api-test
  "End-to-end tests through the real ring handler stack (routing, muuntaja
   json encode/decode, auth, idempotency, error mapping) — not just calling
   handler functions directly. Each test builds its own fresh in-memory
   store via test-helpers/fresh-app so tests don't interfere."
  (:require [clojure.test :refer [deftest is testing]]
            [car-rental.backend.test-helpers :as h]))

(deftest catalog-endpoints
  (let [app (h/fresh-app)]
    (let [r (h/req app :get "/api/v1/vehicle-categories")]
      (is (= 200 (:status r)))
      (is (= 4 (count (:data (h/json-body r))))))
    (let [r (h/req app :get "/api/v1/vehicles" nil {:query-string "per_page=2"})
          body (h/json-body r)]
      (is (= 200 (:status r)))
      (is (= 2 (count (:data body))))
      (is (= 4 (get-in body [:meta :total_count]))))
    (let [r (h/req app :get "/api/v1/vehicles/veh_101")]
      (is (= 200 (:status r)))
      (is (nil? (:price_breakdown (h/json-body r)))))
    (let [r (h/req app :get "/api/v1/vehicles/veh_999")]
      (is (= 404 (:status r)))
      (is (= "VEHICLE_NOT_FOUND" (get-in (h/json-body r) [:error :code]))))))

(deftest quote-endpoint-matches-contract-example
  (let [app (h/fresh-app)
        ;; NB: veh_101 has a seeded demo booking for 2026-09-10..15 (see
        ;; store.seed/bookings, used to demonstrate the BookingDetail
        ;; shape) — use a different, unbooked 5-day window here so this is
        ;; purely a pricing-math assertion, not an availability one.
        r (h/req app :post "/api/v1/pricing/quote"
                 {:vehicle_id "veh_101" :pickup_date "2026-10-10" :return_date "2026-10-15"
                  :service_type "chauffeur" :airport_pickup true :additional_driver false :child_seat true})
        body (h/json-body r)]
    (is (= 200 (:status r)))
    (is (= "1275.75" (:total body)))
    (is (= "382.73" (:deposit_due body)))))

(deftest booking-lifecycle
  (let [app (h/fresh-app)
        create-resp (h/req app :post "/api/v1/bookings"
                            {:vehicle_id "veh_102" :pickup_date "2026-11-01" :pickup_time "09:00"
                             :return_date "2026-11-03" :return_time "09:00"
                             :pickup_location_id "loc_kgl_airport" :dropoff_location_id "loc_kgl_airport"
                             :service_type "self_drive" :airport_pickup false :additional_driver false
                             :child_seat false
                             :customer {:first_name "Amy" :last_name "T" :email "amy@example.com"
                                        :phone "+1" :country "Canada" :license_number "L1"
                                        :license_expiry "2030-01-01"}
                             :special_requests "" :create_account false :accepted_terms true})
        body (h/json-body create-resp)]
    (testing "creation"
      (is (= 201 (:status create-resp)))
      (is (= "pending_payment" (:status body))))
    (testing "double-booking the same dates conflicts"
      (let [conflict (h/req app :post "/api/v1/bookings"
                             {:vehicle_id "veh_102" :pickup_date "2026-11-01" :pickup_time "09:00"
                              :return_date "2026-11-03" :return_time "09:00"
                              :pickup_location_id "loc_kgl_airport" :dropoff_location_id "loc_kgl_airport"
                              :service_type "self_drive" :airport_pickup false :additional_driver false
                              :child_seat false
                              :customer {:first_name "Bo" :last_name "T" :email "bo@example.com"
                                         :phone "+1" :country "Canada" :license_number "L2"
                                         :license_expiry "2030-01-01"}
                              :special_requests "" :create_account false :accepted_terms true})]
        (is (= 409 (:status conflict)))
        (is (= "VEHICLE_NOT_AVAILABLE" (get-in (h/json-body conflict) [:error :code])))))
    (testing "guest lookup"
      (let [r (h/req app :get "/api/v1/bookings/lookup" nil
                      {:query-string "reference=RR-1001&email=amy@example.com"})]
        (is (= 200 (:status r)))
        (is (= (:reference body) (:reference (h/json-body r))))))
    (testing "cancel as guest"
      (let [r (h/req app :post (str "/api/v1/bookings/" (:booking_id body) "/cancel")
                      {:reference (:reference body) :email "amy@example.com" :reason "changed plans"})]
        (is (= 200 (:status r)))
        (is (= "cancelled" (:status (h/json-body r))))))))

(deftest idempotent-booking-creation
  (let [app (h/fresh-app)
        payload {:vehicle_id "veh_103" :pickup_date "2026-12-01" :pickup_time "09:00"
                 :return_date "2026-12-03" :return_time "09:00"
                 :pickup_location_id "loc_kgl_airport" :dropoff_location_id "loc_kgl_airport"
                 :service_type "chauffeur" :airport_pickup false :additional_driver false
                 :child_seat false
                 :customer {:first_name "Idem" :last_name "Test" :email "idem@example.com"
                            :phone "+1" :country "Canada"}
                 :special_requests "" :create_account false :accepted_terms true}
        r1 (h/req app :post "/api/v1/bookings" payload {:headers {"idempotency-key" "key-1"}})
        r2 (h/req app :post "/api/v1/bookings" payload {:headers {"idempotency-key" "key-1"}})]
    (is (= (:booking_id (h/json-body r1)) (:booking_id (h/json-body r2))))))

(deftest validation-error-shape
  (let [app (h/fresh-app)
        r (h/req app :post "/api/v1/bookings"
                 {:vehicle_id "veh_102" :pickup_date "2026-11-01" :pickup_time "09:00"
                  :return_date "2026-11-03" :return_time "09:00"
                  :pickup_location_id "loc_kgl_airport" :dropoff_location_id "loc_kgl_airport"
                  :service_type "self_drive" :airport_pickup false :additional_driver false
                  :child_seat false
                  :customer {:first_name "Amy" :last_name "T" :email "amy@example.com"
                             :phone "+1" :country "Canada"}
                  :special_requests "" :create_account false :accepted_terms true})
        body (h/json-body r)]
    (is (= 422 (:status r)))
    (is (= "VALIDATION_ERROR" (get-in body [:error :code])))
    (is (contains? (get-in body [:error :fields]) :customer.license_number))))

(deftest not-found-route-is-json
  (let [app (h/fresh-app)
        r (h/req app :get "/api/v1/nonexistent")]
    (is (= 404 (:status r)))
    (is (= "NOT_FOUND" (get-in (h/json-body r) [:error :code])))))

(deftest admin-auth-and-role-enforcement
  (let [app (h/fresh-app)
        login (h/req app :post "/api/v1/admin/auth/login" {:email "staff@example.com" :password "staff123"})
        token (:token (h/json-body login))]
    (is (= 200 (:status login)))
    (testing "booking_staff forbidden from pricing settings"
      (let [r (h/req app :patch "/api/v1/admin/pricing/settings" {:deposit_percentage 40}
                      {:headers (h/auth-header token)})]
        (is (= 403 (:status r)))))
    (testing "no token -> 401"
      (let [r (h/req app :get "/api/v1/admin/vehicles")]
        (is (= 401 (:status r)))))))

(deftest contact-and-admin-contact-submissions
  (let [app (h/fresh-app)
        submit (h/req app :post "/api/v1/contact"
                       {:name "Amy" :email "amy@example.com" :subject "Airport pickup?"
                        :message "Do you offer late night pickup?"})
        submit-body (h/json-body submit)
        admin-login (h/req app :post "/api/v1/admin/auth/login" {:email "admin@example.com" :password "admin123"})
        admin-token (:token (h/json-body admin-login))]
    (testing "POST /contact response shape is unchanged by the admin addition"
      (is (= 201 (:status submit)))
      (is (= "received" (:status submit-body))))
    (testing "admin can list submissions, newest first, filterable by status"
      (let [r (h/req app :get "/api/v1/admin/contact-submissions" nil
                      {:query-string "status=new" :headers (h/auth-header admin-token)})
            body (h/json-body r)]
        (is (= 200 (:status r)))
        ;; 2 seeded ("new" tk_1, "read" tk_2) + the one just submitted above
        (is (= 2 (:total_count (:meta body))))
        (is (= (:ticket_id submit-body) (:id (first (:data body)))))))
    (testing "no auth -> 401"
      (is (= 401 (:status (h/req app :get "/api/v1/admin/contact-submissions")))))
    (testing "admin can mark a submission read"
      (let [r (h/req app :patch (str "/api/v1/admin/contact-submissions/" (:ticket_id submit-body))
                      {:status "read"} {:headers (h/auth-header admin-token)})]
        (is (= 200 (:status r)))
        (is (= "read" (:status (h/json-body r))))))
    (testing "dashboard reflects the remaining unread count"
      (let [r (h/req app :get "/api/v1/admin/dashboard/summary" nil {:headers (h/auth-header admin-token)})]
        (is (= 1 (:pending_contact_submissions_count (h/json-body r))))))))

(deftest simulate-payment-success-dev-endpoint
  (let [app (h/fresh-app)
        create (h/req app :post "/api/v1/bookings"
                       {:vehicle_id "veh_103" :pickup_date "2027-01-01" :pickup_time "09:00"
                        :return_date "2027-01-03" :return_time "09:00"
                        :pickup_location_id "loc_kgl_airport" :dropoff_location_id "loc_kgl_airport"
                        :service_type "self_drive" :airport_pickup false :additional_driver false
                        :child_seat false
                        :customer {:first_name "Sim" :last_name "Test" :email "sim@example.com"
                                   :phone "+1" :country "Canada" :license_number "L1"
                                   :license_expiry "2030-01-01"}
                        :special_requests "" :create_account false :accepted_terms true})
        booking-id (:booking_id (h/json-body create))
        intent (h/req app :post "/api/v1/payments/intent"
                       {:booking_id booking-id :amount "10.00" :currency "USD" :payment_method "card"
                        :reference (:reference (h/json-body create)) :email "sim@example.com"})
        payment-id (:payment_id (h/json-body intent))]
    (testing "before simulation, still pending"
      (let [r (h/req app :get (str "/api/v1/bookings/" booking-id "/payment-status"))]
        (is (= "pending" (:payment_status (h/json-body r))))))
    (testing "simulate-success flips it to confirmed/paid, same effect as the webhook"
      (let [r (h/req app :post (str "/api/v1/payments/" payment-id "/simulate-success"))
            body (h/json-body r)]
        (is (= 200 (:status r)))
        (is (= "confirmed" (:booking_status body)))
        (is (contains? #{"paid" "partially_paid"} (:payment_status body)))))
    (testing "unknown payment_id -> 404"
      (is (= 404 (:status (h/req app :post "/api/v1/payments/pay_nope/simulate-success")))))))

(deftest customer-register-login-profile
  (let [app (h/fresh-app)
        reg (h/req app :post "/api/v1/auth/customer/register"
                    {:first_name "Nia" :last_name "Kim" :email "nia@example.com" :password "pw123456"})
        token (:token (h/json-body reg))]
    (is (= 201 (:status reg)))
    (testing "duplicate email"
      (let [dup (h/req app :post "/api/v1/auth/customer/register"
                        {:first_name "Nia" :last_name "Kim" :email "nia@example.com" :password "pw123456"})]
        (is (= 422 (:status dup)))
        (is (= "EMAIL_TAKEN" (get-in (h/json-body dup) [:error :code])))))
    (testing "profile roundtrip"
      (let [patched (h/req app :patch "/api/v1/account/profile" {:country "USA"}
                            {:headers (h/auth-header token)})]
        (is (= 200 (:status patched)))
        (is (= "USA" (:country (h/json-body patched))))))))
