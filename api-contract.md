# API Contract — {{BRAND_NAME}} Car Rental Website

Companion to `design-spec.md`. This is the exact contract frontend and
backend build against in parallel. Every endpoint below backs a specific
dynamic element named in `design-spec.md`.

No implementation code, no framework choice implied — this is transport
(HTTP + JSON) and shape only.

---

## 0. Conventions

- **Base URL:** `/api/v1` (customer-facing + shared) and `/api/v1/admin`
  (staff-only, separate auth).
- **Format:** JSON request/response bodies, `Content-Type: application/json`
  (file uploads use `multipart/form-data`, noted where relevant).
- **Auth:** Bearer JWT in `Authorization: Bearer <token>` header.
  - Customer endpoints under `/account/*` and booking-mutation endpoints
    require a customer token *or* the guest-lookup pattern (reference +
    email) documented per-endpoint.
  - All `/admin/*` endpoints require an admin token with an appropriate
    role. Two roles assumed: `super_admin` (full access) and
    `booking_staff` (no access to Pricing Settings or Admin Users
    endpoints — those return `403`).
- **Pagination:** list endpoints accept `page` (default `1`) and
  `per_page` (default `20`, max `100`) query params and return:
  ```json
  {
    "data": [ /* items */ ],
    "meta": { "page": 1, "per_page": 20, "total_count": 143, "total_pages": 8 }
  }
  ```
- **Money:** all monetary fields are integers in the smallest currency
  unit is NOT assumed (tourist-facing site, USD-first) — instead all
  amounts are decimal strings with an explicit `currency` field alongside,
  e.g. `"total": "245.00", "currency": "USD"`. Backend is source of truth
  for all pricing math; frontend never computes totals itself, only
  displays what `/pricing/quote` or booking responses return.
- **Dates/times:** dates as `"YYYY-MM-DD"`, times as `"HH:mm"` (24h,
  local to Kigali), timestamps as ISO 8601 UTC (`"created_at"` etc.).
- **Errors:** non-2xx responses always return:
  ```json
  { "error": { "code": "VEHICLE_NOT_AVAILABLE", "message": "This vehicle is not available for the selected dates.", "fields": {} } }
  ```
  `fields` is present (object of field -> message) only for `422`
  validation errors. Standard HTTP status codes: `400` malformed request,
  `401` missing/invalid auth, `403` forbidden (wrong role/owner),
  `404` not found, `409` conflict (e.g., double-booking a date range),
  `422` validation error, `429` rate limited, `5xx` server error.
- **Idempotency:** `POST /bookings` and `POST /payments/intent` accept an
  optional `Idempotency-Key` header; replaying the same key returns the
  original response instead of creating a duplicate.

---

## 1. Public catalog / search endpoints

### `GET /vehicle-categories`
Backs: Filter Sidebar, Hero Search Widget category dropdown.
- Auth: none.
- Response `200`:
```json
{
  "data": [
    { "id": "cat_city", "name": "City Car", "description": "Compact and easy to park.", "icon": "city" },
    { "id": "cat_suv", "name": "SUV", "description": "More room, comfortable on longer routes.", "icon": "suv" },
    { "id": "cat_offroad", "name": "Off-Road", "description": "Built for national park terrain.", "icon": "offroad" }
  ]
}
```

### `GET /locations`
Backs: pickup/drop-off location fields in Hero Search Widget and Checkout.
- Auth: none.
- Response `200`:
```json
{
  "data": [
    { "id": "loc_kgl_airport", "name": "Kigali International Airport (KGL)", "type": "airport", "address": "Kanombe, Kigali" },
    { "id": "loc_city_office", "name": "{{BRAND_NAME}} City Office", "type": "city_office", "address": "KN 4 Ave, Kigali" }
  ]
}
```

### `GET /vehicles`
Backs: Fleet page listing, Home page "featured fleet" pull (call with
`per_page` small and no date filter for featured use).
- Auth: none.
- Query params:
  - `pickup_date` (optional, `YYYY-MM-DD`)
  - `return_date` (optional, `YYYY-MM-DD`; required if `pickup_date` set)
  - `pickup_location_id` (optional)
  - `category` (optional, category id)
  - `service_type` (optional, `self_drive` | `chauffeur`)
  - `transmission` (optional, `automatic` | `manual`)
  - `min_seats` (optional, integer)
  - `price_min`, `price_max` (optional, decimal strings)
  - `sort` (optional, `price_asc` | `price_desc` | `recommended`; default `recommended`)
  - `page`, `per_page`
