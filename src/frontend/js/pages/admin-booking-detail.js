/**
 * Admin Booking Detail — design-spec.md Section 3.4.
 * Backs: GET /admin/bookings/{id}, PATCH /admin/bookings/{id},
 * POST /admin/bookings/{id}/resend-confirmation (api-contract.md
 * Section 12).
 */
(function () {
  const id = new URLSearchParams(window.location.search).get("id");
  let booking = null;

  document.addEventListener("DOMContentLoaded", async () => {
    if (!id) {
      document.getElementById("booking-detail-main").innerHTML = `<p class="alert alert--error">No booking id in URL.</p>`;
      return;
    }
    try {
      booking = await window.API.AdminBookings.get(id);
      render();
    } catch (err) {
      document.getElementById("booking-detail-main").innerHTML = `<p class="alert alert--error">${err.message || "Couldn't load booking."}</p>`;
    }
  });

  function render() {
    const main = document.getElementById("booking-detail-main");
    main.innerHTML = `
      <div class="admin-header">
        <div>
          <h1>Booking ${booking.reference}</h1>
          <p><span class="badge badge--${booking.status}">${window.fmt.title(booking.status)}</span> · Payment: <span class="badge badge--${booking.payment_status}">${window.fmt.title(booking.payment_status)}</span></p>
        </div>
        <button type="button" class="btn btn-outline" id="resend-btn">Resend confirmation email</button>
      </div>

      <div class="two-col">
        <div>
          <div class="admin-panel">
            <h2>Trip</h2>
            <dl class="definition-list">
              <dt>Vehicle</dt><dd>${booking.vehicle.name}</dd>
              <dt>Pickup</dt><dd>${window.fmt.date(booking.pickup_date)} ${booking.pickup_time} — ${booking.pickup_location.name}</dd>
              <dt>Return</dt><dd>${window.fmt.date(booking.return_date)} ${booking.return_time} — ${booking.dropoff_location.name}</dd>
              <dt>Service</dt><dd>${window.fmt.title(booking.service_type)}</dd>
              <dt>Airport pickup</dt><dd>${booking.airport_pickup ? `Yes (flight ${booking.flight_number || "—"})` : "No"}</dd>
            </dl>
          </div>
          <div class="admin-panel">
            <h2>Customer</h2>
            <dl class="definition-list">
              <dt>Name</dt><dd>${booking.customer.first_name} ${booking.customer.last_name}</dd>
              <dt>Email</dt><dd>${booking.customer.email}</dd>
              <dt>Phone</dt><dd>${booking.customer.phone}</dd>
            </dl>
          </div>
          <div class="admin-panel">
            <h2>Payment</h2>
            <div class="price-panel__row"><span>Subtotal</span><span>${window.fmt.money(booking.price_breakdown.subtotal, booking.price_breakdown.currency)}</span></div>
            <div class="price-panel__row price-panel__row--total"><span>Total</span><span>${window.fmt.money(booking.price_breakdown.total, booking.price_breakdown.currency)}</span></div>
          </div>
        </div>

        <div>
          <div class="admin-panel">
            <h2>Status &amp; assignment</h2>
            <form id="status-form" class="form-grid">
              <div class="field">
                <label for="status-select">Status</label>
                <select id="status-select" name="status">
                  <option value="pending_payment">Pending Payment</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div class="field">
                <label for="chauffeur-select">Assign chauffeur/driver</label>
                <select id="chauffeur-select" name="chauffeur_id" ${booking.service_type !== "chauffeur" ? "disabled" : ""}>
                  <option value="">Unassigned</option>
                  <option value="drv_1">Eric Habimana</option>
                  <option value="drv_2">Jean Bosco</option>
                  <option value="drv_3">Alice Uwase</option>
                </select>
              </div>
              <div class="field">
                <label for="notes-field">Internal notes</label>
                <textarea id="notes-field" name="internal_notes">${booking.internal_notes || ""}</textarea>
              </div>
              <button type="submit" class="btn btn-primary">Save changes</button>
              <p id="status-result" role="status"></p>
            </form>
          </div>
        </div>
      </div>
    `;
    document.getElementById("status-select").value = booking.status;
    // chauffeur_assigned is { id: "drv_..." } | null per api-contract.md
    // Section 3 BookingDetail, not a bare string — select by .id.
    if (booking.chauffeur_assigned && booking.chauffeur_assigned.id) {
      document.getElementById("chauffeur-select").value = booking.chauffeur_assigned.id;
    }

    document.getElementById("status-form").addEventListener("submit", saveStatus);
    document.getElementById("resend-btn").addEventListener("click", resend);
  }

  async function saveStatus(e) {
    e.preventDefault();
    const resultEl = document.getElementById("status-result");
    resultEl.textContent = "Saving…";
    try {
      const values = Object.fromEntries(new FormData(e.target).entries());
      await window.API.AdminBookings.update(id, values);
      resultEl.textContent = "Saved.";
      window.showToast("Booking updated.", "success");
    } catch (err) {
      resultEl.textContent = err.message || "Couldn't save changes.";
    }
  }

  async function resend() {
    try {
      await window.API.AdminBookings.resendConfirmation(id);
      window.showToast("Confirmation email resent.", "success");
    } catch (err) {
      window.showToast(err.message || "Couldn't resend email.", "error");
    }
  }
})();
