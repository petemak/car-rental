/**
 * Admin Fleet Management (list) — design-spec.md Section 3.3.
 * Backs: GET /admin/vehicles, DELETE /admin/vehicles/{id}
 * (api-contract.md Section 11).
 */
(function () {
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", async () => {
    await populateCategories();
    document.getElementById("filter-status").addEventListener("change", () => {
      currentPage = 1;
      loadFleet();
    });
    document.getElementById("filter-category").addEventListener("change", () => {
      currentPage = 1;
      loadFleet();
    });
    loadFleet();
  });

  async function populateCategories() {
    try {
      const { data } = await window.API.Catalog.categories();
      const sel = document.getElementById("filter-category");
      data.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function loadFleet() {
    const tbody = document.getElementById("fleet-table-body");
    tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
    try {
      const { data, meta } = await window.API.AdminFleet.list({
        status: document.getElementById("filter-status").value || undefined,
        category: document.getElementById("filter-category").value || undefined,
        page: currentPage,
        per_page: 10,
      });
      tbody.innerHTML = data.length
        ? data
            .map(
              (v) => `
        <tr>
          <td><img src="${v.thumbnail_url}" alt="" width="56" height="42" style="object-fit:cover;border-radius:4px;" /></td>
          <td>${v.name}</td>
          <td>${v.category.name}</td>
          <td><span class="badge badge--${v.status}">${window.fmt.title(v.status)}</span></td>
          <td>${window.fmt.money(v.price_per_day, v.currency)}</td>
          <td class="actions">
            <a class="btn btn-outline btn-sm" href="fleet-form.html?id=${encodeURIComponent(v.id)}">Edit</a>
            <a class="btn btn-outline btn-sm" href="fleet-form.html?id=${encodeURIComponent(v.id)}#availability">Availability</a>
            <button type="button" class="btn btn-danger btn-sm" data-retire="${v.id}">Retire</button>
          </td>
        </tr>`
            )
            .join("")
        : `<tr><td colspan="6">No vehicles match these filters.</td></tr>`;

      tbody.querySelectorAll("[data-retire]").forEach((btn) => {
        btn.addEventListener("click", () => retireVehicle(btn.dataset.retire));
      });
      renderPagination(meta);
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6">Couldn't load fleet: ${err.message || "error"}</td></tr>`;
    }
  }

  async function retireVehicle(id) {
    if (!window.confirm("Retire this vehicle? It will be hidden from customers but booking history is preserved.")) return;
    try {
      await window.API.AdminFleet.remove(id);
      window.showToast("Vehicle retired.", "success");
      loadFleet();
    } catch (err) {
      window.showToast(err.message || "Couldn't retire vehicle.", "error");
    }
  }

  function renderPagination(meta) {
    const el = document.getElementById("fleet-pagination");
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
        loadFleet();
      })
    );
  }
})();