- Response `200`:
```json
{
  "data": [
    {
      "id": "veh_101",
      "name": "Toyota Land Cruiser Prado",
      "category": { "id": "cat_offroad", "name": "Off-Road" },
      "seats": 7,
      "transmission": "automatic",
      "fuel_type": "diesel",
      "price_per_day": "180.00",
      "currency": "USD",
      "thumbnail_url": "https://.../landcruiser-1.jpg",
      "available": true,
      "chauffeur_available": true,
      "airport_pickup_available": true,
      "rating_avg": 4.8,
      "rating_count": 37
    }
  ],
  "meta": { "page": 1, "per_page": 20, "total_count": 14, "total_pages": 1 }
}
```
- Notes: `available` is only meaningful when `pickup_date`/`return_date`
  were supplied; if omitted, `available` reflects general active/retired
  status only.

### `GET /vehicles/{id}`
Backs: Vehicle Detail page.
- Auth: none.
- Query params: `pickup_date`, `return_date` (optional — if provided,
  response includes a computed `price_breakdown`; if omitted,
  `price_breakdown` is `null` and the frontend prompts the user to pick
  dates).
- Response `200`:
```json
{
  "id": "veh_101",
  "name": "Toyota Land Cruiser Prado",
  "category": { "id": "cat_offroad", "name": "Off-Road" },
  "seats": 7,
  "transmission": "automatic",
  "fuel_type": "diesel",
  "price_per_day": "180.00",
  "currency": "USD",
  "photos": ["https://.../lc-1.jpg", "https://.../lc-2.jpg"],
  "features": ["4x4", "Air conditioning", "Bluetooth", "Roof rack"],
  "specs": { "doors": 5, "luggage_capacity_l": 500, "air_conditioning": true, "off_road_capable": true },
  "policies": {
    "mileage_limit_km_per_day": 250,
    "fuel_policy": "full-to-full",
    "min_driver_age": 23,
    "license_requirement": "Valid driver's license or IDP, held 2+ years",
    "security_deposit_amount": "300.00",
    "currency": "USD",
    "cancellation_policy_summary": "Full refund up to 72h before pickup."
  },
  "chauffeur_available": true,
  "airport_pickup_available": true,
  "rating_avg": 4.8,
  "rating_count": 37,
  "availability_blocked_ranges": [
    { "start_date": "2026-09-01", "end_date": "2026-09-04" }
  ],
  "price_breakdown": {
    "base_rate_per_day": "180.00",
    "days": 5,
    "subtotal": "900.00",
    "chauffeur_fee": "0.00",
    "airport_pickup_fee": "0.00",
    "taxes_fees": "45.00",
    "total": "945.00",
    "currency": "USD"
  }
}
```
- Errors: `404` if vehicle doesn't exist or is `retired` (retired vehicles
  are not publicly resolvable by id).

---

## 2. Pricing quote (live calculation before booking is created)

### `POST /pricing/quote`
Backs: Vehicle Detail booking widget and Checkout Step 1 live price panel
whenever the user changes dates/extras.
- Auth: none.
- Request:
```json
{
  "vehicle_id": "veh_101",
  "pickup_date": "2026-09-10",
  "return_date": "2026-09-15",
  "service_type": "chauffeur",
  "airport_pickup": true,
  "additional_driver": false,
  "child_seat": true
}
```
- Response `200`:
```json
{
  "subtotal": "900.00",
  "chauffeur_fee": "250.00",
  "airport_pickup_fee": "40.00",
  "additional_driver_fee": "0.00",
  "child_seat_fee": "25.00",
  "taxes_fees": "60.75",
  "total": "1275.75",
  "currency": "USD",
  "payment_model": "deposit",
  "deposit_due": "382.73",
  "balance_due": "893.02"
}
```
- Errors: `409 VEHICLE_NOT_AVAILABLE` if the date range is already
  blocked/booked; `422` if dates are invalid (return before pickup, past
  dates, etc).

