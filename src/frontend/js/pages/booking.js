/**
 * Booking / Checkout — design-spec.md Section 2.4. Single URL, JS-managed
 * steps (the spec explicitly leaves this implementation choice to
 * frontend). Backs: POST /pricing/quote, POST /bookings,
 * POST /payments/intent, POST /payments/{id}/simulate-success (dev-only),
 * GET /bookings/{id}/payment-status (api-contract.md Sections 2, 3, 4).
 *
 * AMBIGUITY (see final report): api-contract.md's payment flow assumes a
 * Stripe-style client_secret confirmed client-side via Stripe.js, which
 * needs a publishable key. The contract only exposes
 * payment_provider.public_key via GET /admin/settings (staff-auth only) —
 * there is no documented public/customer-facing endpoint for it. This
 * checkout therefore calls POST /payments/intent exactly as documented,
 * but cannot wire up a real Stripe Elements confirmation step against an
 * undocumented key, so card fields below are a visual/demo stand-in.
 *
 * DEV/DEMO SHORTCUT: after POST /payments/intent succeeds, we immediately
 * call the backend's dev-only POST /payments/{payment_id}/simulate-success
 * (see js/api.js Payments.simulateSuccess, and
 * car_rental.backend.handlers.payments/simulate-success on the backend) so
 * the booking actually reaches `confirmed` without a real payment
 * provider. This is NOT part of api-contract.md and would not exist
 * against a real payment integration — it's gated server-side by a config
 * flag and clearly named to avoid being mistaken for real payment
 * processing. If the backend has that flag disabled, simulate-success
 * 404s and we still proceed to the confirmation page, which will
 * correctly show the booking as pending_payment rather than confirmed.
 */
