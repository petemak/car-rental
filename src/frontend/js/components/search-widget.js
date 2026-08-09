/**
 * Hero Search Widget / condensed Fleet search bar — design-spec.md Shared
 * Components "Hero Search Widget". Populates location + category selects
 * from GET /locations and GET /vehicle-categories, restores the last
 * search from localStorage, and on submit stores the query then
 * navigates to fleet.html (or re-runs in place when already on Fleet).
 */
(function () {
  function readLastSearch() {
    try {
      return JSON.parse(window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.lastSearch) || "{}");
    } catch (e) {
      return {};
    }
  }

  function writeLastSearch(values) {
    window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.lastSearch, JSON.stringify(values));
  }

  async function populateSelects(form) {
    const locSelect = form.querySelector('[name="pickup_location_id"]');
    const dropoffSelect = form.querySelector('[name="dropoff_location_id"]');
    const catSelect = form.querySelector('[name="category"]');

    try {
      const { data: locations } = await window.API.Catalog.locations();
      [locSelect, dropoffSelect].forEach((sel) => {
        if (!sel) return;
        locations.forEach((loc) => {
          const opt = document.createElement("option");
          opt.value = loc.id;
          opt.textContent = loc.name;
          sel.appendChild(opt);
        });
      });
    } catch (e) {
      console.error("Failed to load locations", e);
    }

    try {
      const { data: categories } = await window.API.Catalog.categories();
      if (catSelect) {
        categories.forEach((cat) => {
          const opt = document.createElement("option");
          opt.value = cat.id;
          opt.textContent = cat.name;
          catSelect.appendChild(opt);
        });
      }
    } catch (e) {
      console.error("Failed to load categories", e);
    }
  }

  function restoreValues(form) {
    const saved = readLastSearch();
    Object.entries(saved).forEach(([key, value]) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (!field) return;
      if (field.type === "radio") {
        const radio = form.querySelector(`[name="${key}"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else {
        field.value = value;
      }
    });
  }

  window.initSearchWidget = async function initSearchWidget(form, { onSubmitNavigate = true } = {}) {
    if (!form) return;
    await populateSelects(form);
    restoreValues(form);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      writeLastSearch(values);
      if (onSubmitNavigate) {
        const qs = new URLSearchParams(values).toString();
        window.location.href = `fleet.html?${qs}`;
      } else if (typeof form.dataset.onSubmit === "string" && window[form.dataset.onSubmit]) {
        window[form.dataset.onSubmit](values);
      }
    });
  };
})();