---

## 3. Bookings

### `POST /bookings`
Backs: Checkout submission (end of Step 2 -> creates a `pending_payment`
booking before the Payment step runs).
- Auth: optional (guest allowed; if a valid customer token is sent, the
  booking is auto-linked to that account).
- Request:
```json
{
  "vehicle_id": "veh_101",
  "pickup_date": "2026-09-10",
  "pickup_time": "10:00",
  "return_date": "2026-09-15",
  "return_time": "10:00",
  "pickup_location_id": "loc_kgl_airport",
  "dropoff_location_id": "loc_kgl_airport",
  "service_type": "chauffeur",
  "airport_pickup": true,
  "flight_number": "KQ123",
  "additional_driver": false,
  "child_seat": true,
  "customer": {
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "phone": "+1 555 010 2000",
    "country": "United States",
    "license_number": "D1234567",
    "license_expiry": "2029-04-01"
  },
  "special_requests": "Arriving on a late flight, please confirm meeting point.",
  "create_account": true,
  "password": "optional-if-create_account-true",
  "accepted_terms": true
}
```
- Response `201`:
```json
{
  "booking_id": "bk_9001",
  "reference": "RR-9001",
  "status": "pending_payment",
  "price_breakdown": { "...": "same shape as /pricing/quote response" },
  "customer_account_created": true,
  "customer_token": "jwt...(present only if create_account true)"
}
```
- Errors: `422 VALIDATION_ERROR` (missing terms acceptance, invalid
  license fields for self-drive, etc.); `409 VEHICLE_NOT_AVAILABLE`.

### `GET /bookings/lookup?reference={reference}&email={email}`
Backs: guest "look up my booking" (no login) path from design-spec
Account section.
- Auth: none (reference + email act as the lookup credential).
- Response `200`: `BookingDetail` (shape below). `404` if no match.

### `GET /bookings/{id}` (authenticated) or via lookup above
`BookingDetail` shape:
```json
{
  "id": "bk_9001",
  "reference": "RR-9001",
  "status": "confirmed",
  "vehicle": { "id": "veh_101", "name": "Toyota Land Cruiser Prado", "thumbnail_url": "https://.../lc-1.jpg" },
  "pickup_date": "2026-09-10",
  "pickup_time": "10:00",
  "return_date": "2026-09-15",
  "return_time": "10:00",
  "pickup_location": { "id": "loc_kgl_airport", "name": "Kigali International Airport (KGL)" },
  "dropoff_location": { "id": "loc_kgl_airport", "name": "Kigali International Airport (KGL)" },
  "service_type": "chauffeur",
  "airport_pickup": true,
  "flight_number": "KQ123",
  "chauffeur_assigned": null,
  "customer": { "first_name": "Jane", "last_name": "Doe", "email": "jane@example.com", "phone": "+1 555 010 2000" },
  "price_breakdown": { "...": "same shape as /pricing/quote" },
  "payment_status": "paid",
  "created_at": "2026-08-01T12:04:00Z"
}
```
Status enum: `pending_payment | confirmed | in_progress | completed |
cancelled`. Payment status enum: `pending | paid | partially_paid |
failed | refunded`.

### `POST /bookings/{id}/cancel`
Backs: My Bookings / Booking Detail "Cancel booking" action.
- Auth: customer token owning the booking, or guest via
  `reference`+`email` in body.
- Request: `{ "reference": "RR-9001", "email": "jane@example.com", "reason": "Trip changed" }` (reference/email omitted if using a bearer token instead)
- Response `200`:
```json
{ "status": "cancelled", "refund_amount": "895.00", "refund_status": "processing", "currency": "USD" }
```
- Errors: `409 CANCELLATION_WINDOW_PASSED` if outside the policy window
  (message includes the policy-derived refund amount, which may be `0.00`
  rather than blocking the cancellation outright — business rule to
  confirm, but the endpoint always succeeds in *cancelling*, refund amount
  is what varies).

### `GET /account/bookings` (auth required)
Backs: My Bookings page.
- Response `200`: paginated list of `BookingSummary` (subset of
  `BookingDetail`: id, reference, status, vehicle name+thumbnail,
  pickup/return dates, total, currency).

---

## 4. Payments

