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

## Post-sign-off fixes (staging deployment, 2026-08-10)

Deploying the signed-off build to staging (Cloudflare Pages + Render, see render.yaml /
wrangler.toml) surfaced defects that round 1/2 testing didn't catch, since they only
appear under real hosting conditions or on visual inspection of the live site rather than
functional/contract testing. Logged here for the record; none of these reopen a round-1/2
finding.

Deployment-config bugs (found and fixed before first successful deploy, not app code):
- `src/backend/Dockerfile` — `COPY --from=deps /root/.gitlibs` failed the Docker build
  unconditionally, since this project's deps.edn has no `:git/url` deps and tools.deps
  never creates that directory. Fixed with `mkdir -p` before the COPY.
- `wrangler.toml` — Cloudflare Pages dashboard-configured "Preview" environment variables
  do not bind to Functions at runtime for this project (Direct Upload, no Git
  integration) — only a local `wrangler.toml` `[vars]` table does. `API_ORIGIN` moved
  there accordingly.

Content/data bugs (backend seed data, `seed.clj`), not caught by round 1/2 since they're
data-accuracy issues, not contract/behavior issues:
- `{{BRAND_NAME}}` template placeholder was never substituted in two seed records
  (`loc_city_office` location name, `business_name`) — shipped literally to the live API
  response. Fixed to "Rwanda Roadways".
- Every vehicle's and destination's `thumbnail_url`/`photos` pointed at non-resolving
  `https://example.com/img/...` placeholder URLs. First replacement pass reused
  Unsplash URLs verified only by HTTP status (200), not by looking at the image — this
  shipped photos of the wrong make/model (e.g. a Ford Expedition for the Toyota Land
  Cruiser Prado). Caught by the human reviewer on staging; corrected in a second pass
  using images individually downloaded and visually confirmed (correct badge/model)
  before handing off. Lesson: HTTP 200 confirms a URL resolves, not that its content is
  correct.

Frontend visual/CSS bugs, not caught by round 1/2 since that testing was functional
(contract + user-flow), not a visual design review:
- `css/components.css`'s shared `input, select, textarea` rule had no exclusion for
  `type="radio"`/`type="checkbox"`, so every radio and checkbox site-wide rendered as a
  full-width bordered box instead of a small circle/square. Scoped the rule and added a
  dedicated radio/checkbox style.
- Homepage hero heading/lede block used a bespoke `max-width: 720px` that didn't share
  the page's standard `.container` edge, so it visually misaligned with the Hero Search
  Widget below it; header brand wordmark was undersized relative to the hero heading.
  Both fixed, scoped to the home page only.
- Color palette (`brand-brief.md` Section 5, `css/tokens.css`) read as dated
  ("green/sandbrown") despite the brief's stated blue-leaning intent; revised to a
  genuinely blue-based palette, with follow-through contrast fixes on buttons/focus
  rings the new accent color affected.
- Fleet page `.filter-panel` was disproportionately large next to the results list;
  spacing tightened and category/transmission options changed from one-per-line to a
  wrapping row layout.
- Reported: Fleet vehicle card images not uniformly sized (Corolla card a different
  height than others). Investigated — `aspect-ratio`/`object-fit` rules were already
  correctly in place in the deployed CSS; root cause not reproduced from source, most
  likely a stale browser cache at review time. Flagged for a hard-refresh re-check
  rather than a further code change.

All of the above were fixed and re-verified live on staging
(https://staging.car-rental-frontend-2th.pages.dev /
https://car-rental-backend-staging-074n.onrender.com) and approved by the project owner
on 2026-08-10. Production promotion (Phase 2) has not yet happened.
