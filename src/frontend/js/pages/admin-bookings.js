/**
 * Admin Bookings Management (list) — design-spec.md Section 3.4.
 * Backs: GET /admin/bookings (api-contract.md Section 12). Rows are
 * BookingSummary (admin) — confirmed against
 * car_rental.backend.domain.presenters/booking-summary-admin: flat
 * `customer_name` and `vehicle_name` strings, flat `total`/`currency`
 * (not a nested `customer`/`vehicle`/`price_breakdown` object).
 */
(function () {
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("apply-filters").addEventListener("click", () => {
      currentPage = 1;
      loadBookings();
    });
    loadBookings();
  });

  async function loadBookings() {
    const tbody = document.getElementById("bookings-table-body");
    tbody.innerHTML = `<tr><td colspan="8">Loading…</td></tr>`;
    try {
      const { data, meta } = await window.API.AdminBookings.list({
        status: document.getElementById("filter-status").value || undefined,
        date_from: document.getElementById("filter-date-from").value || undefined,
        date_to: document.getElementById("filter-date-to").value || undefined,
        page: currentPage,
        per_page: 10,
      });
      tbody.innerHTML = data.length
        ? data
            .map(
              (b) => `
        <tr>
          <td>${b.reference}</td>
          <td>${b.customer_name}</td>
          <td>${b.vehicle_name}</td>
          <td>${window.fmt.date(b.pickup_date)}</td>
          <td>${window.fmt.date(b.return_date)}</td>
          <td><span class="badge badge--${b.status}">${window.fmt.title(b.status)}</span></td>
          <td>${window.fmt.money(b.total, b.currency)}</td>
          <td class="actions"><a class="btn btn-outline btn-sm" href="booking-detail.html?id=${encodeURIComponent(b.id)}">View</a></td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="8">No bookings match these filters.</td></tr>`;
      renderPagination(meta);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="8">Couldn't load bookings: ${err.message || "error"}</td></tr>`;
    }
  }

  function renderPagination(meta) {
    const el = document.getElementById("bookings-pagination");
    if (meta.total_pages <= 1) {
      el.innerHTML = "";
      return;
    }
    let html = "";
    for (let i = 1; i <= meta.total_pages; i++) {
      html += `<li><button type="button" data-page="${i}" ${i === meta.page ? 'aria-current="page"' : ""}>${i}</button></li>`;
    }
    el.innerHTML = html;
    el.querySelectorAll("button[data-page]").forEach((btn) =>
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        loadBookings();
      })
    );
  }
})();