### `POST /payments/intent`
Backs: Checkout Step 3 — called once the booking exists, before showing
the payment form.
- Auth: same rules as booking ownership (token or reference+email).
- Request:
```json
{ "booking_id": "bk_9001", "amount": "382.73", "currency": "USD", "payment_method": "card" }
```
- Response `200`:
```json
{ "payment_id": "pay_5001", "provider": "stripe", "client_secret": "pi_..._secret_...", "amount": "382.73", "currency": "USD" }
```
  (Shape assumes a Stripe-style client-secret flow; if the chosen provider
  uses redirect instead, response substitutes `"redirect_url"` for
  `"client_secret"` — provider choice is a backend decision outside this
  contract's scope, but the frontend only needs one of these two fields.)

### `GET /bookings/{id}/payment-status`
Backs: Checkout polling after payment submission, and Booking
Confirmation page.
- Response `200`: `{ "payment_status": "paid", "amount_paid": "382.73", "currency": "USD" }`

### `POST /payments/webhook`
Server-to-server only (called by the payment provider, never by
frontend). Documented so backend knows it must exist: on successful
charge, updates the linked booking's `payment_status` and `status`
(`pending_payment` -> `confirmed`), and triggers the `booking_confirmed`
notification (Section 7).

### `POST /payments/{id}/simulate-success` — **DEV/DEMO-ONLY, added post-QA**
Not part of the original contract. Added because Section 14 explicitly
scoped out a real payment provider integration, but that also means
nothing in this contract can ever trigger `POST /payments/webhook` outside
of a real provider — so without this endpoint, every checkout dead-ends at
`pending_payment` forever and the flow can't be demoed end-to-end. This
endpoint does exactly what a successful `POST /payments/webhook` call does
(marks the payment + linked booking paid/confirmed, fires the
`booking_confirmed` and `admin_new_booking` notifications), but is safe
for the **frontend** to call directly right after `POST /payments/intent`,
in place of an actual payment provider round-trip.
- `{id}` is the `payment_id` returned by `POST /payments/intent`.
- Auth: none — this is a demo shortcut, not a real payment confirmation;
  do not rely on it for anything security-sensitive.
- **Gated by a backend config flag** (`DEV_PAYMENT_SIMULATION_ENABLED`,
  default enabled). When disabled, the route responds `404 NOT_FOUND` as
  if it doesn't exist — the flag exists precisely so this can never
  accidentally ship live in a real deployment. Ask backend before relying
  on this in any environment other than local/demo.
- Response `200`:
```json
{ "payment_id": "pay_5001", "booking_id": "bk_9001", "booking_status": "confirmed", "payment_status": "paid", "amount_paid": "382.73", "currency": "USD" }
```
  (`payment_status` is `"partially_paid"` instead of `"paid"` if the
  booking's `payment_model` is `"deposit"` and the intent's `amount` only
  covered the deposit — same partial-payment logic as the real webhook.)
- Errors: `404 PAYMENT_NOT_FOUND` if `{id}` doesn't match a payment created
  via `POST /payments/intent`.

---

## 5. Customer auth & account

### `POST /auth/customer/register`
Request: `{ "first_name": "Jane", "last_name": "Doe", "email": "jane@example.com", "password": "...", "phone": "+1 555 010 2000" }`
Response `201`: `{ "customer_id": "cust_1", "token": "jwt...", "refresh_token": "..." }`
Errors: `422 EMAIL_TAKEN`.

### `POST /auth/customer/login`
Request: `{ "email": "jane@example.com", "password": "..." }`
Response `200`: `{ "token": "jwt...", "refresh_token": "...", "customer": { "id": "cust_1", "first_name": "Jane", "email": "jane@example.com" } }`
Errors: `401 INVALID_CREDENTIALS`.

### `POST /auth/customer/logout` — invalidates refresh token. `204`.
### `POST /auth/customer/refresh` — `{ "refresh_token": "..." }` -> `{ "token": "jwt..." }`.
### `POST /auth/customer/forgot-password` — `{ "email": "..." }` -> `204` always (no user enumeration).
### `POST /auth/customer/reset-password` — `{ "token": "...", "new_password": "..." }` -> `204`.

### `GET /account/profile` (auth) -> customer profile object.
### `PATCH /account/profile` (auth) — request: any subset of
`{first_name, last_name, phone, country, license_number, license_expiry}`
-> updated profile object.

---

## 6. Reviews

### `GET /reviews`
Backs: Reviews page, Vehicle Detail reviews block, Home reviews strip.
- Auth: none.
- Query params: `vehicle_id`, `category`, `page`, `per_page`.
- Response `200`:
```json
{
  "data": [
    { "id": "rev_1", "customer_name": "Mark T.", "country": "United Kingdom", "rating": 5, "comment": "Land Cruiser was spotless, driver was excellent.", "vehicle_name": "Toyota Land Cruiser Prado", "created_at": "2026-06-02T09:00:00Z" }
  ],
  "meta": { "page": 1, "per_page": 20, "total_count": 6, "total_pages": 1 },
  "aggregate": { "average_rating": 4.8, "count": 37 }
}
```
Only `status: approved` reviews are ever returned by this public endpoint.

### `POST /reviews` (auth required)
Backs: "Leave a review" CTA — only shown for a customer with a
`completed` booking.
- Request: `{ "booking_id": "bk_9001", "rating": 5, "comment": "..." }`
- Response `201`: `{ "id": "rev_9", "status": "pending_moderation" }`
- Errors: `403 BOOKING_NOT_ELIGIBLE` if booking isn't `completed` or
  doesn't belong to the authenticated customer; `409 REVIEW_ALREADY_EXISTS`.

---

## 7. Destinations / content

### `GET /destinations` -> `{ "data": [ { "id": "dest_1", "title": "Self-Driving to Volcanoes National Park", "slug": "volcanoes-national-park", "thumbnail_url": "...", "excerpt": "..." } ] }`
### `GET /destinations/{slug}` -> `{ "id": "dest_1", "title": "...", "hero_image_url": "...", "body_html": "...", "suggested_category": { "id": "cat_offroad", "name": "Off-Road" } }`

---

## 8. Contact & newsletter

### `POST /contact`
Request: `{ "name": "Jane Doe", "email": "jane@example.com", "subject": "Question about airport pickup", "message": "..." }`
Response `201`: `{ "ticket_id": "tk_301", "status": "received" }`
Triggers `contact_form_received` admin notification (Section 9).

### `POST /newsletter/subscribe`
Request: `{ "email": "jane@example.com" }`
Response `200`: `{ "status": "subscribed" }` (idempotent — re-subscribing an
existing email returns the same `200`, not an error).

---

## 9. Notifications (event catalog, not frontend-called endpoints)

The frontend never calls these directly; documented so backend implements
the trigger points design-spec.md's Notifications section depends on.

| Event | Trigger | Recipient | Channel |
|---|---|---|---|
| `booking_confirmed` | payment webhook marks booking `confirmed` | customer | email |
| `booking_reminder` | scheduled job, ~48h before `pickup_date` | customer | email |
| `booking_cancelled` | `POST /bookings/{id}/cancel` succeeds | customer | email |
| `payment_failed` | payment provider reports failure | customer | email |
| `admin_new_booking` | any booking reaches `confirmed` | admin/staff | email + admin dashboard badge |
| `admin_review_submitted` | `POST /reviews` creates a pending review | admin/staff | admin dashboard badge |
| `admin_contact_received` | `POST /contact` | admin/staff | email + admin dashboard badge |

Email content/templates are managed via `GET/PATCH /admin/settings`
(Section 13) rather than hardcoded, so the business owner can edit wording
without a deploy.

---

## 10. Admin auth

### `POST /admin/auth/login`
Request: `{ "email": "staff@{{brand-domain}}", "password": "..." }`
Response `200`: `{ "token": "jwt...", "refresh_token": "...", "admin": { "id": "adm_1", "name": "...", "role": "super_admin" } }`
### `POST /admin/auth/logout` -> `204`.
### `POST /admin/auth/refresh` -> `{ "refresh_token": "..." }` -> `{ "token": "jwt..." }`.

All `/admin/*` endpoints below require `Authorization: Bearer <admin token>`.

---

## 11. Admin — fleet

### `GET /admin/vehicles?status=&category=&page=&per_page=`
Response: paginated list, same fields as public `GET /vehicles` plus
`status` (`active | maintenance | retired`) and `created_at`/`updated_at`.

### `POST /admin/vehicles`
Request: full vehicle object (name, category_id, seats, transmission,
fuel_type, price_per_day, currency, features[], specs{}, policies{},
chauffeur_available, airport_pickup_available, status).
Response `201`: created vehicle object with `id`.

### `GET /admin/vehicles/{id}` -> full vehicle object (admin view, all
fields including internal notes if any).
### `PATCH /admin/vehicles/{id}` — partial update, same field set as POST.
### `DELETE /admin/vehicles/{id}` — soft delete: sets `status = retired`,
does not hard-delete (preserves history for past bookings). `204`.

