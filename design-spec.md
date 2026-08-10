# Design Spec — {{BRAND_NAME}} Car Rental Website

Companion to `scope-checklist.md` (what's in scope and why) and
`api-contract.md` (exact endpoints for everything dynamic below). Built from
`brand-brief.md`: palette (`#1D4ED8` confident blue primary / `#F5A524`
golden-amber accent / `#F7F9FC` cool neutral background / `#1E293B` charcoal
text), type pairing (Poppins or Sora for headings, Inter for body), and voice
(trustworthy, warm, capable, unpretentious-premium). `{{BRAND_NAME}}` is a
placeholder token — swap when the business owner confirms a final name.

Primary layout reference: kayak.com / cheapflights.com search-and-filter
conventions, adapted from a marketplace feel to a single, warm, local
operator. Primary language: English (Kinyarwanda/French flagged as a
possible future addition, not built now).

---

## 0. Site map (customer-facing + admin)

Customer-facing:
1. Home
2. Fleet (search/browse vehicles)
3. Vehicle Detail
4. Booking / Checkout (multi-step)
5. Booking Confirmation
6. Services (Self-Drive / Chauffeur / Airport Pickup)
7. Destinations & Trip Guides
8. About / Our Standards
9. Reviews
10. FAQ
11. Contact
12. Legal: Terms of Service, Privacy Policy, Cancellation & Refund Policy,
    Driver Requirements & Insurance
13. Account: Login / Register (optional), My Bookings, Booking Detail
    (manage/cancel), Profile

Admin / back-office (separate `/admin` app or subdomain, staff-only auth):
14. Admin Login
15. Admin Dashboard
16. Fleet Management (list, add/edit vehicle, availability calendar)
17. Bookings Management (list, filter, detail, status changes, driver
    assignment)
18. Customers (list, detail/history)
19. Pricing & Extras Management
20. Reviews Moderation
21. Destinations/Content Management (guides shown on the customer-facing
    Destinations page)
22. Admin Users & Roles
23. Business Settings (contact info, notification templates, payment
    provider config)

---

## 1. Shared components (used across pages)

- **Global Nav** — logo (`{{BRAND_NAME}}` wordmark), links: Fleet, Services,
  Destinations, Reviews, FAQ, Contact; persistent "Book Now" button
  (terracotta `#C1592A`, high-contrast against teal nav); currency selector
  (default USD, since target customers book from abroad); account
  icon/menu (Login / My Bookings). Collapses to hamburger + sticky search
  icon on mobile.
- **Hero Search Widget** — the kayak-style booking search bar: pickup
  location (dropdown incl. "Kigali International Airport"), optional
  drop-off location, pickup date+time, return date+time, vehicle category
  filter (optional), self-drive vs. chauffeur toggle. Used full-size on
  Home, condensed/sticky at top of Fleet page pre-filled with the last
  search.
- **Vehicle Card** — photo, name/model, category badge (City / Sedan /
  SUV / Off-Road), seats/transmission/fuel icons, price-per-day (large,
  price-forward per brief's kayak/cheapflights reference), "well
  maintained" trust micro-copy, "View details" / "Book" CTA.
- **Trust Bar** — small icon row: "Well-maintained fleet," "Airport
  pickup," "Chauffeur available," "Real reviews" — reused on Home and
  Vehicle Detail.
- **Filter Sidebar** — category, transmission, seats, price range,
  self-drive/chauffeur, "airport pickup available" checkbox. Used on Fleet
  page; collapses to a filter drawer on mobile.
- **Price Breakdown Panel** — line items (base rate x days, chauffeur fee,
  airport pickup fee, insurance, taxes/fees, deposit vs. total) — reused in
  Vehicle Detail and Checkout.
- **Step Indicator** — 4-step progress bar for the booking flow (Trip
  Details -> Your Details -> Payment -> Confirmation).
- **Testimonial / Review Card** — traveler name, home country/flag,
  star rating, quote, optional vehicle rented.
- **FAQ Accordion** — question/answer collapse pattern, reused on FAQ page
  and as a compact block on Vehicle Detail / Services.
- **CTA Banner** — full-width terracotta or teal band with a single
  message + button ("Ready to explore Rwanda? Check availability").
- **Form Field Kit** — text input, select, date picker, phone input
  (with country code), textarea, checkbox/consent — shared across
  Checkout, Contact, Login/Register, Admin forms.
- **Modal / Lightbox** — used for vehicle photo galleries, login/register,
  and confirmation dialogs.
- **Alert / Toast** — success, error, and info banners (e.g., "Booking
  confirmed," "This vehicle is unavailable for the selected dates").
- **Footer** — sitemap (customer links + legal links), contact info
  (phone/WhatsApp/email), social links, newsletter signup form, small
  "Kigali, Rwanda" locality note for trust.
- **Admin Sidebar Nav** — separate component set for the admin app:
  Dashboard, Fleet, Bookings, Customers, Pricing, Reviews, Content,
  Settings, Users.
- **Admin Data Table** — sortable/filterable table with row actions,
  reused across Fleet, Bookings, Customers, Reviews admin screens.

---

## 2. Customer-facing pages

### 2.1 Home

Purpose: convert a first-time visitor into a search — establish trust fast
(brief: "trustworthy," "capable") and route into the booking funnel within
one scroll.

Sections, top to bottom:
1. **Hero** — full-width photo of a Land Cruiser or scenic Rwanda road
   (real photography per brief, not stock-luxury clichés), warm headline
   in the brand voice (e.g., placeholder: "Your trip, from the tarmac to
   the trailhead"), Hero Search Widget overlaid/below.
2. **Trust Bar** — 4 icons as above, directly under the hero so the
   "affordable premier" and safety reassurance land immediately.
3. **Fleet Range teaser** (messaging pillar 1) — 3-4 Vehicle Cards spanning
   the range (city car, sedan/mid SUV, Land Cruiser) with a "View full
   fleet" link to the Fleet page. Layout: horizontal card row on desktop,
   swipeable carousel on mobile.
4. **End-to-End Service** (pillar 2) — 3-column block: Airport Pickup /
   Chauffeur Service / Self-Drive, each with a short description and a
   link into the Services page.
5. **Why {{BRAND_NAME}}** (pillars 3 + 4: quality/condition, affordable
   premier) — short copy block + supporting photo, concrete claims
   (maintenance standards, transparent pricing, no hidden fees) rather
   than superlatives, per brand voice guidance.
6. **Explore Rwanda teaser** (pillar 5: local expertise) — 2-3 destination
   cards (e.g., Volcanoes National Park, Lake Kivu, Nyungwe) linking to
   the Destinations page, framed as trip inspiration not just transport.
7. **Reviews strip** — 3 Testimonial Cards + link to full Reviews page.
8. **CTA Banner** — final push back to the search widget/Fleet page.
9. **Footer**.

Dynamic content: Hero Search Widget (drives a query to Fleet page),
featured-vehicles pull (small subset of catalog), reviews pull, newsletter
signup in footer.

### 2.2 Fleet (search / browse)

Purpose: the kayak-style comparison screen — let a tourist filter down to
the right vehicle by trip type and budget.

Sections:
1. **Condensed Search Bar** (sticky top) — same fields as Hero widget,
   editable in place; re-runs search on change.
2. **Filter Sidebar** (left, desktop) / **Filter Drawer** (mobile) — as
   described in Shared Components.
3. **Results header** — result count, sort control (Price: low-high,
   Price: high-low, Recommended, Seats).
4. **Vehicle Card grid/list** — price-forward cards per brief; each card
   shows availability status for the searched dates. Empty state: "No
   vehicles match — try adjusting dates or removing a filter" (never a
   dead end).
5. **Pagination** or infinite scroll (spec assumes standard pagination for
   simplicity/back-end predictability).
6. **Footer**.

Dynamic content: live filtered/sorted/paginated vehicle list tied to
selected dates and filters (see `GET /vehicles` in api-contract.md).

### 2.3 Vehicle Detail

Purpose: give the tourist everything needed to trust this specific car and
commit to booking it — this is the highest-trust-load page on the site.

Sections:
1. **Photo Gallery** — multiple real photos (exterior, interior, trunk
   space), opens into Lightbox.
2. **Header block** — vehicle name/model, category badge, price-per-day,
   short trust line ("Inspected and cleaned before every trip").
3. **Specs grid** — seats, doors, transmission, fuel type, luggage
   capacity, air conditioning, 4x4/off-road capability where relevant.
4. **Availability + Booking Widget** — date pickers (pre-filled from
   search if the user arrived via Fleet page), self-drive vs. chauffeur
   toggle, airport pickup add-on checkbox, live Price Breakdown Panel,
   "Continue to book" CTA -> Checkout step 1.
5. **Policies block** — mileage limits, fuel policy, minimum driver age,
   license/IDP requirement, security deposit, cancellation window —
   stated plainly per brand voice ("Trustworthy: Do state prices, fleet
   condition, and policies plainly").
6. **Reviews for this vehicle/category** — filtered Testimonial Cards.
7. **Similar vehicles** — 3 Vehicle Cards from the same or adjacent
   category.
8. **FAQ Accordion** (compact) — booking-specific questions.
9. **Footer**.

Dynamic content: single-vehicle fetch with live availability and computed
price, review fetch scoped to vehicle/category.

### 2.4 Booking / Checkout (multi-step, one URL with steps or 3-4 routed
steps — spec leaves this implementation choice to frontend, but the
*content* of each step is fixed)

Purpose: guided, low-anxiety funnel — the brief explicitly calls for a
"self-serve booking flow" instead of the phone/WhatsApp pattern competitors
use.

Step Indicator shown throughout: Trip Details -> Your Details -> Payment ->
Confirmation.

1. **Step 1 — Trip Details** — confirm/edit pickup & return dates and
   locations, self-drive vs. chauffeur, airport pickup add-on (with flight
   number field if selected), additional driver toggle, child seat toggle.
   Live Price Breakdown Panel updates as options change.
2. **Step 2 — Your Details** — full name, email, phone (with country
   code), country of residence, driver's license/IDP number and expiry
   (required for self-drive), optional account creation checkbox
   ("Save these details for next time" — creates an account without
   blocking guest checkout), special requests textarea.
3. **Step 3 — Payment** — payment method selection (card, and optionally
   PayPal), amount due now vs. balance on arrival if deposit model is
   enabled (admin-configurable, see api-contract.md), terms/consent
   checkbox linking to Cancellation & Refund Policy, "Confirm and Pay"
   button.
4. **Step 4 / redirect — Confirmation** — booking reference number,
   summary of everything booked, "check your email" notice, pickup
   instructions (what to bring, where to meet the driver), links to
   Manage Booking and Contact Support.

Dynamic content: full read/write booking creation, live price calc,
payment processing, confirmation email trigger (see api-contract.md
Bookings and Payments sections).

### 2.5 Services

Purpose: give Airport Pickup, Chauffeur, and Self-Drive each enough
dedicated explanation to remove first-time-visitor anxiety (pillar 2).

Sections: intro block, then 3 sub-sections (one per service) each with:
what it is, who it's for, how pricing works, what's included, a relevant
photo, and a CTA into Fleet/Checkout pre-filtered to that service type.
Closes with Trust Bar + CTA Banner + Footer.

### 2.6 Destinations & Trip Guides

Purpose: pillar 5 (local expertise) — content marketing that also
functions as SEO and gives tourists a reason to browse before booking.

Sections: intro, grid of destination/guide cards (e.g., "Self-driving to
Volcanoes National Park," "Airport to Lake Kivu: what to expect"), each
linking to a guide detail view (title, hero photo, body copy, suggested
vehicle category for that route, CTA to Fleet filtered by that category).
Footer.

Note: this is the one area where scope is intentionally light — brief
flags it as "room for," not a mandate; spec keeps it to a simple
admin-editable content list rather than a full CMS/blog engine.

### 2.7 About / Our Standards

Purpose: brand story + explicit "quality and condition" trust claims
(pillar 3) — maintenance process, hospitality-grade service standards,
local team framing. Static content page: intro, "our standards" list
(cleaning/maintenance checklist framed in plain language), team/founder
note, Trust Bar, CTA Banner, Footer.

### 2.8 Reviews

Purpose: dedicated trust/social-proof page (competitive differentiation —
brief calls out "verified reviews" as a trust signal tourists pay a
premium for).

Sections: aggregate rating summary (average stars, count), filter by
vehicle category or service type, paginated Testimonial Card list,
"Leave a review" CTA (only enabled for customers with a completed
booking — ties to Reviews endpoints in api-contract.md).

### 2.9 FAQ

Purpose: pre-empt anxiety-driven questions (safety, self-drive vs.
chauffeur, license requirements, payment, cancellation). Sections:
grouped FAQ Accordions (Booking, Payment, On the Road, Chauffeur/Airport
Pickup, Cancellation), Contact CTA at bottom for anything unanswered.

### 2.10 Contact

Purpose: human backstop to the self-serve flow (still warm, not a dead
end). Sections: contact form (name, email, subject, message), direct
contact details (phone, WhatsApp, email, physical/office location in
Kigali), map embed, response-time expectation copy, FAQ link.

### 2.11 Legal pages (four separate pages, same simple template)

- **Terms of Service**
- **Privacy Policy**
- **Cancellation & Refund Policy** — cancellation windows, refund
  percentages by notice period, no-show policy.
- **Driver Requirements & Insurance** — minimum age, license/IDP rules,
  what insurance covers/excludes, security deposit handling.

Each: simple single-column long-form text template, last-updated date,
table of contents anchor links for longer pages. Content itself is legal
copywriting, out of scope for this spec, but the *page* and its place in
the sitemap/footer is in scope per `scope-checklist.md`.

### 2.12 Account (optional, guest-checkout-first)

- **Login / Register modal or page** — email+password, plus "look up my
  booking" alternate path (booking reference + email, no account
  required).
- **My Bookings** — list of upcoming/past bookings (status badges:
  Confirmed, Completed, Cancelled).
- **Booking Detail** — full booking info, "Cancel booking" (subject to
  Cancellation Policy), "Contact support about this booking," downloadable
  confirmation.
- **Profile** — name, email, phone, saved license/IDP info for faster
  future checkout.

---

## 3. Admin / back-office pages

These are still in scope per `scope-checklist.md` even though customers
never see them — someone has to run the business day to day.

### 3.1 Admin Login
Staff email + password (+ space for 2FA later, not required day one).
Separate login surface from customer accounts — different roles/permissions.

### 3.2 Admin Dashboard
Purpose: at-a-glance operational status.
Sections: today's/this-week's upcoming pickups & returns, new booking
count, pending-review-response count, quick links into Bookings and Fleet.

### 3.3 Fleet Management
- **Vehicle list** (Admin Data Table): name, category, status
  (Active/Maintenance/Retired), current price/day, thumbnail.
- **Add/Edit Vehicle form**: name, model, category, seats, transmission,
  fuel type, features, photos (multi-upload), base price/day, status.
- **Availability Calendar** per vehicle: block dates for maintenance,
  view booked date ranges.

### 3.4 Bookings Management
- **Bookings list** (Admin Data Table): reference, customer name, vehicle,
  dates, status (Pending Payment/Confirmed/In Progress/Completed/
  Cancelled), filter by status/date range/vehicle.
- **Booking Detail**: full trip + customer + payment info, status change
  controls, assign chauffeur/driver (if chauffeur service booked),
  internal notes field, resend confirmation email action.

### 3.5 Customers
List (Admin Data Table) of customers with booking counts and last booking
date; detail view shows booking history and contact info — supports the
"eager to come back to us" repeat-customer goal from the business context.

### 3.6 Pricing & Extras Management
Base price per vehicle (editable from Fleet Management), plus: seasonal
rate rules, extras pricing (chauffeur fee, airport pickup fee, additional
driver fee, child seat fee, insurance tiers), deposit-vs-full-payment
toggle referenced in Checkout Step 3.

### 3.7 Reviews Moderation
List of submitted reviews with Approve/Reject/Reply actions before they
appear on the public Reviews page and Vehicle Detail pages.

### 3.8 Destinations/Content Management
Simple list/add/edit for Destinations & Trip Guides content (title, hero
photo, body, linked vehicle category) — intentionally simple, not a full
CMS (see note in 2.6).

### 3.9 Admin Users & Roles
List/add/edit admin/staff accounts, role assignment (e.g., Super Admin vs.
Booking Staff — Booking Staff cannot edit pricing or add other admin
users).

### 3.10 Business Settings
Contact details shown in the Footer/Contact page, notification email
templates (confirmation, reminder, cancellation), payment provider
configuration, default currency.

---

## 4. Explicit mapping to scope-checklist "applies" items

- Catalog/inventory -> Fleet page, Vehicle Detail, Admin Fleet Management.
- Payments/checkout -> Checkout Step 3, Admin Pricing & Extras Management,
  Admin Business Settings (payment provider config).
- Accounts/auth -> Account pages (customer, optional) + Admin Login/Admin
  Users & Roles (staff, mandatory).
- Admin/back-office -> Section 3 in full.
- Search/discovery -> Hero Search Widget, Fleet page filters/sort.
- Notifications -> Booking Confirmation page + email trigger (Checkout
  Step 4), Admin "new booking" dashboard signal, Admin Business Settings
  notification templates — full mechanics in `api-contract.md`.
- Legal/compliance -> Section 2.11 (four legal pages) + policy content
  surfaced inline on Vehicle Detail and Checkout Step 3.

No "applies" category from `scope-checklist.md` is left without a page or
section above.
