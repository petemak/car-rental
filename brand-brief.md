# Brand Brief — Kigali Car Rental Business

Source of truth: `business-context.md` (read in full, no discrepancies with the
task prompt — the file and the prompt matched).

---

## 1. Positioning

**Category:** Tourist-focused self-drive and chauffeured car rental in Rwanda,
based in Kigali, with an emphasis on airport pickup and end-to-end transport
for visitors exploring the country.

**Positioning statement:** For international tourists visiting Rwanda who
want to explore the country independently and safely, [Brand] is the car
rental service that pairs a well-maintained, versatile fleet — from compact
city cars to Land Cruisers — with hospitality-grade service, so that
transport is one less thing to worry about on a trip that matters. Unlike
generic local rental operators, [Brand] is building toward "affordable
premier": prices accessible to the everyday traveler, but a standard of
quality and polish usually reserved for luxury operators.

**Core value proposition:**
- One fleet, every kind of Rwanda trip — city errands to Land Cruiser
  off-road adventures.
- Airport pickup and optional chauffeur service remove the friction of
  arriving in an unfamiliar country.
- "Affordable premier" — pricing tourists can justify, service quality that
  makes them want to return and refer others.

---

## 2. Name and Tagline

No existing brand name was supplied (`business-context.md` confirms
"None, starting fresh"). Naming was not explicitly requested by the current
task, so treat the name below as a **placeholder suggestion** for the UX
designer to use in layouts — final naming/legal/trademark decisions are out
of scope for this brief.

**Suggested placeholder name:** Rwanda Roadways *(alternates worth testing:
"Amahoro Drive," "Kigali Wheels," "Terra Rwanda Car Hire" — "Amahoro" means
peace in Kinyarwanda and has warm local resonance for a tourism brand)*

**Tagline direction:** "Your trip, from the tarmac to the trailhead."
*(alternate: "Rwanda, at your own pace.")*

The UX designer should treat the name as a placeholder token (e.g. `{{BRAND_NAME}}`)
in layouts until the business owner confirms a final name.

---

## 3. Target Audience

International, mostly first-time, leisure tourists visiting Rwanda —
skewing toward travelers from North America, Western Europe, and other
long-haul markets who are booking gorilla trekking, national park safaris,
or general cultural/nature tourism, plus a secondary segment of business
travelers and NGO/conference visitors who need reliable airport-to-hotel
transport. These customers are booking from abroad, weeks or months ahead
of arrival, largely on desktop or mobile web, often in the same session
where they're comparing flights and lodges — they are unfamiliar with local
roads, unsure whether self-drive or a chauffeur is right for them, and
anxious about safety, vehicle condition, and being overcharged as a
foreigner. They are not bargain-hunters in the extreme-budget sense; they
will pay a reasonable premium for visible signs of trust (real photos,
clear pricing, responsive support, verified reviews) over the cheapest
unknown option. Business context explicitly says: "we want customers who
genuinely want to visit and explore the country" — so the audience is
travel-motivated, not just utility renters.

---

## 4. Brand Personality / Voice

**Adjectives:** Trustworthy, warm, capable, unpretentious-premium.

- **Trustworthy** — Do: state prices, fleet condition, and policies plainly,
  with real photos and specific details (mileage limits, fuel policy,
  insurance). Don't: use vague marketing superlatives ("best in Africa!")
  without evidence behind them.
- **Warm** — Do: write copy that sounds like a knowledgeable local host
  welcoming a guest ("We'll have your Land Cruiser waiting when you land").
  Don't: sound like a transactional car-hire counter or a legal disclaimer.
- **Capable** — Do: lead with concrete proof of competence — well-maintained
  fleet, airport pickup logistics, chauffeur option for tricky routes.
  Don't: bury the practical reassurance tourists need under generic
  lifestyle imagery.
- **Unpretentious-premium** — Do: let quality show through details (clean
  cars, punctuality, tidy website, responsive support) rather than luxury
  clichés. Don't: use gold/black "luxury" visual tropes that clash with the
  "affordable" half of the positioning, and don't undercut it with
  discount-bin bargain messaging either.

---

## 5. Color Palette