### `POST /admin/vehicles/{id}/photos` (`multipart/form-data`, field `file`)
Response `201`: `{ "photo_id": "ph_1", "url": "https://.../lc-3.jpg" }`
### `DELETE /admin/vehicles/{id}/photos/{photo_id}` -> `204`.

### `GET /admin/vehicles/{id}/availability`
Response: `{ "blocked_ranges": [{ "id": "blk_1", "start_date": "...", "end_date": "...", "reason": "Scheduled maintenance" }], "booked_ranges": [{ "booking_id": "bk_9001", "start_date": "...", "end_date": "..." }] }`

### `POST /admin/vehicles/{id}/block-dates`
Request: `{ "start_date": "2026-09-20", "end_date": "2026-09-22", "reason": "Service" }`
Response `201`: created block object with `id`.
### `DELETE /admin/vehicles/{id}/block-dates/{block_id}` -> `204`.

---

## 12. Admin — bookings

### `GET /admin/bookings?status=&date_from=&date_to=&vehicle_id=&page=&per_page=`
Response: paginated `BookingSummary` list (id, reference, customer name,
vehicle name, pickup/return dates, status, payment_status, total).

### `GET /admin/bookings/{id}` -> full `BookingDetail` (admin view — also
includes `internal_notes`, full customer contact info, payment provider
transaction id).