(function () {
  const qsParams = new URLSearchParams(window.location.search);
  const state = {
    vehicle_id: qsParams.get("vehicle_id"),
    pickup_date: qsParams.get("pickup_date") || "",
    return_date: qsParams.get("return_date") || "",
    service_type: qsParams.get("service_type") || "self_drive",
    airport_pickup: qsParams.get("airport_pickup") === "true",
    additional_driver: qsParams.get("additional_driver") === "true",
    child_seat: qsParams.get("child_seat") === "true",
    pickup_time: "10:00",
    return_time: "10:00",
    pickup_location_id: "",
    dropoff_location_id: "",
    flight_number: "",
  };
  let lastQuote = null;
  let quoteDebounce = null;
  const idempotencyKey = getOrCreateIdempotencyKey();

  document.addEventListener("DOMContentLoaded", async () => {
    if (!state.vehicle_id) {
      document.getElementById("booking-missing-vehicle").hidden = false;
      document.getElementById("booking-layout").hidden = true;
      return;
    }

    await populateLocations();
    prefillTripForm();
    wireTripDetailsForm();
    wireYourDetailsForm();
    wirePaymentForm();
    wireBackButtons();
    requoteAndRender();
  });

  function getOrCreateIdempotencyKey() {
    const existing = window.sessionStorage.getItem("rr_booking_idempotency_key");
    if (existing) return existing;
    const key = `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem("rr_booking_idempotency_key", key);
    return key;
  }

  async function populateLocations() {
    try {
      const { data } = await window.API.Catalog.locations();
      const opts = data.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
      document.getElementById("pickup-location-id").innerHTML = `<option value="">Select location</option>${opts}`;
      document.getElementById("dropoff-location-id").innerHTML = `<option value="">Select location</option>${opts}`;
    } catch (err) {
      console.error(err);
    }
  }

  function prefillTripForm() {
    document.getElementById("pickup-date").value = state.pickup_date;
    document.getElementById("return-date").value = state.return_date;
    if (state.service_type === "chauffeur") document.getElementById("svc-chauffeur").checked = true;
    document.getElementById("airport-pickup").checked = state.airport_pickup;
    document.getElementById("additional-driver").checked = state.additional_driver;
    document.getElementById("child-seat").checked = state.child_seat;
    toggleFlightNumberField();
  }

  function toggleFlightNumberField() {
    const checked = document.getElementById("airport-pickup").checked;
    document.getElementById("flight-number-field").hidden = !checked;
  }

  function wireTripDetailsForm() {
    const form = document.getElementById("trip-details-form");
    document.getElementById("airport-pickup").addEventListener("change", () => {
      toggleFlightNumberField();
      requoteAndRender();
    });
    form.querySelectorAll("input, select").forEach((el) => {
      el.addEventListener("change", () => {
        clearTimeout(quoteDebounce);
        quoteDebounce = setTimeout(requoteAndRender, 300);
      });
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      Object.assign(state, Object.fromEntries(new FormData(form).entries()));
      state.airport_pickup = form.querySelector("#airport-pickup").checked;
      state.additional_driver = form.querySelector("#additional-driver").checked;
      state.child_seat = form.querySelector("#child-seat").checked;
      if (!lastQuote) {
        window.showToast("Please wait for the price to finish loading.", "info");
        return;
      }
      goToStep(2);
    });
  }

  function wireYourDetailsForm() {
    document.getElementById("create-account").addEventListener("change", (e) => {
      document.getElementById("password-field").hidden = !e.target.checked;
    });

    document.querySelectorAll('[name="service_type"]').forEach((r) =>
      r.addEventListener("change", () => {
        const isSelfDrive = document.getElementById("svc-self").checked;
        document.getElementById("license-hint").textContent = isSelfDrive
          ? "Required for self-drive bookings."
          : "Optional — your chauffeur will drive.";
      })
    );

    const form = document.getElementById("your-details-form");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      const isSelfDrive = state.service_type === "self_drive";
      if (isSelfDrive && (!values.license_number || !values.license_expiry)) {
        window.showToast("A driver's license/IDP number and expiry are required for self-drive bookings.", "error");
        return;
      }
      state.customer = {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone,
        country: values.country,
        license_number: values.license_number || undefined,
        license_expiry: values.license_expiry || undefined,
      };
      state.special_requests = values.special_requests || "";
      state.create_account = !!values.create_account;
      state.password = values.password || undefined;
      goToStep(3);
    });
  }

  function wirePaymentForm() {
    const note = document.getElementById("payment-demo-note");
    note.textContent =
      "Demo checkout: card details are not transmitted anywhere. In production this step confirms payment via the payment provider's client-side SDK using the client_secret returned by POST /payments/intent.";

    const form = document.getElementById("payment-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const values = Object.fromEntries(new FormData(form).entries());
      if (!document.getElementById("accepted-terms").checked) {
        window.showToast("Please accept the terms to continue.", "error");
        return;
      }
      await submitBooking(values.payment_method || "card");
    });
  }

  function wireBackButtons() {
    document.querySelectorAll("[data-back-to]").forEach((btn) => {
      btn.addEventListener("click", () => goToStep(Number(btn.dataset.backTo)));
    });
  }

  function goToStep(step) {
    document.querySelectorAll("[data-step-panel]").forEach((panel) => {
      panel.hidden = Number(panel.dataset.stepPanel) !== step;
    });
    document.querySelectorAll("#step-indicator li").forEach((li) => {
      const n = Number(li.dataset.step);
      li.classList.toggle("is-active", n === step);
      li.classList.toggle("is-complete", n < step);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function requoteAndRender() {
    const panel = document.getElementById("checkout-price-panel");
    if (!document.getElementById("pickup-date").value || !document.getElementById("return-date").value) return;
    panel.innerHTML = `<h2>Price breakdown</h2><div class="skeleton" style="height:8rem;"></div>`;
    try {
      const payload = {
        vehicle_id: state.vehicle_id,
        pickup_date: document.getElementById("pickup-date").value,
        return_date: document.getElementById("return-date").value,
        service_type: document.getElementById("svc-chauffeur").checked ? "chauffeur" : "self_drive",
        airport_pickup: document.getElementById("airport-pickup").checked,
        additional_driver: document.getElementById("additional-driver").checked,
        child_seat: document.getElementById("child-seat").checked,
      };
      state.service_type = payload.service_type;
      const quote = await window.API.Pricing.quote(payload);
      lastQuote = quote;
      panel.innerHTML = `
        <h2>Price breakdown</h2>
        <div class="price-panel__row"><span>Subtotal</span><span>${window.fmt.money(quote.subtotal, quote.currency)}</span></div>
        ${Number(quote.chauffeur_fee) ? `<div class="price-panel__row"><span>Chauffeur fee</span><span>${window.fmt.money(quote.chauffeur_fee, quote.currency)}</span></div>` : ""}
        ${Number(quote.airport_pickup_fee) ? `<div class="price-panel__row"><span>Airport pickup</span><span>${window.fmt.money(quote.airport_pickup_fee, quote.currency)}</span></div>` : ""}
        ${Number(quote.additional_driver_fee) ? `<div class="price-panel__row"><span>Additional driver</span><span>${window.fmt.money(quote.additional_driver_fee, quote.currency)}</span></div>` : ""}
        ${Number(quote.child_seat_fee) ? `<div class="price-panel__row"><span>Child seat</span><span>${window.fmt.money(quote.child_seat_fee, quote.currency)}</span></div>` : ""}
        <div class="price-panel__row"><span>Taxes &amp; fees</span><span>${window.fmt.money(quote.taxes_fees, quote.currency)}</span></div>
        <div class="price-panel__row price-panel__row--total"><span>Total</span><span>${window.fmt.money(quote.total, quote.currency)}</span></div>
        ${quote.payment_model === "deposit" ? `<p class="price-panel__note">Deposit due now: <strong>${window.fmt.money(quote.deposit_due, quote.currency)}</strong><br />Balance on arrival: ${window.fmt.money(quote.balance_due, quote.currency)}</p>` : ""}
      `;
    } catch (err) {
      lastQuote = null;
      panel.innerHTML = `<h2>Price breakdown</h2><p class="alert alert--error">${err.message || "Couldn't price this trip."}</p>`;
    }
  }

  async function submitBooking(paymentMethod) {
    const btn = document.getElementById("confirm-pay-btn");
    btn.disabled = true;
    btn.textContent = "Processing…";
    try {
      const payload = {
        vehicle_id: state.vehicle_id,
        pickup_date: document.getElementById("pickup-date").value,
        pickup_time: document.getElementById("pickup-time").value,
        return_date: document.getElementById("return-date").value,
        return_time: document.getElementById("return-time").value,
        pickup_location_id: document.getElementById("pickup-location-id").value,
        dropoff_location_id: document.getElementById("dropoff-location-id").value,
        service_type: state.service_type,
        airport_pickup: document.getElementById("airport-pickup").checked,
        flight_number: document.getElementById("flight-number").value || undefined,
        additional_driver: document.getElementById("additional-driver").checked,
        child_seat: document.getElementById("child-seat").checked,
        customer: state.customer,
        special_requests: state.special_requests,
        create_account: state.create_account,
        password: state.password,
        accepted_terms: true,
      };

      const booking = await window.API.Bookings.create(payload, idempotencyKey);

      if (booking.customer_token) {
        window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken, booking.customer_token);
      }

      const amountDue = booking.price_breakdown && booking.price_breakdown.deposit_due ? booking.price_breakdown.deposit_due : booking.price_breakdown.total;
      const intent = await window.API.Payments.createIntent({
        booking_id: booking.booking_id,
        amount: amountDue,
        currency: booking.price_breakdown.currency,
        payment_method: paymentMethod,
        // Included so guest checkouts (no customer token) whose email
        // happens to match an existing account still pass the backend's
        // authorized-for-booking? check, which accepts either a token or
        // a matching reference+email pair (car_rental.backend.handlers.
        // payments/authorized-for-booking?).
        reference: booking.reference,
        email: state.customer.email,
      });

      // See file header note: real card confirmation would happen via the
      // payment provider's client SDK in production. Here we call the
      // backend's dev-only simulate-success shortcut so the demo flow
      // actually reaches `confirmed`. If it's disabled server-side (404)
      // or fails for any other reason, checkout still "succeeds" from the
      // customer's point of view (the booking exists, reference in hand)
      // — it just stays pending_payment, which the confirmation page
      // displays truthfully rather than lying about payment status.
      try {
        await window.API.Payments.simulateSuccess(intent.payment_id);
      } catch (simErr) {
        console.info("[booking] dev payment simulation unavailable/disabled — booking remains pending_payment.", simErr);
      }

      window.sessionStorage.removeItem("rr_booking_idempotency_key");
      const confirmationQs = new URLSearchParams({
        booking_id: booking.booking_id,
        reference: booking.reference,
        // email is only needed so booking-confirmation.html can use the
        // guest lookup endpoint (GET /bookings/lookup) when this checkout
        // didn't create/use a logged-in customer account — GET
        // /bookings/{id} directly requires a customer token and 403s for
        // anonymous guests (see car_rental.backend.handlers.bookings/
        // owns-booking-by-token?).
        email: state.customer.email,
      });
      window.location.href = `booking-confirmation.html?${confirmationQs.toString()}`;
    } catch (err) {
      window.showToast(err.message || "Something went wrong submitting your booking.", "error");
      btn.disabled = false;
      btn.textContent = "Confirm and Pay";
    }
  }
})();
