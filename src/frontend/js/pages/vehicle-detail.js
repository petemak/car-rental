/**
 * Vehicle Detail page — design-spec.md Section 2.3.
 * Backs: GET /vehicles/{id}, POST /pricing/quote, GET /reviews, GET
 * /vehicles (similar vehicles) — api-contract.md Sections 1, 2, 6.
 */
(function () {
  const params = new URLSearchParams(window.location.search);
  const vehicleId = params.get("id");
  let currentVehicle = null;
  let quoteDebounce = null;

  document.addEventListener("DOMContentLoaded", async () => {
    if (!vehicleId) {
      showError("No vehicle specified.");
      return;
    }
    document.getElementById("wd-pickup-date").value = params.get("pickup_date") || "";
    document.getElementById("wd-return-date").value = params.get("return_date") || "";

    try {
      const v = await window.API.Catalog.vehicle(vehicleId, {
        pickup_date: params.get("pickup_date") || undefined,
        return_date: params.get("return_date") || undefined,
      });
      currentVehicle = v;
      renderVehicle(v);
      loadReviews(v);
      loadSimilar(v);
      renderFaq(v);
      wireBookingWidget();
      if (v.price_breakdown) renderPriceBreakdown(v.price_breakdown);
    } catch (err) {
      showError(err.message || "This vehicle could not be found.");
      console.error(err);
    }
  });

  function showError(message) {
    document.getElementById("vehicle-loading").hidden = true;
    document.getElementById("vehicle-error").hidden = false;
    document.getElementById("vehicle-error-message").textContent = message;
  }

  function renderVehicle(v) {
    document.getElementById("vehicle-loading").hidden = true;
    document.getElementById("vehicle-content").hidden = false;
    document.getElementById("page-title").textContent = `${v.name} | Rwanda Roadways`;
    document.getElementById("breadcrumb-current").textContent = v.name;
    document.getElementById("vehicle-category-badge").textContent = v.category.name;
    document.getElementById("vehicle-name").textContent = v.name;
    document.getElementById("widget-price").innerHTML = `${window.fmt.money(v.price_per_day, v.currency)} <small style="font-family:var(--font-body);font-weight:400;font-size:var(--fs-sm);">/ day</small>`;

    // specs/policies/features/photos/thumbnail_url are all documented as
    // optional-on-write in the admin vehicle form (api-contract.md Section
    // 11 VehicleWriteSchema — specs/policies are freeform, optional maps),
    // so a vehicle created through admin/fleet-form.html without filling
    // every optional field can legitimately arrive here with specs:null,
    // policies:null, features:[]/null, photos:[], thumbnail_url:null.
    // Defense in depth: render "Not specified" rather than throwing.
    const specs = v.specs || {};
    const policies = v.policies || {};
    const features = v.features || [];

    const photos = v.photos && v.photos.length ? v.photos : v.thumbnail_url ? [v.thumbnail_url] : [];
    const mainImg = document.getElementById("gallery-main-image");
    if (photos.length) {
      mainImg.src = photos[0];
      mainImg.alt = `${v.name} — photo 1 of ${photos.length}`;
      document.getElementById("gallery-thumbs").innerHTML = photos
        .map((p, i) => `<button type="button" class="${i === 0 ? "is-active" : ""}" data-src="${p}" data-index="${i}"><img src="${p}" alt="${v.name} thumbnail ${i + 1}" /></button>`)
        .join("");
      wireGallery(photos);
      document.getElementById("gallery-main-btn").disabled = false;
    } else {
      mainImg.alt = "No photos available for this vehicle yet";
      document.getElementById("gallery-main-btn").disabled = true;
    }

    document.getElementById("specs-list").innerHTML = `
      <dt>Seats</dt><dd>${v.seats ?? "Not specified"}</dd>
      <dt>Doors</dt><dd>${specs.doors ?? "Not specified"}</dd>
      <dt>Transmission</dt><dd>${window.fmt.transmission(v.transmission)}</dd>
      <dt>Fuel type</dt><dd>${window.fmt.fuel(v.fuel_type)}</dd>
      <dt>Luggage capacity</dt><dd>${specs.luggage_capacity_l !== undefined ? specs.luggage_capacity_l + " L" : "Not specified"}</dd>
      <dt>Air conditioning</dt><dd>${specs.air_conditioning ? "Yes" : specs.air_conditioning === false ? "No" : "Not specified"}</dd>
      <dt>4x4 / off-road capable</dt><dd>${specs.off_road_capable ? "Yes" : specs.off_road_capable === false ? "No" : "Not specified"}</dd>
    `;

    document.getElementById("features-list").innerHTML = features.length
      ? features.map((f) => `<li>✓ ${f}</li>`).join("")
      : `<li>No feature list provided for this vehicle yet.</li>`;

    document.getElementById("policies-list").innerHTML = `
      <dt>Mileage limit</dt><dd>${policies.mileage_limit_km_per_day !== undefined ? policies.mileage_limit_km_per_day + " km / day" : "Contact us for details"}</dd>
      <dt>Fuel policy</dt><dd>${policies.fuel_policy ? window.fmt.title(policies.fuel_policy) : "Contact us for details"}</dd>
      <dt>Minimum driver age</dt><dd>${policies.min_driver_age ?? "Contact us for details"}</dd>
      <dt>License requirement</dt><dd>${policies.license_requirement || "Contact us for details"}</dd>
      <dt>Security deposit</dt><dd>${policies.security_deposit_amount ? window.fmt.money(policies.security_deposit_amount, policies.currency || v.currency) : "Contact us for details"}</dd>
      <dt>Cancellation</dt><dd>${policies.cancellation_policy_summary || "See our Cancellation & Refund Policy."}</dd>
    `;

    if (!v.chauffeur_available) {
      document.getElementById("wd-svc-chauffeur").disabled = true;
    }
    if (!v.airport_pickup_available) {
      document.getElementById("wd-airport-pickup").disabled = true;
    }
  }

  function wireGallery(photos) {
    const openBtn = document.getElementById("gallery-main-btn");
    const modal = document.getElementById("lightbox-modal");
    const lbImage = document.getElementById("lightbox-image");
    const lbThumbs = document.getElementById("lightbox-thumbs");
    window.wireModalDismissers();

    function setActive(index) {
      lbImage.src = photos[index];
      lbImage.alt = `Photo ${index + 1} of ${photos.length}`;
      lbThumbs.querySelectorAll("button").forEach((b, i) => b.classList.toggle("is-active", i === index));
      document.getElementById("gallery-main-image").src = photos[index];
    }

    lbThumbs.innerHTML = photos.map((p, i) => `<button type="button" data-index="${i}"><img src="${p}" alt="Photo ${i + 1}" /></button>`).join("");
    lbThumbs.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => setActive(Number(b.dataset.index))));
    document.getElementById("gallery-thumbs").querySelectorAll("button").forEach((b) =>
      b.addEventListener("click", () => {
        setActive(Number(b.dataset.index));
      })
    );

    openBtn.addEventListener("click", () => {
      setActive(0);
      window.openModal(modal);
    });
  }

  async function loadReviews(v) {
    const el = document.getElementById("vehicle-reviews");
    try {
      const { data } = await window.API.Reviews.list({ vehicle_id: v.id, per_page: 3 });
      el.innerHTML = data.length ? data.map((r) => window.renderReviewCard(r)).join("") : `<p class="empty-state">No reviews yet for this vehicle.</p>`;
    } catch (err) {
      el.innerHTML = `<p class="empty-state">Couldn't load reviews.</p>`;
    }
  }

  async function loadSimilar(v) {
    const el = document.getElementById("similar-vehicles");
    try {
      const { data } = await window.API.Catalog.vehicles({ category: v.category.id, per_page: 4 });
      const filtered = data.filter((x) => x.id !== v.id).slice(0, 3);
      el.innerHTML = filtered.length ? filtered.map((x) => window.renderVehicleCard(x)).join("") : `<p class="empty-state">No similar vehicles right now — see the <a href="fleet.html">full fleet</a>.</p>`;
    } catch (err) {
      el.innerHTML = `<p class="empty-state">Couldn't load similar vehicles.</p>`;
    }
  }

  function renderFaq(v) {
    const el = document.getElementById("vehicle-faq");
    const policies = v.policies || {};
    window.renderAccordion(
      el,
      [
        {
          q: "What do I need to bring for pickup?",
          a: `A valid driver's license or IDP${policies.license_requirement ? ` (${policies.license_requirement})` : ""}, the credit/debit card used for booking, and your booking reference.`,
        },
        {
          q: "Is insurance included?",
          a: policies.security_deposit_amount
            ? `A security deposit of ${window.fmt.money(policies.security_deposit_amount, policies.currency || v.currency)} is held for the rental; full coverage details are on our Driver Requirements &amp; Insurance page.`
            : "See our Driver Requirements &amp; Insurance page for full coverage details, or contact us for this vehicle's specific deposit amount.",
        },
        { q: "Can I change my dates after booking?", a: "Yes, contact support and we'll requote your booking subject to availability and our Cancellation & Refund Policy." },
      ],
      "vfaq"
    );
  }

  function wireBookingWidget() {
    const form = document.getElementById("booking-widget");
    const debouncedQuote = () => {
      clearTimeout(quoteDebounce);
      quoteDebounce = setTimeout(fetchQuote, 350);
    };
    ["wd-pickup-date", "wd-return-date"].forEach((id) => document.getElementById(id).addEventListener("change", debouncedQuote));
    form.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach((el) => el.addEventListener("change", debouncedQuote));

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const qs = new URLSearchParams({
        vehicle_id: currentVehicle.id,
        pickup_date: values.pickup_date || "",
        return_date: values.return_date || "",
        service_type: values.service_type || "self_drive",
        airport_pickup: values.airport_pickup ? "true" : "false",
        additional_driver: values.additional_driver ? "true" : "false",
        child_seat: values.child_seat ? "true" : "false",
      });
      if (!values.pickup_date || !values.return_date) {
        window.showToast("Please choose pickup and return dates first.", "error");
        return;
      }
      window.location.href = `booking.html?${qs.toString()}`;
    });
  }

  async function fetchQuote() {
    const form = document.getElementById("booking-widget");
    const values = Object.fromEntries(new FormData(form).entries());
    const breakdownEl = document.getElementById("price-breakdown");
    if (!values.pickup_date || !values.return_date) return;

    breakdownEl.innerHTML = `<div class="skeleton" style="height:6rem;"></div>`;
    try {
      const quote = await window.API.Pricing.quote({
        vehicle_id: currentVehicle.id,
        pickup_date: values.pickup_date,
        return_date: values.return_date,
        service_type: values.service_type || "self_drive",
        airport_pickup: !!values.airport_pickup,
        additional_driver: !!values.additional_driver,
        child_seat: !!values.child_seat,
      });
      renderPriceBreakdown(quote);
    } catch (err) {
      breakdownEl.innerHTML = `<p class="alert alert--error">${err.message || "This vehicle is not available for the selected dates."}</p>`;
    }
  }

  function renderPriceBreakdown(q) {
    const el = document.getElementById("price-breakdown");
    el.innerHTML = `
      <div class="price-panel__row"><span>Subtotal</span><span>${window.fmt.money(q.subtotal, q.currency)}</span></div>
      ${Number(q.chauffeur_fee) ? `<div class="price-panel__row"><span>Chauffeur fee</span><span>${window.fmt.money(q.chauffeur_fee, q.currency)}</span></div>` : ""}
      ${Number(q.airport_pickup_fee) ? `<div class="price-panel__row"><span>Airport pickup</span><span>${window.fmt.money(q.airport_pickup_fee, q.currency)}</span></div>` : ""}
      ${q.additional_driver_fee && Number(q.additional_driver_fee) ? `<div class="price-panel__row"><span>Additional driver</span><span>${window.fmt.money(q.additional_driver_fee, q.currency)}</span></div>` : ""}
      ${q.child_seat_fee && Number(q.child_seat_fee) ? `<div class="price-panel__row"><span>Child seat</span><span>${window.fmt.money(q.child_seat_fee, q.currency)}</span></div>` : ""}
      <div class="price-panel__row"><span>Taxes &amp; fees</span><span>${window.fmt.money(q.taxes_fees, q.currency)}</span></div>
      <div class="price-panel__row price-panel__row--total"><span>Total</span><span>${window.fmt.money(q.total, q.currency)}</span></div>
      ${q.payment_model === "deposit" ? `<p class="price-panel__note">Deposit due now: <strong>${window.fmt.money(q.deposit_due, q.currency)}</strong> · Balance on arrival: ${window.fmt.money(q.balance_due, q.currency)}</p>` : ""}
    `;
  }
})();