### `PATCH /admin/bookings/{id}`
Request (any subset): `{ "status": "in_progress", "chauffeur_id": "drv_3", "internal_notes": "Guest requested early pickup." }`
Response `200`: updated `BookingDetail`.

### `POST /admin/bookings/{id}/resend-confirmation` -> `204`, re-fires the
`booking_confirmed` email.

---

## 13. Admin — customers, pricing, reviews, content, users, settings, dashboard

### `GET /admin/customers?search=&page=&per_page=`
Response: paginated list `{ id, first_name, last_name, email, phone, bookings_count, last_booking_date }`.
### `GET /admin/customers/{id}` -> profile + `bookings: [BookingSummary]`.

### `GET /admin/pricing/settings`
Response:
```json
{
  "payment_model": "deposit",
  "deposit_percentage": 30,
  "currency_default": "USD",
  "extras": {
    "chauffeur_fee_per_day": "50.00",
    "airport_pickup_fee": "40.00",
    "additional_driver_fee": "15.00",
    "child_seat_fee": "5.00"
  }
}
```
### `PATCH /admin/pricing/settings` — partial update of the above (role:
`super_admin` only; `booking_staff` -> `403`).

### `GET /admin/pricing/seasonal-rates` -> list `{ id, vehicle_id | category_id, start_date, end_date, price_per_day, currency }`.
### `POST /admin/pricing/seasonal-rates` — create one (fields above, no `id`). `super_admin` only.
### `DELETE /admin/pricing/seasonal-rates/{id}` -> `204`. `super_admin` only.

### `GET /admin/reviews?status=pending|approved|rejected`
Response: paginated review list with full (not just approved) reviews.
### `PATCH /admin/reviews/{id}`
Request: `{ "status": "approved", "admin_reply": "Thank you for the kind words!" }`
Response `200`: updated review.

### `GET /admin/destinations` / `POST /admin/destinations` /
`PATCH /admin/destinations/{id}` / `DELETE /admin/destinations/{id}`
— same field shape as public `GET /destinations/{slug}` plus `status`
(`draft | published`).

### `GET /admin/users` / `POST /admin/users` / `PATCH /admin/users/{id}` /
`DELETE /admin/users/{id}` — `{ id, name, email, role }`, role in
`super_admin | booking_staff`. `super_admin` only for all four.

