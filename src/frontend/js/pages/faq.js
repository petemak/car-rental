/**
 * FAQ page — design-spec.md Section 2.9.
 * NOTE: unlike every other dynamic page in design-spec.md, the FAQ page's
 * section has no "Dynamic content" line, and api-contract.md defines no
 * FAQ endpoint (GET /faq or similar). We've treated FAQ content as static
 * site copy grouped by category, matching the spec's implicit treatment —
 * see final report for this flagged as an assumption, not an invention of
 * an endpoint.
 */
(function () {
  const FAQS = [
    { group: "Booking", q: "How far in advance should I book?", a: "We recommend booking at least 2-3 weeks before arrival, especially during peak gorilla trekking season (June-September, December-February), though we can often accommodate shorter notice." },
    { group: "Booking", q: "Do I need an account to book?", a: "No — guest checkout is the default. You can optionally save your details for next time during checkout, or look up an existing booking with just your reference and email." },
    { group: "Payment", q: "Do I need to pay the full amount upfront?", a: "It depends on our current payment settings — many bookings use a deposit now, balance on arrival model. The exact split is always shown in your price breakdown before you pay." },
    { group: "Payment", q: "What payment methods do you accept?", a: "We accept major credit and debit cards online. Additional methods may be added — you'll see all current options at checkout." },
    { group: "Payment", q: "Is the security deposit refundable?", a: "Yes. The security deposit is held (not charged) and released after the vehicle is returned in its original condition, per the policy shown on each vehicle's page." },
    { group: "On the Road", q: "Can I self-drive, or do I need a chauffeur?", a: "Both are available on most vehicles. Self-drive requires a valid license or International Driving Permit held for the minimum period shown on the vehicle. First-time visitors unfamiliar with Rwandan roads often prefer chauffeur service, especially for mountain routes." },
    { group: "On the Road", q: "What is the mileage policy?", a: "Each vehicle lists a daily mileage allowance on its detail page (typically 180-250 km/day). Additional mileage can be arranged for an extra fee." },
    { group: "Chauffeur & Airport Pickup", q: "How does airport pickup work?", a: "Provide your flight number at checkout and your driver will track your flight and meet you at Kigali International Airport arrivals." },
    { group: "Chauffeur & Airport Pickup", q: "Can I add a chauffeur after booking self-drive?", a: "Yes — contact support and we'll requote your booking with a chauffeur added, subject to driver availability." },
    { group: "Cancellation", q: "What is your cancellation policy?", a: "Full details are on our <a href=\"legal/cancellation-policy.html\">Cancellation &amp; Refund Policy</a> page — in general, full refunds are available up to 72 hours before pickup, with prorated refunds closer to the date." },
  ];

  document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById("faq-groups");
    const groups = [...new Set(FAQS.map((f) => f.group))];
    container.innerHTML = groups
      .map(
        (g, gi) => `
      <div style="margin-bottom:var(--space-7);">
        <h2>${g}</h2>
        <div class="accordion" id="faq-group-${gi}"></div>
      </div>`
      )
      .join("");

    groups.forEach((g, gi) => {
      const items = FAQS.filter((f) => f.group === g);
      window.renderAccordion(document.getElementById(`faq-group-${gi}`), items, `faq-${gi}`);
    });
  });
})();
