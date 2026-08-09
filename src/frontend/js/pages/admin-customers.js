/**
 * Admin Customers (list) — design-spec.md Section 3.5.
 * Backs: GET /admin/customers (api-contract.md Section 13).
 */
(function () {
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("search-btn").addEventListener("click", () => {
      currentPage = 1;
      loadCustomers();
    });
    document.getElementById("customer-search").addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        currentPage = 1;
        loadCustomers();
      }
    });
    loadCustomers();
  });

  async function loadCustomers() {
    const tbody = document.getElementById("customers-table-body");
    tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
    try {
      const { data, meta } = await window.API.AdminCustomers.list({
        search: document.getElementById("customer-search").value || undefined,
        page: currentPage,
        per_page: 10,
      });
      tbody.innerHTML = data.length
        ? data
            .map(
              (c) => `
        <tr>
          <td>${c.first_name} ${c.last_name}</td>
          <td>${c.email}</td>
          <td>${c.phone}</td>
          <td>${c.bookings_count}</td>
          <td>${window.fmt.date(c.last_booking_date)}</td>
          <td class="actions"><a class="btn btn-outline btn-sm" href="customer-detail.html?id=${encodeURIComponent(c.id)}">View</a></td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="6">No customers match this search.</td></tr>`;
      renderPagination(meta);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6">Couldn't load customers: ${err.message || "error"}</td></tr>`;
    }
  }

  function renderPagination(meta) {
    const el = document.getElementById("customers-pagination");
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
        loadCustomers();
      })
    );
  }
})();
