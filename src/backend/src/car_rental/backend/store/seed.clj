(ns car-rental.backend.store.seed
  "Initial in-memory data. Field names intentionally mirror the JSON keys in
   api-contract.md (snake_case) rather than idiomatic kebab-case Clojure
   keys, so records can be handed to the JSON encoder with minimal
   reshaping and there's less chance of the store's shape drifting from the
   contract. Nested reference objects (e.g. a vehicle's `category`) are
   resolved at response-build time from the *_id foreign keys below, not
   duplicated in storage."
  (:require [buddy.hashers :as hashers]))

(def categories
  {"cat_city" {:id "cat_city" :name "City Car" :description "Compact and easy to park." :icon "city"}
   "cat_sedan" {:id "cat_sedan" :name "Sedan" :description "Comfortable for longer road trips." :icon "sedan"}
   "cat_suv" {:id "cat_suv" :name "SUV" :description "More room, comfortable on longer routes." :icon "suv"}
   "cat_offroad" {:id "cat_offroad" :name "Off-Road" :description "Built for national park terrain." :icon "offroad"}})

(def locations
  {"loc_kgl_airport" {:id "loc_kgl_airport" :name "Kigali International Airport (KGL)" :type "airport" :address "Kanombe, Kigali"}
   "loc_city_office" {:id "loc_city_office" :name "Rwanda Roadways City Office" :type "city_office" :address "KN 4 Ave, Kigali"}})

(def vehicles
  {"veh_101"
   {:id "veh_101"
    :name "Toyota Land Cruiser Prado"
    :category_id "cat_offroad"
    :seats 7
    :transmission "automatic"
    :fuel_type "diesel"
    :price_per_day "180.00"
    :currency "USD"
    :thumbnail_url "https://images.unsplash.com/photo-1613859492095-85d9944f09f6?w=800&q=80"
    :photos [{:id "ph_1" :url "https://images.unsplash.com/photo-1613859492095-85d9944f09f6?w=1200&q=80"}
             {:id "ph_2" :url "https://images.unsplash.com/photo-1630826362226-a509049bcdbf?w=1200&q=80"}]
    :features ["4x4" "Air conditioning" "Bluetooth" "Roof rack"]
    :specs {:doors 5 :luggage_capacity_l 500 :air_conditioning true :off_road_capable true}
    :policies {:mileage_limit_km_per_day 250
               :fuel_policy "full-to-full"
               :min_driver_age 23
               :license_requirement "Valid driver's license or IDP, held 2+ years"
               :security_deposit_amount "300.00"
               :currency "USD"
               :cancellation_policy_summary "Full refund up to 72h before pickup."}
    :chauffeur_available true
    :airport_pickup_available true
    :rating_avg 4.8
    :rating_count 37
    :status "active"
    :created_at "2026-01-05T09:00:00Z"
    :updated_at "2026-01-05T09:00:00Z"}

   "veh_102"
   {:id "veh_102"
    :name "Toyota Aygo"
    :category_id "cat_city"
    :seats 4
    :transmission "manual"
    :fuel_type "petrol"
    :price_per_day "35.00"
    :currency "USD"
    :thumbnail_url "https://images.unsplash.com/photo-1604046938596-c6561689c9ee?w=800&q=80"
    :photos [{:id "ph_3" :url "https://images.unsplash.com/photo-1604046938596-c6561689c9ee?w=1200&q=80"}]
    :features ["Air conditioning" "Bluetooth" "USB charging"]
    :specs {:doors 5 :luggage_capacity_l 168 :air_conditioning true :off_road_capable false}
    :policies {:mileage_limit_km_per_day 200
               :fuel_policy "full-to-full"
               :min_driver_age 21
               :license_requirement "Valid driver's license or IDP, held 1+ year"
               :security_deposit_amount "150.00"
               :currency "USD"
               :cancellation_policy_summary "Full refund up to 72h before pickup."}
    :chauffeur_available false
    :airport_pickup_available true
    :rating_avg 4.6
    :rating_count 21
    :status "active"
    :created_at "2026-01-05T09:00:00Z"
    :updated_at "2026-01-05T09:00:00Z"}

   "veh_103"
   {:id "veh_103"
    :name "Toyota Corolla"
    :category_id "cat_sedan"
    :seats 5
    :transmission "automatic"
    :fuel_type "petrol"
    :price_per_day "55.00"
    :currency "USD"
    :thumbnail_url "https://images.unsplash.com/photo-1638618164682-12b986ec2a75?w=800&q=80"
    :photos [{:id "ph_5" :url "https://images.unsplash.com/photo-1638618164682-12b986ec2a75?w=1200&q=80"}
             {:id "ph_7" :url "https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=1200&q=80"}]
    :features ["Air conditioning" "Bluetooth" "Cruise control"]
    :specs {:doors 4 :luggage_capacity_l 470 :air_conditioning true :off_road_capable false}
    :policies {:mileage_limit_km_per_day 220
               :fuel_policy "full-to-full"
               :min_driver_age 21
               :license_requirement "Valid driver's license or IDP, held 1+ year"
               :security_deposit_amount "200.00"
               :currency "USD"
               :cancellation_policy_summary "Full refund up to 72h before pickup."}
    :chauffeur_available true
    :airport_pickup_available true
    :rating_avg 4.7
    :rating_count 15
    :status "active"
    :created_at "2026-01-05T09:00:00Z"
    :updated_at "2026-01-05T09:00:00Z"}

   "veh_104"
   {:id "veh_104"
    :name "Toyota RAV4"
    :category_id "cat_suv"
    :seats 5
    :transmission "automatic"
    :fuel_type "petrol"
    :price_per_day "90.00"
    :currency "USD"
    :thumbnail_url "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=800&q=80"
    :photos [{:id "ph_6" :url "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=1200&q=80"}
             {:id "ph_8" :url "https://images.unsplash.com/photo-1706509234538-9831b1b33d66?w=1200&q=80"}]
    :features ["4x4" "Air conditioning" "Bluetooth" "Roof rack"]
    :specs {:doors 5 :luggage_capacity_l 580 :air_conditioning true :off_road_capable true}
    :policies {:mileage_limit_km_per_day 240
               :fuel_policy "full-to-full"
               :min_driver_age 23
               :license_requirement "Valid driver's license or IDP, held 2+ years"
               :security_deposit_amount "250.00"
               :currency "USD"
               :cancellation_policy_summary "Full refund up to 72h before pickup."}
    :chauffeur_available true
    :airport_pickup_available true
    :rating_avg 4.9
    :rating_count 28
    :status "active"
    :created_at "2026-01-05T09:00:00Z"
    :updated_at "2026-01-05T09:00:00Z"}})

(def customers
  {"cust_1" {:id "cust_1"
             :first_name "Jane"
             :last_name "Doe"
             :email "jane@example.com"
             :phone "+1 555 010 2000"
             :country "United States"
             :license_number "D1234567"
             :license_expiry "2029-04-01"
             :password_hash (hashers/derive "password123")
             :created_at "2026-01-10T09:00:00Z"}})

(def admin-users
  {"adm_1" {:id "adm_1"
            :name "Alice Admin"
            :email "admin@example.com"
            :role "super_admin"
            :password_hash (hashers/derive "admin123")
            :created_at "2026-01-01T09:00:00Z"}
   "adm_2" {:id "adm_2"
            :name "Bob Booking"
            :email "staff@example.com"
            :role "booking_staff"
            :password_hash (hashers/derive "staff123")
            :created_at "2026-01-01T09:00:00Z"}})

(def bookings
  {"bk_9001"
   {:id "bk_9001"
    :reference "RR-9001"
    :status "confirmed"
    :vehicle_id "veh_101"
    :pickup_date "2026-09-10"
    :pickup_time "10:00"
    :return_date "2026-09-15"
    :return_time "10:00"
    :pickup_location_id "loc_kgl_airport"
    :dropoff_location_id "loc_kgl_airport"
    :service_type "chauffeur"
    :airport_pickup true
    :flight_number "KQ123"
    :additional_driver false
    :child_seat true
    :chauffeur_id nil
    :customer {:first_name "Jane" :last_name "Doe" :email "jane@example.com"
               :phone "+1 555 010 2000" :country "United States"
               :license_number "D1234567" :license_expiry "2029-04-01"}
    :customer_id "cust_1"
    :special_requests "Arriving on a late flight, please confirm meeting point."
    :internal_notes ""
    :price_breakdown {:subtotal "900.00" :chauffeur_fee "250.00" :airport_pickup_fee "40.00"
                       :additional_driver_fee "0.00" :child_seat_fee "25.00" :taxes_fees "60.75"
                       :total "1275.75" :currency "USD" :payment_model "deposit"
                       :deposit_due "382.73" :balance_due "893.02"}
    :payment_status "paid"
    :payment_provider_transaction_id "pi_seed_demo_1"
    :created_at "2026-08-01T12:04:00Z"
    :updated_at "2026-08-01T12:10:00Z"}})

(def reviews
  {"rev_1" {:id "rev_1" :customer_name "Mark T." :country "United Kingdom" :rating 5
            :comment "Land Cruiser was spotless, driver was excellent."
            :vehicle_id "veh_101" :vehicle_name "Toyota Land Cruiser Prado"
            :booking_id "bk_9001" :customer_id "cust_1"
            :status "approved" :admin_reply nil
            :created_at "2026-06-02T09:00:00Z"}
   "rev_2" {:id "rev_2" :customer_name "Sofia R." :country "Spain" :rating 4
            :comment "Great little city car, easy to park in Kigali."
            :vehicle_id "veh_102" :vehicle_name "Toyota Aygo"
            :booking_id nil :customer_id nil
            :status "approved" :admin_reply nil
            :created_at "2026-05-20T09:00:00Z"}
   "rev_3" {:id "rev_3" :customer_name "David K." :country "Canada" :rating 5
            :comment "Airport pickup was seamless, highly recommend the RAV4."
            :vehicle_id "veh_104" :vehicle_name "Toyota RAV4"
            :booking_id nil :customer_id nil
            :status "approved" :admin_reply nil
            :created_at "2026-04-11T09:00:00Z"}})

(def destinations
  {"dest_1" {:id "dest_1"
             :title "Self-Driving to Volcanoes National Park"
             :slug "volcanoes-national-park"
             :thumbnail_url "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=900&q=80"
             :hero_image_url "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1600&q=80"
             :excerpt "What to expect on the drive north to gorilla trekking country."
             :body_html "<p>The drive from Kigali to Volcanoes National Park takes around two hours...</p>"
             :suggested_category_id "cat_offroad"
             :status "published"
             :created_at "2026-02-01T09:00:00Z"
             :updated_at "2026-02-01T09:00:00Z"}
   "dest_2" {:id "dest_2"
             :title "Airport to Lake Kivu: What to Expect"
             :slug "airport-to-lake-kivu"
             :thumbnail_url "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=900&q=80"
             :hero_image_url "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=80"
             :excerpt "A scenic route worth the drive, with a few stops along the way."
             :body_html "<p>Lake Kivu is one of Rwanda's most rewarding road trips...</p>"
             :suggested_category_id "cat_suv"
             :status "published"
             :created_at "2026-02-05T09:00:00Z"
             :updated_at "2026-02-05T09:00:00Z"}
   "dest_3" {:id "dest_3"
             :title "Exploring Nyungwe Forest by Road"
             :slug "nyungwe-forest"
             :thumbnail_url "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=900&q=80"
             :hero_image_url "https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1600&q=80"
             :excerpt "Canopy walks, chimp tracking, and winding forest roads."
             :body_html "<p>Nyungwe Forest National Park rewards travelers willing to make the drive...</p>"
             :suggested_category_id "cat_offroad"
             :status "published"
             :created_at "2026-02-10T09:00:00Z"
             :updated_at "2026-02-10T09:00:00Z"}})

(def pricing-settings
  {:payment_model "deposit"
   :deposit_percentage 30
   :currency_default "USD"
   :extras {:chauffeur_fee_per_day "50.00"
            :airport_pickup_fee "40.00"
            :additional_driver_fee "15.00"
            :child_seat_fee "5.00"}})

(def settings
  {:business_name "Rwanda Roadways"
   :contact_email "hello@example.com"
   :contact_phone "+250 7xx xxx xxx"
   :whatsapp_number "+250 7xx xxx xxx"
   :office_address "KN 4 Ave, Kigali"
   :notification_templates {:booking_confirmed "Hi {{first_name}}, your booking {{reference}} is confirmed!"
                             :booking_reminder "Hi {{first_name}}, your pickup is in 48 hours."
                             :booking_cancelled "Hi {{first_name}}, your booking {{reference}} has been cancelled."}
   :payment_provider {:provider "stripe" :public_key "pk_test_dummy_12345"}})

(def contact-tickets
  {"tk_1" {:id "tk_1"
           :name "Priya Shah"
           :email "priya@example.com"
           :subject "Question about airport pickup"
           :message "Does the driver track flight delays, or do I need to notify you separately?"
           :status "new"
           :created_at "2026-08-05T08:00:00Z"}
   "tk_2" {:id "tk_2"
           :name "Tom Becker"
           :email "tom@example.com"
           :subject "Child seat availability"
           :message "Can I add a child seat for a toddler on a self-drive booking?"
           :status "read"
           :created_at "2026-08-02T14:30:00Z"}})

(defn initial-db []
  {:categories categories
   :locations locations
   :vehicles vehicles
   :customers customers
   :admin_users admin-users
   :bookings bookings
   :payments {}
   :reviews reviews
   :destinations destinations
   :pricing_settings pricing-settings
   :seasonal_rates {}
   :settings settings
   :contact_tickets contact-tickets
   :newsletter_subscribers {}
   :blocked_dates {}
   :customer_refresh_tokens {}
   :admin_refresh_tokens {}
   :password_reset_tokens {}
   :idempotency {}
   :notifications []
   :counters {}})
