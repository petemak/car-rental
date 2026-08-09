/**
 * My Bookings — design-spec.md Section 2.12.
 * Backs: GET /account/bookings (auth required) (api-contract.md
 * Section 3). Each row is a BookingSummary: nested `vehicle
 * {id,name,thumbnail_url}` but flat `total`/`currency` (not a nested
 * price_breakdown) — confirmed against
 * car_rental.backend.domain.presenters/booking-summary-customer.
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const hasToken = !!window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken);
    if (!hasToken) {
      document.getElementById("auth-required").hidden = false;
    }
    window.initReviewSubmission();
    await loadBookings();
  });

  async function loadBookings() {
    const el = document.getElementById("bookings-list");
    el.innerHTML = `<div class="skeleton" style="height:6rem;margin-bottom:1rem;"></div>`;
    try {
      const { data } = await window.API.Bookings.myBookings();
      el.innerHTML = data.length
        ? `<div class="data-table-wrap"><table class="data-table"><thead><tr>
            <th scope="col">Reference</th><th scope="col">Vehicle</th><th scope="col">Pickup</th><th scope="col">Return</th><th scope="col">Status</th><th scope="col">Total</th><th scope="col"></th>
          </tr></thead><tbody>${data
            .map(
              (b) => `<tr>
              <td>${b.reference}</td>
              <td>${b.vehicle.name}</td>
              <td>${window.fmt.date(b.pickup_date)}</td>
              <td>${window.fmt.date(b.return_date)}</td>
              <td><span class="badge badge--${b.status}">${window.fmt.title(b.status)}</span></td>
              <td>${b.total ? window.fmt.money(b.total, b.currency) : "—"}</td>
              <td class="actions">
                <a class="btn btn-outline btn-sm" href="booking-detail.html?id=${encodeURIComponent(b.id)}">View</a>
                ${window.renderLeaveReviewButton(b.id, b.status)}
              </td>
            </tr>`
            )
            .join("")}</tbody></table></div>`
        : `<div class="empty-state"><p>No bookings yet.</p><a class="btn btn-primary" href="../fleet.html">Browse the fleet</a></div>`;
    } catch (err) {
      el.innerHTML = `<p class="alert alert--error">${err.message || "Couldn't load your bookings."}</p>`;
    }
  }
})();
