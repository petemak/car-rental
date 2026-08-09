# QA Report — Rwanda Roadways Car Rental

Date: 2026-08-09

## Round 1 — QA agent findings (frontend + backend, tested live against each other)

Backend: every endpoint in api-contract.md matched exactly (path, method, response shape,
auth enforcement, error envelope, idempotency, role-gating). No backend defects found.

Frontend defects found:
1. `js/config.js` used a relative `API_BASE`, so the site silently ran on mock data even
   with a live backend running.
2. Admin "Add Vehicle" form was missing `specs{}`/`policies{}`/`thumbnail_url` fields,
   crashing Vehicle Detail for any vehicle created through the real admin UI.
3. `chauffeur_assigned` (`{id: "..."}`) was treated as a plain string in two pages.
4. No UI anywhere called `POST /reviews` — review submission was a dead end.
5. Checkout never reached `confirmed` against the real backend — no payment provider
   integration existed, and nothing could trigger the server-to-server webhook.

Contract gap found: no admin endpoint existed to read `POST /contact` submissions.

## Round 2 — fixes applied and verified live against the real backend

Backend (agent a8a7b86faa9c0edaa):
- Added `GET/PATCH /admin/contact-submissions` (+ dashboard count), documented in
  api-contract.md.
- Added dev-only `POST /payments/{id}/simulate-success`, gated behind config flag
  `DEV_PAYMENT_SIMULATION_ENABLED` (must be set `false` for any real/public deployment —
  it fakes payment success and is not a real payment integration).
- Verified via `clojure -M:test` (21 tests / 80 assertions) and `clj-kondo`, both clean.

Frontend (agent ada7bfb6c64dec01a):
- Fixed `API_BASE` to use an absolute backend origin (`window.__RR_API_ORIGIN__`
  override supported for per-environment config).
- Added missing admin fleet-form fields + null-guards on Vehicle Detail.
- Fixed `chauffeur_assigned` handling in both admin and customer views.
- Added a review-submission UI gated to completed bookings with a customer token.
- Wired checkout to the new `simulate-success` endpoint (demo-only, commented as such).
- Also fixed, after cross-checking real (not assumed) backend response shapes: guest
  bookings needing `GET /bookings/lookup` instead of the token-gated `GET /bookings/{id}`;
  flat vs. nested fields on booking-summary endpoints; a missing required `password`
  field on the admin "add staff" form.

All fixes were verified end-to-end against the real running backend (not the mock
fallback): search → book → pay (via simulate-success) → confirmed, guest cancel, review
submission landing in admin moderation, and the full admin flow (fleet, bookings,
pricing, contact tickets, dashboard).

## Sign-off

QA reviewed and confirmed the round-2 fixes close every round-1 finding. Reported to the
project owner (human, in-conversation) on 2026-08-09; owner confirmed "QA has signed off"
and authorized moving to deployment.

## Known items for deployment to carry forward

- `DEV_PAYMENT_SIMULATION_ENABLED` must be `false` (or the route removed/blocked) in any
  publicly reachable deployment — it fakes a successful payment with no real charge.
- Backend uses an in-memory store — restarting the process loses all bookings/customers/
  reviews. Any hosting choice that sleeps/restarts the service (e.g. free tiers that spin
  down on idle) will silently wipe data. This should factor into the hosting
  recommendation, and ideally into a follow-up task to add persistent storage before
  real customer traffic arrives.
- Seeded demo accounts (`admin@example.com` / `admin123`, `staff@example.com` /
  `staff123`, `jane@example.com` / `password123`) are for local dev/demo only and must
  not be shipped as real credentials in a public deployment — replace/remove before go-live.
