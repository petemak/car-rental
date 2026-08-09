/**
 * Booking Confirmation — design-spec.md Section 2.4 Step 4.
 * Backs: GET /bookings/{id}/payment-status, and either GET /bookings/{id}
 * (auth) or GET /bookings/lookup (guest) — api-contract.md Section 3.
 *
 * GET /bookings/{id} requires a customer token
 * (car_rental.backend.handlers.bookings/owns-booking-by-token?) and 403s
 * for anonymous guests. Guest checkout (no account created) is the
 * default flow, so we only call GET /bookings/{id} when a customer token
 * is present (logged in, or "save my details" created one during
 * checkout); otherwise we use the documented guest lookup endpoint with
 * the reference + email js/pages/booking.js put in the query string.
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const bookingId = params.get("booking_id");
    const reference = params.get("reference");
    const email = params.get("email");
    const el = document.getElementById("confirmation-content");

    if (!bookingId) {
      el.innerHTML = `<p class="alert alert--error">No booking reference found. If you completed a booking, check your email for confirmation, or look it up below.</p>
        <a class="btn btn-outline" href="account/booking-detail.html">Look up my booking</a>`;
      return;
    }

    try {
      const hasToken = !!window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken);
      const status = await window.API.Payments.status(bookingId);
      const booking = hasToken
        ? await window.API.Bookings.get(bookingId)
        : await window.API.Bookings.lookup(reference, email);
      render(booking, status, reference);
    } catch (err) {
      el.innerHTML = `<p class="alert alert--error">${err.message || "Couldn't load your booking confirmation."}</p>
        <a class="btn btn-outline" href="contact.html">Contact support</a>`;
    }
  });

  function render(booking, paymentStatus, reference) {
    const el = document.getElementById("confirmation-content");
    const isPaid = paymentStatus.payment_status === "paid" || paymentStatus.payment_status === "partially_paid";
    el.innerHTML = `
      <div class="alert ${isPaid ? "alert--success" : "alert--info"}">
        <h1 style="margin-top:0;">${isPaid ? "Booking confirmed!" : "Booking received — payment pending"}</h1>
        <p>Reference <strong>${booking.reference || reference}</strong> — check your email for a copy of this confirmation.${
          isPaid ? "" : " Your payment hasn't been confirmed yet; contact support if this persists."
        }</p>
      </div>
      <div class="two-col">
        <div>
          <h2>Trip summary</h2>
          <dl class="definition-list">
            <dt>Vehicle</dt><dd>${booking.vehicle.name}</dd>
            <dt>Pickup</dt><dd>${window.fmt.date(booking.pickup_date)} at ${booking.pickup_time} — ${booking.pickup_location.name}</dd>
            <dt>Return</dt><dd>${window.fmt.date(booking.return_date)} at ${booking.return_time} — ${booking.dropoff_location.name}</dd>
            <dt>Service</dt><dd>${window.fmt.title(booking.service_type)}</dd>
            <dt>Airport pickup</dt><dd>${booking.airport_pickup ? `Yes (flight ${booking.flight_number || "—"})` : "No"}</dd>
            <dt>Payment status</dt><dd><span class="badge badge--${paymentStatus.payment_status}">${window.fmt.title(paymentStatus.payment_status)}</span></dd>
            <dt>Amount paid</dt><dd>${window.fmt.money(paymentStatus.amount_paid, paymentStatus.currency)}</dd>
          </dl>

          <h2>What to bring</h2>
          <ul class="icon-list" style="flex-direction:column;">
            <li>✓ A valid driver's license or International Driving Permit (self-drive bookings)</li>
            <li>✓ The card used for booking, for identity verification</li>
            <li>✓ Your booking reference: <strong>${booking.reference}</strong></li>
          </ul>

          <h2>Where to meet your driver / pickup</h2>
          <p>${booking.pickup_location.name}. If you booked airport pickup, your driver will meet you at arrivals holding a Rwanda Roadways sign.</p>

          <div style="display:flex;gap:var(--space-3);margin-top:var(--space-5);">
            <a class="btn btn-primary" href="account/booking-detail.html?id=${encodeURIComponent(booking.id)}">Manage booking</a>
            <a class="btn btn-outline" href="contact.html">Contact support</a>
          </div>
        </div>
        <div>
          <div class="price-panel">
            <h2>Price paid</h2>
            <div class="price-panel__row"><span>Subtotal</span><span>${window.fmt.money(booking.price_breakdown.subtotal, booking.price_breakdown.currency)}</span></div>
            <div class="price-panel__row price-panel__row--total"><span>Total</span><span>${window.fmt.money(booking.price_breakdown.total, booking.price_breakdown.currency)}</span></div>
          </div>
        </div>
      </div>
    `;
  }
})();
