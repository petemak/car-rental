/**
 * Booking Detail (manage/cancel) — design-spec.md Section 2.12.
 * Backs: GET /bookings/{id} (auth) or GET /bookings/lookup (guest), POST
 * /bookings/{id}/cancel (api-contract.md Section 3).
 *
 * GET /bookings/{id} requires a customer token
 * (car_rental.backend.handlers.bookings/owns-booking-by-token?) and 403s
 * for anonymous guests, so a reference+email in the URL (arriving from
 * account/login.html's guest "look up my booking" tab) must use the
 * guest lookup endpoint instead, even though we already also have the
 * booking's id at that point.
 */
(function () {
  let currentBooking = null;
  let lookupCreds = null; // { reference, email } for guest cancel auth

  document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const reference = params.get("reference");
    const email = params.get("email");

    window.initReviewSubmission();

    document.getElementById("detail-lookup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const ref = document.getElementById("ref-input").value.trim();
      const em = document.getElementById("email-input").value.trim();
      lookupViaReference(ref, em);
    });

    if (reference && email) {
      lookupCreds = { reference, email };
      loadBooking(() => window.API.Bookings.lookup(reference, email));
    } else if (id) {
      loadBooking(() => window.API.Bookings.get(id));
    }

    document.getElementById("confirm-cancel-btn").addEventListener("click", cancelBooking);
  });

  async function lookupViaReference(reference, email) {
    lookupCreds = { reference, email };
    await loadBooking(() => window.API.Bookings.lookup(reference, email));
  }

  async function loadBooking(fetcher) {
    const wrap = document.getElementById("booking-detail-content");
    document.getElementById("lookup-form-wrap").hidden = true;
    wrap.hidden = false;
    wrap.innerHTML = `<p role="status">Loading booking…</p>`;
    try {
      const booking = await fetcher();
      currentBooking = booking;
      render(booking);
    } catch (err) {
      wrap.innerHTML = `<p class="alert alert--error">${err.message || "Booking not found."}</p>
        <button type="button" class="btn btn-outline" id="try-again-btn">Try another lookup</button>`;
      document.getElementById("try-again-btn").addEventListener("click", () => {
        document.getElementById("lookup-form-wrap").hidden = false;
        wrap.hidden = true;
      });
    }
  }

  function render(b) {
    const wrap = document.getElementById("booking-detail-content");
    const canCancel = !["cancelled", "completed"].includes(b.status);
    wrap.innerHTML = `
      <div class="admin-header">
        <div>
          <h1>Booking ${b.reference}</h1>
          <p><span class="badge badge--${b.status}">${window.fmt.title(b.status)}</span> · Payment: <span class="badge badge--${b.payment_status}">${window.fmt.title(b.payment_status)}</span></p>
        </div>
        <div style="display:flex;gap:var(--space-2);">
          <button type="button" class="btn btn-outline btn-sm" id="print-btn">Download / print confirmation</button>
          ${window.renderLeaveReviewButton(b.id, b.status)}
          ${canCancel ? `<button type="button" class="btn btn-danger btn-sm" id="open-cancel-btn">Cancel booking</button>` : ""}
        </div>
      </div>
      <div class="two-col">
        <div>
          <h2>Trip</h2>
          <dl class="definition-list">
            <dt>Vehicle</dt><dd>${b.vehicle.name}</dd>
            <dt>Pickup</dt><dd>${window.fmt.date(b.pickup_date)} at ${b.pickup_time} — ${b.pickup_location.name}</dd>
            <dt>Return</dt><dd>${window.fmt.date(b.return_date)} at ${b.return_time} — ${b.dropoff_location.name}</dd>
            <dt>Service</dt><dd>${window.fmt.title(b.service_type)}</dd>
            <dt>Airport pickup</dt><dd>${b.airport_pickup ? `Yes (flight ${b.flight_number || "—"})` : "No"}</dd>
            <dt>Chauffeur assigned</dt><dd>${
              // chauffeur_assigned is { id: "drv_..." } per api-contract.md
              // Section 3 BookingDetail — the contract has no endpoint that
              // resolves a driver id to a customer-facing name, so we show
              // a plain confirmation rather than an internal id string.
              b.chauffeur_assigned && b.chauffeur_assigned.id
                ? "Confirmed — your driver's details will be shared before pickup"
                : "Not yet assigned"
            }</dd>
          </dl>
          <h2>Customer</h2>
          <dl class="definition-list">
            <dt>Name</dt><dd>${b.customer.first_name} ${b.customer.last_name}</dd>
            <dt>Email</dt><dd>${b.customer.email}</dd>
            <dt>Phone</dt><dd>${b.customer.phone}</dd>
          </dl>
        </div>
        <div>
          <div class="price-panel">
            <h2>Price</h2>
            <div class="price-panel__row"><span>Subtotal</span><span>${window.fmt.money(b.price_breakdown.subtotal, b.price_breakdown.currency)}</span></div>
            <div class="price-panel__row price-panel__row--total"><span>Total</span><span>${window.fmt.money(b.price_breakdown.total, b.price_breakdown.currency)}</span></div>
          </div>
          <p style="margin-top:var(--space-4);"><a href="../contact.html">Contact support about this booking →</a></p>
        </div>
      </div>
    `;
    document.getElementById("print-btn").addEventListener("click", () => window.print());
    if (canCancel) {
      document.getElementById("open-cancel-btn").addEventListener("click", () => window.openModal(document.getElementById("cancel-modal")));
    }
    window.wireModalDismissers();
  }

  async function cancelBooking() {
    const btn = document.getElementById("confirm-cancel-btn");
    btn.disabled = true;
    try {
      const reason = document.getElementById("cancel-reason").value;
      const payload = lookupCreds ? { ...lookupCreds, reason } : { reason };
      const res = await window.API.Bookings.cancel(currentBooking.id, payload);
      window.closeModal(document.getElementById("cancel-modal"));
      window.showToast(`Booking cancelled. Refund: ${window.fmt.money(res.refund_amount, res.currency)} (${res.refund_status}).`, "success", 8000);
      currentBooking.status = "cancelled";
      render(currentBooking);
    } catch (err) {
      window.showToast(err.message || "Couldn't cancel this booking.", "error");
    } finally {
      btn.disabled = false;
    }
  }
})();
