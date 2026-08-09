/**
 * Admin Pricing & Extras Management — design-spec.md Section 3.6.
 * Backs: GET/PATCH /admin/pricing/settings,
 * GET/POST/DELETE /admin/pricing/seasonal-rates(/{id})
 * (api-contract.md Section 13). Client-side role gate mirrors the
 * server's documented super_admin-only rule (defense in depth only —
 * the backend is the real enforcement point).
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const role = window.localStorage.getItem("rr_admin_role");
    if (role !== "super_admin") {
      document.getElementById("pricing-forbidden").hidden = false;
      return;
    }
    document.getElementById("pricing-content").hidden = false;
    await loadSettings();
    await loadSeasonalRates();
    document.getElementById("pricing-form").addEventListener("submit", saveSettings);
    document.getElementById("seasonal-form").addEventListener("submit", addSeasonalRate);
  });

  async function loadSettings() {
    try {
      const s = await window.API.AdminPricing.settings();
      document.getElementById("payment-model").value = s.payment_model;
      document.getElementById("deposit-percentage").value = s.deposit_percentage;
      document.getElementById("chauffeur-fee").value = s.extras.chauffeur_fee_per_day;
      document.getElementById("airport-fee").value = s.extras.airport_pickup_fee;
      document.getElementById("additional-driver-fee").value = s.extras.additional_driver_fee;
      document.getElementById("child-seat-fee").value = s.extras.child_seat_fee;
    } catch (err) {
      document.getElementById("pricing-result").textContent = err.message || "Couldn't load pricing settings.";
    }
  }

  async function saveSettings(e) {
    e.preventDefault();
    const resultEl = document.getElementById("pricing-result");
    resultEl.textContent = "Saving…";
    const values = Object.fromEntries(new FormData(e.target).entries());
    const payload = {
      payment_model: values.payment_model,
      deposit_percentage: Number(values.deposit_percentage),
      extras: {
        chauffeur_fee_per_day: values.chauffeur_fee_per_day,
        airport_pickup_fee: values.airport_pickup_fee,
        additional_driver_fee: values.additional_driver_fee,
        child_seat_fee: values.child_seat_fee,
      },
    };
    try {
      await window.API.AdminPricing.updateSettings(payload);
      resultEl.textContent = "Saved.";
      window.showToast("Pricing settings updated.", "success");
    } catch (err) {
      resultEl.textContent = err.message || "Couldn't save pricing settings.";
    }
  }

  async function loadSeasonalRates() {
    const tbody = document.getElementById("seasonal-rates-body");
    try {
      const { data } = await window.API.AdminPricing.seasonalRates();
      tbody.innerHTML = data.length
        ? data
            .map(
              (r) => `<tr>
              <td>${r.vehicle_id || r.category_id}</td>
              <td>${window.fmt.date(r.start_date)}</td>
              <td>${window.fmt.date(r.end_date)}</td>
              <td>${window.fmt.money(r.price_per_day, r.currency || "USD")}</td>
              <td><button type="button" class="btn btn-danger btn-sm" data-remove="${r.id}">Remove</button></td>
            </tr>`
            )
            .join("")
        : `<tr><td colspan="5">No seasonal rates configured.</td></tr>`;
      tbody.querySelectorAll("[data-remove]").forEach((btn) => btn.addEventListener("click", () => removeSeasonalRate(btn.dataset.remove)));
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="5">Couldn't load seasonal rates.</td></tr>`;
    }
  }

  async function addSeasonalRate(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target).entries());
    try {
      await window.API.AdminPricing.createSeasonalRate({ ...values, currency: "USD" });
      window.showToast("Seasonal rate added.", "success");
      e.target.reset();
      loadSeasonalRates();
    } catch (err) {
      window.showToast(err.message || "Couldn't add seasonal rate.", "error");
    }
  }

  async function removeSeasonalRate(id) {
    try {
      await window.API.AdminPricing.deleteSeasonalRate(id);
      window.showToast("Seasonal rate removed.", "success");
      loadSeasonalRates();
    } catch (err) {
      window.showToast(err.message || "Couldn't remove seasonal rate.", "error");
    }
  }
})();
