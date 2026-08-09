/**
 * Admin Customer Detail — design-spec.md Section 3.5.
 * Backs: GET /admin/customers/{id} (api-contract.md Section 13). Embedded
 * `bookings` are BookingSummary (admin) rows — flat `vehicle_name`,
 * `total`, `currency` (see car_rental.backend.handlers.admin.customers/
 * get-customer, which uses booking-summary-admin).
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const id = new URLSearchParams(window.location.search).get("id");
    const main = document.getElementById("customer-detail-main");
    if (!id) {
      main.innerHTML = `<p class="alert alert--error">No customer id in URL.</p>`;
      return;
    }
    try {
      const c = await window.API.AdminCustomers.get(id);
      main.innerHTML = `
        <div class="admin-header">
          <div>
            <h1>${c.first_name} ${c.last_name}</h1>
            <p>${c.email} · ${c.phone}</p>
          </div>
        </div>
        <div class="admin-panel">
          <h2>Booking history</h2>
          <div class="data-table-wrap">
            <table class="data-table">
              <thead><tr><th scope="col">Reference</th><th scope="col">Vehicle</th><th scope="col">Pickup</th><th scope="col">Status</th><th scope="col">Total</th></tr></thead>
              <tbody>
                ${(c.bookings || [])
                  .map(
                    (b) => `<tr>
                    <td>${b.reference}</td>
                    <td>${b.vehicle_name}</td>
                    <td>${window.fmt.date(b.pickup_date)}</td>
                    <td><span class="badge badge--${b.status}">${window.fmt.title(b.status)}</span></td>
                    <td>${window.fmt.money(b.total, b.currency)}</td>
                  </tr>`
                  )
                  .join("") || `<tr><td colspan="5">No bookings yet.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      main.innerHTML = `<p class="alert alert--error">${err.message || "Couldn't load customer."}</p>`;
    }
  });
})();