**Revision (2026-08-10):** A staging reviewer flagged the palette below as
reading "green/sandbrown ... old" on the live site, and asked for a more
modern, blue-based look. This is a fair call: the *stated intent* in the
prior version of this section ("close in spirit to kayak.com/cheapflights.com's
blue palette") never actually landed in the chosen hex values — `#0E5C63`
reads as dark teal/green rather than blue, and combined with a rust-orange
secondary (`#C1592A`) and a tan/khaki neutral system (`#F4EDE2` background,
`#DDD2BF`/`#B9AC95` borders), the overall effect was a muted earth-tone
scheme, not a travel-booking blue. This section replaces that palette with
one built around an actual blue primary, a warm accent chosen specifically
to avoid the earlier "dated rust" read, and cool neutrals instead of
warm sand/khaki. **This revision has not yet been applied to
`src/frontend/css/tokens.css`, `components.css`, or `design-spec.md` — it is
pending reviewer approval before those downstream files are updated.**

Direction: a confident, contemporary blue as the dominant trust color
(the convention international travelers already associate with booking
sites — kayak.com, cheapflights.com, and most current 2026-era travel/OTA
products lean on blue for exactly this reason), paired with a golden-amber
accent for CTAs that reads premium and energetic rather than earthy/rustic,
on a cool, crisp neutral background instead of warm sand. Contrast ratios
below are computed against WCAG 2.1 AA thresholds (4.5:1 for normal text,
3:1 for large text/UI components) for the specific pairings each token is
used in.

| Role | Token (`tokens.css`) | Hex | Rationale |
|---|---|---|---|
| Primary — Confident Blue | `--color-primary` | `#1D4ED8` | A genuine blue, not a teal that reads green — directly answers the "more modern, blue tones" feedback. Reads as contemporary travel-tech/booking trust (Kayak/Skyscanner/Booking.com-adjacent territory) without copying any one competitor. White text on this blue is ~6.7:1 contrast — well past AA — so it's safe for nav, primary buttons, and the hero. |
| Primary Hover/Active — Deep Navy | `--color-primary-600` | `#1E3A8A` | Darker step of the same blue family (not a shift toward teal or black) for hover/active states and as the darker stop in the hero's background gradient — keeps depth and richness in photography overlays without drifting back toward green. |
| Primary Tint | `--color-primary-100` | `#DBEAFE` | Soft sky-blue tint for subtle backgrounds, outline-button hover states, and info banners — replaces the old teal-tinted `#E3EDEE`. |
| Secondary / CTA — Golden Amber | `--color-secondary` | `#F5A524` | Warm counterpoint to the blue so CTAs still pop (a blue-on-blue button is a known conversion weak point), but chosen to read as vivid, premium gold-amber rather than the earlier muddy rust/terracotta that drove the "dated" impression. Fits the "affordable premier" positioning better than a literal red-earth reference did. **Important implementation note:** this amber does not pass AA contrast with *white* text (~2:1) the way the old `#0E5C63`-family secondary usage assumed — it needs dark text (pairs at ~7.2:1 with the new `--color-charcoal` below). `.btn-primary` currently sets `color: #fff` on `var(--color-secondary)` in `components.css`; that text color will need to change to dark when this token is applied — flagging for whoever implements this, not fixing it here. |
| Secondary Hover/Active | `--color-secondary-600` | `#D97706` | Deeper amber for hover/active CTA states; still reads warm/gold, not brown. |
| Secondary Tint | `--color-secondary-100` | `#FEF3C7` | Pale gold for badges, highlights, "premier" accents (e.g. featured-vehicle tags). |
| Neutral Background | `--color-sand` (rename to `--color-bg-neutral` recommended at CSS-token time) | `#F7F9FC` | A crisp, cool off-white with a faint blue-grey cast — reads clean and modern, the way current travel/booking product backgrounds do, instead of the warm tan/khaki (`#F4EDE2`) that contributed to the "sandbrown" read. Still soft enough not to feel clinical, and photography of green hills/vehicles sits cleanly on it. |
| Surface (cards/panels) | `--color-surface` | `#FFFFFF` | Unchanged — pure white still works fine once it's paired with cool neutrals instead of warm ones. |
| Body Text — Cool Charcoal | `--color-charcoal` | `#1E293B` | Shifted from the old warm charcoal (`#26302E`) to a cool, blue-leaning charcoal that belongs to the same family as the new primary blue. ~13.8:1 contrast on the new `#F7F9FC` background — comfortably exceeds AA/AAA. |
| Muted Text | `--color-text-muted` | `#64748B` | Cool slate grey for secondary copy, timestamps, helper text — replaces the old warm-grey `#5A655F`. |
| Border | `--color-border` | `#E2E8F0` | Light cool grey-blue, replacing the khaki-toned `#DDD2BF` the reviewer's "sandbrown" read was partly picking up on. |
| Border Strong | `--color-border-strong` | `#CBD5E1` | Replaces `#B9AC95` (which read distinctly khaki/olive); this cool grey-blue reads as a neutral structural line, not an earth tone. |
| Success | `--color-success` / `--color-success-bg` | `#15803D` / `#DCFCE7` | Standard accessible green, kept independent of the primary/secondary hues so status meaning stays unambiguous; not part of the "dated" complaint, carried forward with a very slightly cooler shade to sit comfortably next to the new blue system. |
| Error | `--color-error` / `--color-error-bg` | `#DC2626` / `#FEE2E2` | Standard accessible red (~4.8:1 with white); unchanged in spirit from before. |
| Warning | `--color-warning` / `--color-warning-bg` | `#B45309` / `#FFFBEB` | Same amber family as the new secondary/CTA (visual consistency) but a darker, text-safe shade distinct from `--color-secondary-600` so "this is a warning" and "this is a call-to-action" don't visually collide. |
| Info | `--color-info` / `--color-info-bg` | `#1D4ED8` / `#DBEAFE` | Mirrors primary, same convention as the previous palette (info = primary color). |

**Hero overlay note** (for whoever updates `components.css` ~line 92–97):
the current hero background is `linear-gradient(180deg, rgba(14,34,34,.55),
rgba(14,34,34,.75)), linear-gradient(120deg, #0e5c63, #123f43)` — a
dark-teal-tinted overlay over the old primary. The equivalent under this new
palette would swap the overlay tint toward the new navy (e.g. `rgba(15, 23,
42, .55–.75)`, i.e. the RGB of `--color-primary-600`'s family) over
`linear-gradient(120deg, #1D4ED8, #1E3A8A)`, so the photo-heavy hero reads as
blue-toned rather than teal/near-black-green. Not applied here — flagged for
the CSS-token/implementation station.

---

## 6. Typography Direction

- **Headings:** A humanist sans-serif with a bit of warmth and confidence —
  e.g. **Fraunces or Poppins paired with...** Recommendation: pair a
  friendly-but-sturdy sans for headings (**Poppins** or **Sora**, both
  geometric-humanist, read as modern/approachable travel-tech) with a
  workhorse body font.
- **Body:** **Inter** (or system-ui equivalent) for body copy, forms, and
  data-dense areas like the booking flow, fleet listings, and pricing
  tables — highly legible at small sizes, neutral enough not to compete
  with photography, and well-supported across languages for an
  international audience.
- Pairing summary: **Poppins/Sora (headings) + Inter (body).** Avoid
  script or heavily decorative display fonts — this audience is scanning
  for trust signals and clear information, not a boutique-lifestyle vibe.

---

## 7. Key Messaging / Value Props (for UX to structure into page sections)

1. **Fleet range** — "From city-friendly Aygos to off-road-ready Land
   Cruisers" — one provider covers the whole trip, whatever the terrain.
2. **End-to-end service** — airport pickup, optional chauffeur, and
   self-drive all under one roof, positioned as removing logistics anxiety
   for first-time visitors to Rwanda.
3. **Quality and condition** — explicit reassurance about vehicle
   maintenance and presentation ("well maintained" is a phrase directly
   from the business owner — treat it as a literal trust claim to surface,
   not just a vibe).
4. **Affordable premier** — the balancing act between accessible pricing
   and elevated service; UX/copy should avoid pure discount framing and
   pure luxury framing.
5. **Local expertise / genuine travel enablement** — for tourists who
   "genuinely want to visit and explore the country," not just get from A
   to B — room for route suggestions, park-adjacent pickup, itinerary help.

---

## 8. Competitive Differentiation

**Reference sites explicitly liked by the business (from business-context.md):**
- **kayak.com** — meta-search UX (compare, filter, price transparency),
  strong search-first homepage pattern. Borrow: fast, filterable search UX;
  clear price-forward listing cards; trust through comparison. Avoid: kayak
  is a marketplace/aggregator with a colder, data-dense feel — this brand is
  a single local operator and needs to feel more personal/hosted, not like
  a search engine.
- **cheapflights.com** — similar booking-flow conventions and blue-based
  trust palette, deal-forward messaging. Borrow: simple, guided booking
  funnel; familiar travel-site visual grammar so international users don't
  have to relearn how to book. Avoid: "cheap"-forward branding and
  aggressive discount messaging — conflicts with the "premier" half of this
  brand's positioning; this business should feel like a trusted single
  provider, not a bargain aggregator.

**Local/regional competitors found via search (not mentioned in
business-context.md, added for competitive context):**
- **Self Drive Rwanda** (selfdriverwanda.com) — established, award-branded
  self-drive specialist. Borrow: credibility signals (awards, "since 2011"
  tenure messaging). Avoid: fairly plain/dated visual execution — an
  opportunity to look more premium and more current.
- **Kigali Car Rentals** (kigalicarrentals.com) — long-tenured local
  operator (16+ years), phone-first contact pattern. Borrow: emphasis on
  trust/tenure. Avoid: website relies heavily on phone/WhatsApp contact
  rather than a self-serve booking flow — this brand's "real business
  expecting real traffic" scale should invest in an actual booking UX kayak
  users would recognize, not a brochure-plus-phone-call model.
- **Rwanda Car Rental Services** (rwandacarrentalservices.com) — targets
  varied traveler types (solo, couples, backpackers, families). Borrow:
  explicitly segmenting by traveler type in messaging. Avoid: generic
  "affordable" framing without the premium/quality counterweight this brand
  wants to own.
- **Europcar Kigali** (europcar.com/en-us/places/car-rental-rwanda/kigali) —
  international franchise, polished but generic global template with no
  local warmth. Borrow: polish, standardized booking flow, multi-vehicle-
  class presentation. Avoid: feels corporate/placeless — this brand's edge
  is being a genuine, warm, locally-rooted alternative to a faceless
  multinational.
- **4x4 Africa self-drive sites** (e.g. 4x4selfdriveafrica.com,
  africaselfdrives.com) as category reference: these lean into trip-planning
  tools, route/road-condition transparency, and traveler testimonials.
  Borrow: road-condition transparency and itinerary-adjacent content build
  trust for first-time African road travelers. Avoid: heavy adventure-gear/
  camping aesthetic — too rugged/niche for this brand's "affordable premier,
  general tourist" positioning, which needs to also serve non-4x4-enthusiast
  travelers (e.g., renting a small city car).

---

## 9. Assumptions Made

`business-context.md` was present and complete, so most fields came directly
from it (marked as such above). The following were **not specified** and are
assumed — flag these for confirmation before final design/dev commitment:

- **No brand name or tagline exists yet.** Assumed a placeholder name
  ("Rwanda Roadways") for UX layout purposes only; real naming/trademark
  work is a separate task, not covered here.
- **Price point:** Assumed a genuine mid-range ("affordable premier") price
  point — not the cheapest local option, not luxury-chauffeur pricing —
  since the business context explicitly uses that phrase but gives no
  numbers.
- **Primary booking behavior:** Assumed most bookings originate from
  desktop/mobile web research done before international travel (not
  walk-up/local same-day rentals), based on "tourists from all over the
  world" and the kayak/cheapflights references.
- **Language:** Assumed English as the primary site language given the
  international tourist audience and the English-language reference sites,
  with Kinyarwanda/French as a possible secondary consideration for the UX
  designer to flag, not assumed as in-scope here.
- **Fleet size/exact vehicle list:** Only two reference vehicles were given
  (Toyota Aygo, Toyota Land Cruiser) as range endpoints — assumed there are
  additional mid-tier vehicles (e.g., sedans, mid-size SUVs) filling the
  range, to be confirmed with the business owner before the UX designer
  finalizes fleet-listing page structure.
- **Chauffeur/airport pickup pricing model:** Assumed these are add-on
  services priced separately from base rental (industry-standard pattern),
  not confirmed in the source material.

---

## Handoff Notes for UX Designer

This brief covers brand strategy only — no layout, page structure, code, or
final copy has been produced. Suggested next steps for the UX designer:
- Use the color palette and type pairing above as design tokens.
- Structure the booking flow with kayak.com/cheapflights.com-style
  search-and-filter UX as the primary reference, adapted for a single-
  operator (not aggregator) context.
- Plan page sections around the key messaging pillars in Section 7 (fleet
  range, end-to-end service, quality/condition, affordable premier, local
  expertise).
- Treat the brand name as a placeholder token pending business owner
  confirmation.
- **Section 5 (Color Palette) was revised on 2026-08-10** in response to
  staging reviewer feedback ("more modern look based on blue tones"). The
  new palette is documented above but has **not** been applied to
  `tokens.css`, `components.css`, or `design-spec.md` yet — it is pending
  explicit reviewer approval before that implementation work happens.
</content>
