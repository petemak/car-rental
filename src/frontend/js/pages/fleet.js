/**
 * Fleet (search / browse) page — design-spec.md Section 2.2.
 * Backs: GET /vehicles with pickup_date/return_date/pickup_location_id/
 * category/service_type/transmission/min_seats/price_min/price_max/sort/
 * page/per_page (api-contract.md Section 1).
 */
(function () {
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", async () => {
    const searchForm = document.getElementById("fleet-search-form");
    const filterForm = document.getElementById("filter-form");
    const sortSelect = document.getElementById("sort-select");

    await window.initSearchWidget(searchForm, { onSubmitNavigate: false });
    searchForm.dataset.onSubmit = "";
    // Override submit behavior: re-run search in place instead of navigating.
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      currentPage = 1;
      runSearch();
    });

    await populateCategoryFilters();
    applyQueryParamsToForms();

    filterForm.addEventListener("submit", (e) => {
      e.preventDefault();
      currentPage = 1;
      runSearch();
    });

    document.getElementById("reset-filters").addEventListener("click", () => {
      filterForm.reset();
      currentPage = 1;
      runSearch();
    });

    sortSelect.addEventListener("change", () => {
      currentPage = 1;
      runSearch();
    });

    const mobileToggle = document.getElementById("mobile-filter-toggle");
    const filterPanel = document.getElementById("filter-panel");
    mobileToggle.addEventListener("click", () => {
      filterPanel.classList.toggle("is-open");
      mobileToggle.textContent = filterPanel.classList.contains("is-open") ? "Close filters" : "Filters";
    });

    runSearch();
  });

  async function populateCategoryFilters() {
    const list = document.getElementById("filter-categories");
    try {
      const { data } = await window.API.Catalog.categories();
      list.innerHTML =
        `<li><label><input type="radio" name="category" value="" checked /> All categories</label></li>` +
        data.map((c) => `<li><label><input type="radio" name="category" value="${c.id}" /> ${c.name}</label></li>`).join("");
    } catch (err) {
      list.innerHTML = "<li>Categories unavailable.</li>";
    }
  }

  function applyQueryParamsToForms() {
    const params = new URLSearchParams(window.location.search);
    params.forEach((value, key) => {
      document.querySelectorAll(`[name="${key}"]`).forEach((field) => {
        if (field.type === "radio" || field.type === "checkbox") {
          if (field.value === value || (field.type === "checkbox" && value === "true")) field.checked = true;
        } else {
          field.value = value;
        }
      });
    });
  }

  function collectParams() {
    const searchForm = document.getElementById("fleet-search-form");
    const filterForm = document.getElementById("filter-form");
    const searchValues = Object.fromEntries(new FormData(searchForm).entries());
    const filterValues = Object.fromEntries(new FormData(filterForm).entries());
    return {
      ...searchValues,
      ...filterValues,
      sort: document.getElementById("sort-select").value,
      page: currentPage,
      per_page: 9,
    };
  }

  async function runSearch() {
    const resultsEl = document.getElementById("vehicle-results");
    const countEl = document.getElementById("results-count");
    resultsEl.innerHTML = Array.from({ length: 6 }).map(() => window.renderVehicleCardSkeleton()).join("");
    countEl.textContent = "Loading vehicles…";

    const params = collectParams();
    try {
      const { data, meta } = await window.API.Catalog.vehicles(params);
      countEl.textContent = `${meta.total_count} vehicle${meta.total_count === 1 ? "" : "s"} found`;
      if (!data.length) {
        resultsEl.innerHTML = `
          <div class="empty-state" style="grid-column:1/-1;">
            <h3>No vehicles match</h3>
            <p>Try adjusting your dates or removing a filter — nothing here is a dead end.</p>
            <button type="button" class="btn btn-outline" id="empty-reset">Reset filters</button>
          </div>`;
        const btn = document.getElementById("empty-reset");
        if (btn) btn.addEventListener("click", () => document.getElementById("reset-filters").click());
      } else {
        const qsPart = params.pickup_date ? `&pickup_date=${params.pickup_date}&return_date=${params.return_date}` : "";
        resultsEl.innerHTML = data.map((v) => window.renderVehicleCard(v, { searchQS: qsPart })).join("");
      }
      renderPagination(meta);
    } catch (err) {
      countEl.textContent = "";
      resultsEl.innerHTML = `<p class="empty-state" style="grid-column:1/-1;">Couldn't load vehicles right now (${err.message || "network error"}). Please try again.</p>`;
      console.error(err);
    }
  }

  function renderPagination(meta) {
    const el = document.getElementById("pagination");
    if (meta.total_pages <= 1) {
      el.innerHTML = "";
      return;
    }
    let html = `<li><button type="button" data-page="${meta.page - 1}" ${meta.page === 1 ? "disabled" : ""}>Prev</button></li>`;
    for (let i = 1; i <= meta.total_pages; i++) {
      html += `<li><button type="button" data-page="${i}" ${i === meta.page ? 'aria-current="page"' : ""}>${i}</button></li>`;
    }
    html += `<li><button type="button" data-page="${meta.page + 1}" ${meta.page === meta.total_pages ? "disabled" : ""}>Next</button></li>`;
    el.innerHTML = html;
    el.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        runSearch();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }
})();
