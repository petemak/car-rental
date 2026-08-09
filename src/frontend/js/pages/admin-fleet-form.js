/**
 * Admin Add/Edit Vehicle + Photos + Availability — design-spec.md
 * Section 3.3. Backs: GET/POST/PATCH /admin/vehicles(/{id}),
 * POST/DELETE /admin/vehicles/{id}/photos(/{photo_id}),
 * GET /admin/vehicles/{id}/availability,
 * POST/DELETE /admin/vehicles/{id}/block-dates(/{block_id})
 * (api-contract.md Section 11).
 */
(function () {
  const vehicleId = new URLSearchParams(window.location.search).get("id");

  document.addEventListener("DOMContentLoaded", async () => {
    await populateCategories();
    if (vehicleId) {
      document.getElementById("form-heading").textContent = "Edit vehicle";
      document.getElementById("page-title").textContent = "Edit Vehicle | Rwanda Roadways Admin";
      document.getElementById("photos-panel").hidden = false;
      document.getElementById("availability").hidden = false;
      await loadVehicle();
      await loadPhotos();
      await loadAvailability();
    }

    document.getElementById("vehicle-form").addEventListener("submit", saveVehicle);
    document.getElementById("photo-upload").addEventListener("change", uploadPhoto);
    document.getElementById("block-dates-form").addEventListener("submit", blockDates);
  });

  async function populateCategories() {
    try {
      const { data } = await window.API.Catalog.categories();
      const sel = document.getElementById("v-category");
      sel.innerHTML = data.map((c) => `<option value="${c.id}">${c.name}</option>`).join("");
    } catch (err) {
      console.error(err);
    }
  }

  async function loadVehicle() {
    try {
      const v = await window.API.AdminFleet.get(vehicleId);
      const form = document.getElementById("vehicle-form");
      const specs = v.specs || {};
      const policies = v.policies || {};
      form.querySelector("#v-name").value = v.name;
      form.querySelector("#v-category").value = v.category.id;
      form.querySelector("#v-seats").value = v.seats;
      form.querySelector("#v-transmission").value = v.transmission;
      form.querySelector("#v-fuel").value = v.fuel_type;
      form.querySelector("#v-price").value = v.price_per_day;
      form.querySelector("#v-status").value = v.status || "active";
      form.querySelector("#v-thumbnail").value = v.thumbnail_url || "";
      form.querySelector("#v-features").value = (v.features || []).join(", ");
      form.querySelector("#v-chauffeur").checked = v.chauffeur_available;
      form.querySelector("#v-airport").checked = v.airport_pickup_available;

      form.querySelector("#v-doors").value = specs.doors ?? "";
      form.querySelector("#v-luggage").value = specs.luggage_capacity_l ?? "";
      form.querySelector("#v-ac").checked = !!specs.air_conditioning;
      form.querySelector("#v-offroad").checked = !!specs.off_road_capable;

      form.querySelector("#v-mileage").value = policies.mileage_limit_km_per_day ?? "";
      if (policies.fuel_policy) form.querySelector("#v-fuel-policy").value = policies.fuel_policy;
      form.querySelector("#v-min-age").value = policies.min_driver_age ?? "";
      form.querySelector("#v-deposit").value = policies.security_deposit_amount ?? "";
      form.querySelector("#v-license-req").value = policies.license_requirement || "";
      form.querySelector("#v-cancellation").value = policies.cancellation_policy_summary || "";
    } catch (err) {
      document.getElementById("form-result").textContent = err.message || "Couldn't load vehicle.";
    }
  }

  /**
   * Builds the specs{}/policies{} maps api-contract.md Section 1 documents
   * on vehicle-detail (doors, luggage_capacity_l, air_conditioning,
   * off_road_capable / mileage_limit_km_per_day, fuel_policy,
   * min_driver_age, license_requirement, security_deposit_amount,
   * currency, cancellation_policy_summary) from this form's flat
   * "specs_" / "policies_" prefixed fields. Numeric fields are omitted
   * (not sent as "") when left blank, rather than saving empty strings.
   */
  function buildSpecsAndPolicies(values, currency) {
    const num = (v) => (v === "" || v === undefined ? undefined : Number(v));
    const specs = {
      doors: num(values.specs_doors),
      luggage_capacity_l: num(values.specs_luggage_capacity_l),
      air_conditioning: !!document.getElementById("v-ac").checked,
      off_road_capable: !!document.getElementById("v-offroad").checked,
    };
    const policies = {
      mileage_limit_km_per_day: num(values.policies_mileage_limit_km_per_day),
      fuel_policy: values.policies_fuel_policy || undefined,
      min_driver_age: num(values.policies_min_driver_age),
      license_requirement: values.policies_license_requirement || undefined,
      security_deposit_amount: values.policies_security_deposit_amount || undefined,
      currency,
      cancellation_policy_summary: values.policies_cancellation_policy_summary || undefined,
    };
    Object.keys(specs).forEach((k) => specs[k] === undefined && delete specs[k]);
    Object.keys(policies).forEach((k) => policies[k] === undefined && delete policies[k]);
    return { specs, policies };
  }

  async function saveVehicle(e) {
    e.preventDefault();
    const resultEl = document.getElementById("form-result");
    resultEl.textContent = "Saving…";
    const values = Object.fromEntries(new FormData(e.target).entries());
    const currency = "USD";
    const { specs, policies } = buildSpecsAndPolicies(values, currency);
    const payload = {
      name: values.name,
      category_id: values.category_id,
      seats: Number(values.seats),
      transmission: values.transmission,
      fuel_type: values.fuel_type,
      price_per_day: values.price_per_day,
      currency,
      status: values.status,
      thumbnail_url: values.thumbnail_url || undefined,
      features: values.features ? values.features.split(",").map((s) => s.trim()).filter(Boolean) : [],
      specs,
      policies,
      chauffeur_available: !!document.getElementById("v-chauffeur").checked,
      airport_pickup_available: !!document.getElementById("v-airport").checked,
    };
    try {
      if (vehicleId) {
        await window.API.AdminFleet.update(vehicleId, payload);
        resultEl.textContent = "Saved.";
      } else {
        const created = await window.API.AdminFleet.create(payload);
        window.showToast("Vehicle created.", "success");
        window.location.href = `fleet-form.html?id=${encodeURIComponent(created.id)}`;
      }
    } catch (err) {
      resultEl.textContent = err.message || "Couldn't save vehicle.";
    }
  }

  async function loadPhotos() {
    try {
      const v = await window.API.AdminFleet.get(vehicleId);
      renderPhotos(v.photos || []);
    } catch (err) {
      console.error(err);
    }
  }

  function renderPhotos(photos) {
    document.getElementById("photo-thumbs").innerHTML = photos
      .map((p, i) => `<button type="button" data-url="${p}"><img src="${p}" alt="Vehicle photo ${i + 1}" /></button>`)
      .join("");
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await window.API.AdminFleet.uploadPhoto(vehicleId, file);
      window.showToast("Photo uploaded.", "success");
      const thumbs = document.getElementById("photo-thumbs");
      thumbs.insertAdjacentHTML("beforeend", `<button type="button" data-url="${res.url}"><img src="${res.url}" alt="Newly uploaded vehicle photo" /></button>`);
    } catch (err) {
      window.showToast(err.message || "Couldn't upload photo.", "error");
    } finally {
      e.target.value = "";
    }
  }

  async function loadAvailability() {
    try {
      const { blocked_ranges, booked_ranges } = await window.API.AdminFleet.availability(vehicleId);
      document.getElementById("booked-ranges").innerHTML = booked_ranges.length
        ? booked_ranges.map((r) => `<li><span>${window.fmt.date(r.start_date)} → ${window.fmt.date(r.end_date)}</span><span class="badge badge--confirmed">Booking ${r.booking_id}</span></li>`).join("")
        : "<li>No active bookings.</li>";
      document.getElementById("blocked-ranges").innerHTML = blocked_ranges.length
        ? blocked_ranges
            .map(
              (r) => `<li><span>${window.fmt.date(r.start_date)} → ${window.fmt.date(r.end_date)} — ${r.reason}</span><button type="button" class="btn btn-outline btn-sm" data-unblock="${r.id}">Remove</button></li>`
            )
            .join("")
        : "<li>No blocked dates.</li>";
      document.querySelectorAll("[data-unblock]").forEach((btn) => btn.addEventListener("click", () => unblockDates(btn.dataset.unblock)));
    } catch (err) {
      console.error(err);
    }
  }

  async function blockDates(e) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.target).entries());
    try {
      await window.API.AdminFleet.blockDates(vehicleId, values);
      window.showToast("Dates blocked.", "success");
      e.target.reset();
      loadAvailability();
    } catch (err) {
      window.showToast(err.message || "Couldn't block those dates.", "error");
    }
  }

  async function unblockDates(blockId) {
    try {
      await window.API.AdminFleet.unblockDates(vehicleId, blockId);
      window.showToast("Block removed.", "success");
      loadAvailability();
    } catch (err) {
      window.showToast(err.message || "Couldn't remove block.", "error");
    }
  }
})();