### `GET /admin/settings`
Response:
```json
{
  "business_name": "{{BRAND_NAME}}",
  "contact_email": "hello@{{brand-domain}}",
  "contact_phone": "+250 7xx xxx xxx",
  "whatsapp_number": "+250 7xx xxx xxx",
  "office_address": "KN 4 Ave, Kigali",
  "notification_templates": { "booking_confirmed": "...", "booking_reminder": "...", "booking_cancelled": "..." },
  "payment_provider": { "provider": "stripe", "public_key": "pk_live_..." }
}
```
### `PATCH /admin/settings` — partial update. `super_admin` only.

### `GET /admin/dashboard/summary`
Response:
```json
{
  "upcoming_pickups_today": 3,
  "upcoming_returns_today": 2,
  "new_bookings_this_week": 11,
  "pending_reviews_count": 4,
  "pending_contact_submissions_count": 2,
  "revenue_this_month": "8420.00",
  "currency": "USD"
}
```
`pending_contact_submissions_count` added post-QA alongside
`GET /admin/contact-submissions` below (Section 13a) — see that section
for why. Purely additive: existing consumers reading the fields above are
unaffected.

---

## 13a. Admin — contact submissions *(added post-QA, not in the original
contract)*

**Why this was added:** `POST /contact` (Section 8) always stored the
submitted ticket server-side and fired the `admin_contact_received`
notification (Section 9), but the original contract never defined an admin
endpoint to actually read those tickets — QA flagged that admins had no
way to see contact messages except a server log line. These two endpoints
close that gap; they follow the same list/filter/patch pattern as
`GET /admin/bookings` and `PATCH /admin/reviews/{id}`.

### `GET /admin/contact-submissions?status=&page=&per_page=`
- Auth: any admin role (not restricted to `super_admin` — contact triage
  isn't among the contract's super_admin-only areas, i.e. Pricing Settings
  and Admin Users).
- `status` (optional): `new | read | resolved`.
- Response `200`:
```json
{
  "data": [
    { "id": "tk_301", "name": "Jane Doe", "email": "jane@example.com", "subject": "Question about airport pickup", "message": "...", "status": "new", "created_at": "2026-08-05T08:00:00Z" }
  ],
  "meta": { "page": 1, "per_page": 20, "total_count": 2, "total_pages": 1 }
}
```

### `GET /admin/contact-submissions/{id}` -> single ticket, same shape as
a `data[]` item above. `404 CONTACT_SUBMISSION_NOT_FOUND` if unknown.

### `PATCH /admin/contact-submissions/{id}`
Request: `{ "status": "read" }` (or `"resolved"`; `"new"` also accepted to
revert). Response `200`: updated ticket (same shape as above).
- Note: this `status` (ticket triage state: `new | read | resolved`) is
  independent of the `"status": "received"` literal returned by the
  original `POST /contact` response in Section 8, which is just an
  acknowledgement to the submitter and doesn't change.

---

## 14. Open items for backend/frontend to confirm before build (flagged,
not blocking either team from starting)

- Payment provider choice (Stripe vs. a provider with stronger Africa/
  Rwanda card + mobile-money coverage) affects the exact
  `client_secret`/`redirect_url` shape in Section 4 — both are documented
  above so frontend can build against either without waiting.
- `payment_model` (full payment vs. deposit) defaults to `deposit` in
  examples above per `brand-brief.md` Section 9's noted assumption; this
  is backend-configurable via `/admin/pricing/settings`, not hardcoded, so
  the business owner's real decision doesn't require a frontend change.
- Multi-currency display (USD default vs. showing RWF/EUR/GBP) is out of
  scope for v1 of this contract — `currency` fields exist everywhere so it
  can be added later without breaking shape.
- **Resolved post-QA, both additive (no existing shape changed):**
  `POST /payments/{id}/simulate-success` (Section 4) as a dev/demo-only
  stand-in for a real payment provider, and `GET`/`PATCH
  /admin/contact-submissions` (Section 13a) plus the
  `pending_contact_submissions_count` dashboard field, so admins can read
  `POST /contact` submissions. Frontend: flagged directly, not silently
  changed — see those sections for full shapes.
