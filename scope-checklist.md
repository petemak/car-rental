# Scope Checklist — {{BRAND_NAME}} Car Rental Website

Reasoning is worked out here *before* any design so the design-spec doesn't
silently omit a category. Placeholder brand name `{{BRAND_NAME}}` is used
throughout per the brand brief (final naming pending).

- **Catalog / inventory — APPLIES.**
  The business rents a physical fleet (Toyota Aygo up through Land Cruiser,
  plus assumed mid-tier vehicles). Tourists need to browse, filter, and
  compare vehicles before booking, exactly like the kayak.com/cheapflights.com
  reference sites the brief calls out. Someone (the business owner / staff)
  must be able to add vehicles, retire them, update photos, and mark them
  available/unavailable — this is a rental fleet, not static content.

- **Payments / checkout — APPLIES (one-time transaction per booking, not
  subscription).**
  This is a real business taking real bookings from tourists abroad, weeks
  or months ahead of arrival (brief, Section 3 and Section 9). A brochure
  site with "call us to book" was explicitly named as a competitor weakness
  to avoid ("Kigali Car Rentals... relies heavily on phone/WhatsApp contact
  rather than a self-serve booking flow" — brief Section 8). Each booking is
  a single, dated transaction (a rental for specific pickup/return dates),
  not a recurring subscription. Exact payment terms (full payment vs.
  deposit-at-booking/balance-on-arrival) are not specified in the brief, so
  the spec below treats this as an admin-configurable setting rather than a
  hardcoded rule.

- **Accounts / auth — APPLIES, in two different forms.**
  - *Admin/staff auth*: unambiguously applies — someone has to log in to
    manage fleet, bookings, and pricing (see Admin/back-office below).
  - *Customer auth*: applies, but as an **optional convenience layer over a
    guest-checkout-first flow**. The brief's target customer books once,
    from abroad, often in the same session as comparing flights (Section 3)
    — friction-heavy mandatory account creation before booking would work
    against that. A booking-reference + email lookup (no login required)
    should be the default path; a lightweight optional account lets
    returning customers see booking history, matching "eager to come back
    to us" (business-context.md, "What makes us different").

- **Admin / back-office — APPLIES.**
  Explicitly required and easy to overlook because customers never see it.
  Someone must: add/edit/retire vehicles and photos, set pricing and
  seasonal rates, block dates for maintenance, view and manage incoming
  bookings (confirm, cancel, assign a chauffeur/driver), moderate reviews,
  and see basic business metrics. This is treated as first-class scope
  below, not a "phase 2."

- **Search / discovery — APPLIES.**
  Directly requested via the brief's explicit borrow from kayak.com/
  cheapflights.com: "fast, filterable search UX; clear price-forward
  listing cards" (Section 8). Tourists need to search by dates, pickup
  location (notably the airport), vehicle category, and self-drive vs.
  chauffeur.

- **Notifications — APPLIES.**
  A tourist booking a car from another continent, weeks ahead, needs a
  booking confirmation email (with reference number, pickup logistics, and
  what to bring — e.g., driving license/IDP) and pre-arrival reminders.
  The admin side needs a "new booking" alert. This is core to the
  "trustworthy" and "capable" brand adjectives (Section 4) — silence after
  payment would directly undermine both.

- **Legal / compliance — APPLIES.**
  A vehicle-rental business handling online payment and cross-border
  customers needs, at minimum: Terms of Service, Privacy Policy, a
  Rental/Cancellation & Refund Policy, and clear driver-eligibility rules
  (minimum age, valid license/International Driving Permit requirements,
  security deposit and damage/insurance terms). The brief itself flags
  specific trust claims that must be backed by real policy text, not vibes
  ("state prices, fleet condition, and policies plainly... mileage limits,
  fuel policy, insurance" — Section 4, "Trustworthy").

No category was ruled out. Every "applies" item above has a corresponding
page/section in `design-spec.md` and, where it involves dynamic data, an
endpoint group in `api-contract.md`.
