/**
 * API layer — implements every endpoint in api-contract.md that the
 * frontend is documented to call. No endpoint here should exist that
 * isn't in that contract; if you need something the contract doesn't
 * offer, that's a gap to flag, not a reason to invent a shape.
 *
 * Each exported function performs the real fetch call first. If that
 * fetch fails (no backend running yet in this environment) AND
 * SITE_CONFIG.MOCK_FALLBACK is true, it falls back to local fixture data
 * from js/data/mock-data.js so the UI remains demoable. This fallback is
 * clearly isolated in the `withMockFallback` wrapper below and should be
 * removed (set MOCK_FALLBACK = false) once the real backend is reachable.
 */

class ApiError extends Error {
  constructor(status, body) {
    const errObj = (body && body.error) || { code: "UNKNOWN_ERROR", message: "Something went wrong.", fields: {} };
    super(errObj.message);
    this.status = status;
    this.code = errObj.code;
    this.fields = errObj.fields || {};
  }
}

const CFG = window.SITE_CONFIG;

function tokenFor(scope) {
  const key = scope === "admin" ? CFG.STORAGE_KEYS.adminToken : CFG.STORAGE_KEYS.customerToken;
  return window.localStorage.getItem(key);
}

function qs(params) {
  const usp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") usp.set(k, v);
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

/**
 * Core transport. `authScope` is "customer" | "admin" | null.
 * `optionalAuth`: if true, attaches a token when present but does not
 * require one (matches contract's "auth: optional (guest allowed)").
 */
async function request(method, path, { body, authScope = null, optionalAuth = false, idempotencyKey, isFormData = false } = {}) {
  const headers = {};
  if (!isFormData) headers["Content-Type"] = "application/json";
  if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

  const token = authScope ? tokenFor(authScope) : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  else if (authScope && !optionalAuth) {
    // No token available for a required-auth call — still attempt (server
    // is source of truth for 401), but callers should generally guard this.
  }

  const res = await fetch(`${CFG.API_BASE}${path}`, {
    method,
    headers,
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = null;
    }
  }

  if (!res.ok) {
    // Only treat this as a genuine API error (surfaced to the user, no
    // mock fallback) if the response actually matches api-contract.md's
    // error envelope. A 404/HTML page from "no backend is running at all"
    // (e.g. a plain static file server in local dev) won't match this
    // shape, so it's treated as "unreachable" below and can fall back to
    // mock data instead of masking a real error as itself.
    if (data && data.error && data.error.code) {
      throw new ApiError(res.status, data);
    }
    throw new Error(`No valid API response from ${path} (HTTP ${res.status}) — is the backend running at ${CFG.API_BASE}?`);
  }
  return data;
}

async function withMockFallback(realCall, mockFn, label) {
  try {
    return await realCall();
  } catch (err) {
    if (err instanceof ApiError) {
      // Real server responded with a real error (e.g. 404, 422) — surface
      // it rather than masking a genuine API error with mock data.
      throw err;
    }
    if (CFG.MOCK_FALLBACK) {
      console.warn(`[api] "${label}" — no backend reachable, using mock data fallback.`, err);
      return mockFn();
    }
    throw err;
  }
}

function paginate(items, page, perPage) {
  const p = Number(page) || 1;
  const pp = Number(perPage) || 20;
  const start = (p - 1) * pp;
  const data = items.slice(start, start + pp);
  return {
    data,
    meta: { page: p, per_page: pp, total_count: items.length, total_pages: Math.max(1, Math.ceil(items.length / pp)) },
  };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * See the matching comment in js/data/mock-data.js: this snapshots the
 * in-memory mock bookings table to localStorage so mock-created/updated
 * bookings survive a real full-page navigation (e.g. booking.html ->
 * booking-confirmation.html). Demo-only; irrelevant once a real backend
 * is reachable, since MOCK_FALLBACK paths are then never taken.
 */
function persistMockBookings() {
  try {
    window.localStorage.setItem("rr_mock_bookings_snapshot", JSON.stringify(window.MOCK_DB.bookings));
  } catch (e) {
    /* ignore quota/serialization errors */
  }
}

/* ===================== 1. Public catalog / search ===================== */

const Catalog = {
  categories() {
    return withMockFallback(
      () => request("GET", "/vehicle-categories"),
      async () => {
        await delay(150);
        return { data: window.MOCK_DB.categories };
      },
      "GET /vehicle-categories"
    );
  },

  locations() {
    return withMockFallback(
      () => request("GET", "/locations"),
      async () => {
        await delay(150);
        return { data: window.MOCK_DB.locations };
      },
      "GET /locations"
    );
  },

  vehicles(params = {}) {
    return withMockFallback(
      () => request("GET", `/vehicles${qs(params)}`),
      async () => {
        await delay(250);
        let list = window.MOCK_DB.vehicles.slice();
        if (params.category) list = list.filter((v) => v.category.id === params.category);
        if (params.service_type === "self_drive") list = list; // self-drive available on all
        if (params.service_type === "chauffeur") list = list.filter((v) => v.chauffeur_available);
        if (params.transmission) list = list.filter((v) => v.transmission === params.transmission);
        if (params.min_seats) list = list.filter((v) => v.seats >= Number(params.min_seats));
        if (params.price_min) list = list.filter((v) => Number(v.price_per_day) >= Number(params.price_min));
        if (params.price_max) list = list.filter((v) => Number(v.price_per_day) <= Number(params.price_max));
        if (params.sort === "price_asc") list.sort((a, b) => Number(a.price_per_day) - Number(b.price_per_day));
        if (params.sort === "price_desc") list.sort((a, b) => Number(b.price_per_day) - Number(a.price_per_day));
        // "available" reflects general active status when no dates supplied;
        // when dates supplied, mock marks vehicles with overlapping blocked
        // ranges as unavailable (naive overlap check for demo purposes).
        list = list.map((v) => {
          let available = true;
          if (params.pickup_date && params.return_date) {
            available = !v.availability_blocked_ranges.some(
              (r) => params.pickup_date <= r.end_date && params.return_date >= r.start_date
            );
          }
          const { availability_blocked_ranges, features, specs, policies, photos, ...card } = v;
          return { ...card, available };
        });
        return paginate(list, params.page, params.per_page);
      },
      "GET /vehicles"
    );
  },

  vehicle(id, params = {}) {
    return withMockFallback(
      () => request("GET", `/vehicles/${id}${qs(params)}`),
      async () => {
        await delay(200);
        const v = window.MOCK_DB.vehicles.find((x) => x.id === id);
        if (!v) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Vehicle not found.", fields: {} } });
        let price_breakdown = null;
        if (params.pickup_date && params.return_date) {
          const days = Math.max(1, Math.round((new Date(params.return_date) - new Date(params.pickup_date)) / 86400000));
          const subtotal = (Number(v.price_per_day) * days).toFixed(2);
          const taxes = (Number(subtotal) * 0.05).toFixed(2);
          const total = (Number(subtotal) + Number(taxes)).toFixed(2);
          price_breakdown = {
            base_rate_per_day: v.price_per_day,
            days,
            subtotal,
            chauffeur_fee: "0.00",
            airport_pickup_fee: "0.00",
            taxes_fees: taxes,
            total,
            currency: v.currency,
          };
        }
        return { ...v, price_breakdown };
      },
      "GET /vehicles/{id}"
    );
  },
};

/* ===================== 2. Pricing quote ===================== */

const Pricing = {
  quote(payload) {
    return withMockFallback(
      () => request("POST", "/pricing/quote", { body: payload }),
      async () => {
        await delay(300);
        const v = window.MOCK_DB.vehicles.find((x) => x.id === payload.vehicle_id);
        if (!v) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Vehicle not found.", fields: {} } });
        const overlap = v.availability_blocked_ranges.some(
          (r) => payload.pickup_date <= r.end_date && payload.return_date >= r.start_date
        );
        if (overlap) {
          throw new ApiError(409, {
            error: { code: "VEHICLE_NOT_AVAILABLE", message: "This vehicle is not available for the selected dates.", fields: {} },
          });
        }
        const days = Math.max(1, Math.round((new Date(payload.return_date) - new Date(payload.pickup_date)) / 86400000));
        if (days <= 0 || new Date(payload.return_date) <= new Date(payload.pickup_date)) {
          throw new ApiError(422, { error: { code: "VALIDATION_ERROR", message: "Return date must be after pickup date.", fields: { return_date: "Must be after pickup date." } } });
        }
        const extras = window.MOCK_DB.pricingSettings.extras;
        const subtotal = Number(v.price_per_day) * days;
        const chauffeur_fee = payload.service_type === "chauffeur" ? Number(extras.chauffeur_fee_per_day) * days : 0;
        const airport_pickup_fee = payload.airport_pickup ? Number(extras.airport_pickup_fee) : 0;
        const additional_driver_fee = payload.additional_driver ? Number(extras.additional_driver_fee) * days : 0;
        const child_seat_fee = payload.child_seat ? Number(extras.child_seat_fee) * days : 0;
        const preTax = subtotal + chauffeur_fee + airport_pickup_fee + additional_driver_fee + child_seat_fee;
        const taxes_fees = preTax * 0.05;
        const total = preTax + taxes_fees;
        const depositPct = window.MOCK_DB.pricingSettings.deposit_percentage / 100;
        const deposit_due = total * depositPct;
        const balance_due = total - deposit_due;
        const fmt = (n) => n.toFixed(2);
        return {
          subtotal: fmt(subtotal),
          chauffeur_fee: fmt(chauffeur_fee),
          airport_pickup_fee: fmt(airport_pickup_fee),
          additional_driver_fee: fmt(additional_driver_fee),
          child_seat_fee: fmt(child_seat_fee),
          taxes_fees: fmt(taxes_fees),
          total: fmt(total),
          currency: v.currency,
          payment_model: window.MOCK_DB.pricingSettings.payment_model,
          deposit_due: fmt(deposit_due),
          balance_due: fmt(balance_due),
        };
      },
      "POST /pricing/quote"
    );
  },
};

/* ===================== 3. Bookings ===================== */

const Bookings = {
  create(payload, idempotencyKey) {
    return withMockFallback(
      () => request("POST", "/bookings", { body: payload, authScope: "customer", optionalAuth: true, idempotencyKey }),
      async () => {
        await delay(400);
        if (!payload.accepted_terms) {
          throw new ApiError(422, { error: { code: "VALIDATION_ERROR", message: "You must accept the terms to continue.", fields: { accepted_terms: "Required" } } });
        }
        const id = `bk_${Math.floor(1000 + Math.random() * 9000)}`;
        const reference = `RR-${id.replace("bk_", "")}`;
        const vehicle = window.MOCK_DB.vehicles.find((v) => v.id === payload.vehicle_id);
        const priceBreakdown = await Pricing.quote(payload);
        const findLocation = (lid) => window.MOCK_DB.locations.find((l) => l.id === lid) || { id: lid, name: lid || "—" };

        // Persisted into MOCK_DB so subsequent GET /bookings/{id} and
        // GET /bookings/{id}/payment-status lookups (confirmation page,
        // My Bookings, admin) can find this booking again in this session.
        const bookingRecord = {
          id,
          reference,
          status: "pending_payment",
          vehicle: vehicle ? { id: vehicle.id, name: vehicle.name, thumbnail_url: vehicle.thumbnail_url } : { id: payload.vehicle_id, name: "Vehicle", thumbnail_url: "" },
          pickup_date: payload.pickup_date,
          pickup_time: payload.pickup_time,
          return_date: payload.return_date,
          return_time: payload.return_time,
          pickup_location: findLocation(payload.pickup_location_id),
          dropoff_location: findLocation(payload.dropoff_location_id),
          service_type: payload.service_type,
          airport_pickup: !!payload.airport_pickup,
          flight_number: payload.flight_number || null,
          chauffeur_assigned: null,
          customer: payload.customer,
          price_breakdown: priceBreakdown,
          payment_status: "pending",
          created_at: new Date().toISOString(),
        };
        window.MOCK_DB.bookings.push(bookingRecord);
        persistMockBookings();

        return {
          booking_id: id,
          reference,
          status: "pending_payment",
          price_breakdown: priceBreakdown,
          customer_account_created: !!payload.create_account,
          customer_token: payload.create_account ? "mock.jwt.token" : undefined,
        };
      },
      "POST /bookings"
    );
  },

  lookup(reference, email) {
    return withMockFallback(
      () => request("GET", `/bookings/lookup${qs({ reference, email })}`),
      async () => {
        await delay(250);
        const b = window.MOCK_DB.bookings.find((x) => x.reference === reference);
        if (!b) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "No booking found for that reference and email.", fields: {} } });
        return b;
      },
      "GET /bookings/lookup"
    );
  },

  get(id) {
    return withMockFallback(
      () => request("GET", `/bookings/${id}`, { authScope: "customer", optionalAuth: true }),
      async () => {
        await delay(200);
        const b = window.MOCK_DB.bookings.find((x) => x.id === id);
        if (!b) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Booking not found.", fields: {} } });
        return b;
      },
      "GET /bookings/{id}"
    );
  },

  cancel(id, payload) {
    return withMockFallback(
      () => request("POST", `/bookings/${id}/cancel`, { body: payload, authScope: "customer", optionalAuth: true }),
      async () => {
        await delay(300);
        const b = window.MOCK_DB.bookings.find((x) => x.id === id);
        if (b) {
          b.status = "cancelled";
          persistMockBookings();
        }
        const currency = (b && b.price_breakdown && b.price_breakdown.currency) || "USD";
        return { status: "cancelled", refund_amount: "895.00", refund_status: "processing", currency };
      },
      "POST /bookings/{id}/cancel"
    );
  },

  myBookings(params = {}) {
    return withMockFallback(
      () => request("GET", `/account/bookings${qs(params)}`, { authScope: "customer" }),
      async () => {
        await delay(200);
        // Shaped as BookingSummary to match the real backend
        // (booking-summary-customer): nested vehicle, flat total/currency.
        const summaries = window.MOCK_DB.bookings.map((b) => ({
          id: b.id,
          reference: b.reference,
          status: b.status,
          vehicle: b.vehicle,
          pickup_date: b.pickup_date,
          return_date: b.return_date,
          total: b.price_breakdown.total,
          currency: b.price_breakdown.currency,
        }));
        return paginate(summaries, params.page, params.per_page);
      },
      "GET /account/bookings"
    );
  },
};

/* ===================== 4. Payments ===================== */

const Payments = {
  createIntent(payload) {
    return withMockFallback(
      () => request("POST", "/payments/intent", { body: payload, authScope: "customer", optionalAuth: true }),
      async () => {
        await delay(350);
        // Mirrors the real backend: create-intent only ever produces a
        // "requires_confirmation" record. It does NOT itself mark the
        // booking paid — that only happens via POST /payments/webhook
        // (real provider, server-to-server) or, for this dev/demo build,
        // Payments.simulateSuccess() below.
        return { payment_id: `pay_mock_${Date.now()}`, provider: "stripe", client_secret: "pi_mock_secret_demo", amount: payload.amount, currency: payload.currency };
      },
      "POST /payments/intent"
    );
  },

  /**
   * DEV/DEMO-ONLY. Not part of api-contract.md's original scope (payment
   * provider integration is explicitly out of scope there, Section 14).
   * Backs the backend's dev-only `POST /payments/{payment_id}/simulate-success`
   * (car_rental.backend.handlers.payments/simulate-success), added so the
   * full booking flow can be demoed end-to-end without a real Stripe
   * integration. Does exactly what the real payment provider's webhook
   * would do on a successful charge (marks payment+booking paid/confirmed).
   * The backend gates this behind a config flag
   * (DEV_PAYMENT_SIMULATION_ENABLED) and returns 404 when disabled, as if
   * the route didn't exist — callers should treat a 404 here as "this
   * shortcut isn't available," not a hard failure of checkout itself (the
   * booking still exists as pending_payment either way).
   */
  simulateSuccess(paymentId) {
    return withMockFallback(
      () => request("POST", `/payments/${paymentId}/simulate-success`),
      async () => {
        await delay(300);
        // Mock fallback: find the booking that owns this payment_id. Since
        // the mock never persists a separate payments table, we instead
        // match on the most recently created pending_payment booking —
        // good enough for the local demo path (see createIntent above,
        // which doesn't record payment_id -> booking_id either).
        const booking = [...window.MOCK_DB.bookings].reverse().find((b) => b.payment_status !== "paid");
        if (!booking) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "No pending payment found.", fields: {} } });
        booking.payment_status = booking.price_breakdown.payment_model === "deposit" ? "partially_paid" : "paid";
        booking.status = "confirmed";
        booking.amount_paid = booking.price_breakdown.deposit_due || booking.price_breakdown.total;
        persistMockBookings();
        return {
          payment_id: paymentId,
          booking_id: booking.id,
          booking_status: booking.status,
          payment_status: booking.payment_status,
          amount_paid: booking.amount_paid,
          currency: booking.price_breakdown.currency,
        };
      },
      "POST /payments/{id}/simulate-success"
    );
  },

  status(bookingId) {
    return withMockFallback(
      () => request("GET", `/bookings/${bookingId}/payment-status`, { authScope: "customer", optionalAuth: true }),
      async () => {
        await delay(300);
        const booking = window.MOCK_DB.bookings.find((b) => b.id === bookingId);
        if (!booking) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Booking not found.", fields: {} } });
        return { payment_status: booking.payment_status || "pending", amount_paid: booking.amount_paid || "0.00", currency: booking.price_breakdown.currency };
      },
      "GET /bookings/{id}/payment-status"
    );
  },
};

/* ===================== 5. Customer auth & account ===================== */

const CustomerAuth = {
  register(payload) {
    return withMockFallback(
      () => request("POST", "/auth/customer/register", { body: payload }),
      async () => {
        await delay(300);
        return { customer_id: "cust_mock_1", token: "mock.jwt.token", refresh_token: "mock.refresh.token" };
      },
      "POST /auth/customer/register"
    );
  },

  login(payload) {
    return withMockFallback(
      () => request("POST", "/auth/customer/login", { body: payload }),
      async () => {
        await delay(300);
        return { token: "mock.jwt.token", refresh_token: "mock.refresh.token", customer: { id: "cust_1", first_name: "Jane", email: payload.email } };
      },
      "POST /auth/customer/login"
    );
  },

  logout() {
    return withMockFallback(
      () => request("POST", "/auth/customer/logout", { authScope: "customer" }),
      async () => null,
      "POST /auth/customer/logout"
    );
  },

  forgotPassword(payload) {
    return withMockFallback(
      () => request("POST", "/auth/customer/forgot-password", { body: payload }),
      async () => null,
      "POST /auth/customer/forgot-password"
    );
  },
};

const Account = {
  profile() {
    return withMockFallback(
      () => request("GET", "/account/profile", { authScope: "customer" }),
      async () => ({ id: "cust_1", first_name: "Jane", last_name: "Doe", email: "jane@example.com", phone: "+1 555 010 2000", country: "United States", license_number: "D1234567", license_expiry: "2029-04-01" }),
      "GET /account/profile"
    );
  },

  updateProfile(payload) {
    return withMockFallback(
      () => request("PATCH", "/account/profile", { body: payload, authScope: "customer" }),
      async () => ({ id: "cust_1", ...payload }),
      "PATCH /account/profile"
    );
  },
};

/* ===================== 6. Reviews ===================== */

const Reviews = {
  list(params = {}) {
    return withMockFallback(
      () => request("GET", `/reviews${qs(params)}`),
      async () => {
        await delay(200);
        let list = window.MOCK_DB.reviews.slice();
        if (params.vehicle_id) list = list.filter((r) => r.vehicle_name);
        const page = paginate(list, params.page, params.per_page);
        const avg = list.reduce((s, r) => s + r.rating, 0) / (list.length || 1);
        return { ...page, aggregate: { average_rating: Math.round(avg * 10) / 10, count: window.MOCK_DB.reviews.length } };
      },
      "GET /reviews"
    );
  },

  create(payload) {
    return withMockFallback(
      () => request("POST", "/reviews", { body: payload, authScope: "customer" }),
      async () => ({ id: `rev_${Date.now()}`, status: "pending_moderation" }),
      "POST /reviews"
    );
  },
};

/* ===================== 7. Destinations / content ===================== */

const Destinations = {
  list() {
    return withMockFallback(
      () => request("GET", "/destinations"),
      async () => ({ data: window.MOCK_DB.destinations.map(({ id, title, slug, thumbnail_url, excerpt }) => ({ id, title, slug, thumbnail_url, excerpt })) }),
      "GET /destinations"
    );
  },

  get(slug) {
    return withMockFallback(
      () => request("GET", `/destinations/${slug}`),
      async () => {
        const d = window.MOCK_DB.destinations.find((x) => x.slug === slug);
        if (!d) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Guide not found.", fields: {} } });
        return d;
      },
      "GET /destinations/{slug}"
    );
  },
};

/* ===================== 8. Contact & newsletter ===================== */

const Contact = {
  send(payload) {
    return withMockFallback(
      () => request("POST", "/contact", { body: payload }),
      async () => ({ ticket_id: `tk_${Date.now()}`, status: "received" }),
      "POST /contact"
    );
  },

  subscribe(payload) {
    return withMockFallback(
      () => request("POST", "/newsletter/subscribe", { body: payload }),
      async () => ({ status: "subscribed" }),
      "POST /newsletter/subscribe"
    );
  },
};

/* ===================== 10-13. Admin ===================== */

const AdminAuth = {
  login(payload) {
    return withMockFallback(
      () => request("POST", "/admin/auth/login", { body: payload }),
      async () => {
        await delay(300);
        if (!payload.email || !payload.password) {
          throw new ApiError(401, { error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password.", fields: {} } });
        }
        return { token: "mock.admin.jwt", refresh_token: "mock.admin.refresh", admin: { id: "adm_1", name: "Alice Uwase", role: "super_admin" } };
      },
      "POST /admin/auth/login"
    );
  },
  logout() {
    return withMockFallback(() => request("POST", "/admin/auth/logout", { authScope: "admin" }), async () => null, "POST /admin/auth/logout");
  },
};

const AdminFleet = {
  list(params = {}) {
    return withMockFallback(
      () => request("GET", `/admin/vehicles${qs(params)}`, { authScope: "admin" }),
      async () => {
        let list = window.MOCK_DB.vehicles.map((v) => ({ ...v, status: "active", created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" }));
        if (params.status) list = list.filter((v) => v.status === params.status);
        if (params.category) list = list.filter((v) => v.category.id === params.category);
        return paginate(list, params.page, params.per_page);
      },
      "GET /admin/vehicles"
    );
  },
  get(id) {
    return withMockFallback(
      () => request("GET", `/admin/vehicles/${id}`, { authScope: "admin" }),
      async () => {
        const v = window.MOCK_DB.vehicles.find((x) => x.id === id);
        if (!v) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Vehicle not found.", fields: {} } });
        return { ...v, status: "active" };
      },
      "GET /admin/vehicles/{id}"
    );
  },
  create(payload) {
    return withMockFallback(
      () => request("POST", "/admin/vehicles", { body: payload, authScope: "admin" }),
      async () => ({ id: `veh_${Date.now()}`, ...payload }),
      "POST /admin/vehicles"
    );
  },
  update(id, payload) {
    return withMockFallback(
      () => request("PATCH", `/admin/vehicles/${id}`, { body: payload, authScope: "admin" }),
      async () => ({ id, ...payload }),
      "PATCH /admin/vehicles/{id}"
    );
  },
  remove(id) {
    return withMockFallback(
      () => request("DELETE", `/admin/vehicles/${id}`, { authScope: "admin" }),
      async () => null,
      "DELETE /admin/vehicles/{id}"
    );
  },
  uploadPhoto(id, file) {
    const fd = new FormData();
    fd.append("file", file);
    return withMockFallback(
      () => request("POST", `/admin/vehicles/${id}/photos`, { body: fd, authScope: "admin", isFormData: true }),
      async () => ({ photo_id: `ph_${Date.now()}`, url: URL.createObjectURL(file) }),
      "POST /admin/vehicles/{id}/photos"
    );
  },
  deletePhoto(id, photoId) {
    return withMockFallback(
      () => request("DELETE", `/admin/vehicles/${id}/photos/${photoId}`, { authScope: "admin" }),
      async () => null,
      "DELETE /admin/vehicles/{id}/photos/{photo_id}"
    );
  },
  availability(id) {
    return withMockFallback(
      () => request("GET", `/admin/vehicles/${id}/availability`, { authScope: "admin" }),
      async () => {
        const v = window.MOCK_DB.vehicles.find((x) => x.id === id);
        return {
          blocked_ranges: (v ? v.availability_blocked_ranges : []).map((r, i) => ({ id: `blk_${i}`, ...r, reason: "Scheduled maintenance" })),
          booked_ranges: window.MOCK_DB.bookings.filter((b) => b.vehicle.id === id).map((b) => ({ booking_id: b.id, start_date: b.pickup_date, end_date: b.return_date })),
        };
      },
      "GET /admin/vehicles/{id}/availability"
    );
  },
  blockDates(id, payload) {
    return withMockFallback(
      () => request("POST", `/admin/vehicles/${id}/block-dates`, { body: payload, authScope: "admin" }),
      async () => ({ id: `blk_${Date.now()}`, ...payload }),
      "POST /admin/vehicles/{id}/block-dates"
    );
  },
  unblockDates(id, blockId) {
    return withMockFallback(
      () => request("DELETE", `/admin/vehicles/${id}/block-dates/${blockId}`, { authScope: "admin" }),
      async () => null,
      "DELETE /admin/vehicles/{id}/block-dates/{block_id}"
    );
  },
};

/**
 * Mirrors car_rental.backend.domain.presenters/booking-summary-admin:
 * flat customer_name/vehicle_name strings, flat total/currency. Shared by
 * AdminBookings.list and AdminCustomers.get's mock fallbacks so both
 * match the real backend's admin booking-list row shape.
 */
function toBookingSummaryAdmin(b) {
  return {
    id: b.id,
    reference: b.reference,
    customer_name: `${b.customer.first_name} ${b.customer.last_name}`,
    vehicle_name: b.vehicle.name,
    pickup_date: b.pickup_date,
    return_date: b.return_date,
    status: b.status,
    payment_status: b.payment_status,
    total: b.price_breakdown.total,
    currency: b.price_breakdown.currency,
  };
}

const AdminBookings = {
  list(params = {}) {
    return withMockFallback(
      () => request("GET", `/admin/bookings${qs(params)}`, { authScope: "admin" }),
      async () => paginate(window.MOCK_DB.bookings.map(toBookingSummaryAdmin), params.page, params.per_page),
      "GET /admin/bookings"
    );
  },
  get(id) {
    return withMockFallback(
      () => request("GET", `/admin/bookings/${id}`, { authScope: "admin" }),
      async () => {
        const b = window.MOCK_DB.bookings.find((x) => x.id === id);
        if (!b) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Booking not found.", fields: {} } });
        return { ...b, internal_notes: "" };
      },
      "GET /admin/bookings/{id}"
    );
  },
  update(id, payload) {
    return withMockFallback(
      () => request("PATCH", `/admin/bookings/${id}`, { body: payload, authScope: "admin" }),
      async () => {
        const b = window.MOCK_DB.bookings.find((x) => x.id === id);
        if (b) {
          Object.assign(b, payload);
          // Mirrors the real backend deriving chauffeur_assigned:{id} from
          // the stored chauffeur_id (presenters/booking-detail) rather than
          // exposing chauffeur_id itself on the response.
          if (Object.prototype.hasOwnProperty.call(payload, "chauffeur_id")) {
            b.chauffeur_assigned = payload.chauffeur_id ? { id: payload.chauffeur_id } : null;
          }
          persistMockBookings();
        }
        return { ...(b || {}), ...payload };
      },
      "PATCH /admin/bookings/{id}"
    );
  },
  resendConfirmation(id) {
    return withMockFallback(
      () => request("POST", `/admin/bookings/${id}/resend-confirmation`, { authScope: "admin" }),
      async () => null,
      "POST /admin/bookings/{id}/resend-confirmation"
    );
  },
};

const AdminCustomers = {
  list(params = {}) {
    return withMockFallback(
      () => request("GET", `/admin/customers${qs(params)}`, { authScope: "admin" }),
      async () => paginate(window.MOCK_DB.customers, params.page, params.per_page),
      "GET /admin/customers"
    );
  },
  get(id) {
    return withMockFallback(
      () => request("GET", `/admin/customers/${id}`, { authScope: "admin" }),
      async () => {
        const c = window.MOCK_DB.customers.find((x) => x.id === id);
        if (!c) throw new ApiError(404, { error: { code: "NOT_FOUND", message: "Customer not found.", fields: {} } });
        return { ...c, bookings: window.MOCK_DB.bookings.map(toBookingSummaryAdmin) };
      },
      "GET /admin/customers/{id}"
    );
  },
};

const AdminPricing = {
  settings() {
    return withMockFallback(
      () => request("GET", "/admin/pricing/settings", { authScope: "admin" }),
      async () => window.MOCK_DB.pricingSettings,
      "GET /admin/pricing/settings"
    );
  },
  updateSettings(payload) {
    return withMockFallback(
      () => request("PATCH", "/admin/pricing/settings", { body: payload, authScope: "admin" }),
      async () => ({ ...window.MOCK_DB.pricingSettings, ...payload }),
      "PATCH /admin/pricing/settings"
    );
  },
  seasonalRates() {
    return withMockFallback(
      () => request("GET", "/admin/pricing/seasonal-rates", { authScope: "admin" }),
      async () => ({ data: [] }),
      "GET /admin/pricing/seasonal-rates"
    );
  },
  createSeasonalRate(payload) {
    return withMockFallback(
      () => request("POST", "/admin/pricing/seasonal-rates", { body: payload, authScope: "admin" }),
      async () => ({ id: `sr_${Date.now()}`, ...payload }),
      "POST /admin/pricing/seasonal-rates"
    );
  },
  deleteSeasonalRate(id) {
    return withMockFallback(
      () => request("DELETE", `/admin/pricing/seasonal-rates/${id}`, { authScope: "admin" }),
      async () => null,
      "DELETE /admin/pricing/seasonal-rates/{id}"
    );
  },
};

const AdminReviews = {
  list(params = {}) {
    return withMockFallback(
      () => request("GET", `/admin/reviews${qs(params)}`, { authScope: "admin" }),
      async () => paginate(window.MOCK_DB.reviews.map((r) => ({ ...r, status: "approved" })), params.page, params.per_page),
      "GET /admin/reviews"
    );
  },
  update(id, payload) {
    return withMockFallback(
      () => request("PATCH", `/admin/reviews/${id}`, { body: payload, authScope: "admin" }),
      async () => {
        const r = window.MOCK_DB.reviews.find((x) => x.id === id);
        return { ...(r || {}), ...payload };
      },
      "PATCH /admin/reviews/{id}"
    );
  },
};

const AdminContent = {
  list() {
    return withMockFallback(
      () => request("GET", "/admin/destinations", { authScope: "admin" }),
      async () => ({ data: window.MOCK_DB.destinations.map((d) => ({ ...d, status: "published" })) }),
      "GET /admin/destinations"
    );
  },
  create(payload) {
    return withMockFallback(
      () => request("POST", "/admin/destinations", { body: payload, authScope: "admin" }),
      async () => ({ id: `dest_${Date.now()}`, ...payload }),
      "POST /admin/destinations"
    );
  },
  update(id, payload) {
    return withMockFallback(
      () => request("PATCH", `/admin/destinations/${id}`, { body: payload, authScope: "admin" }),
      async () => ({ id, ...payload }),
      "PATCH /admin/destinations/{id}"
    );
  },
  remove(id) {
    return withMockFallback(
      () => request("DELETE", `/admin/destinations/${id}`, { authScope: "admin" }),
      async () => null,
      "DELETE /admin/destinations/{id}"
    );
  },
};

const AdminUsers = {
  list() {
    return withMockFallback(
      () => request("GET", "/admin/users", { authScope: "admin" }),
      async () => ({ data: window.MOCK_DB.adminUsers }),
      "GET /admin/users"
    );
  },
  create(payload) {
    return withMockFallback(
      () => request("POST", "/admin/users", { body: payload, authScope: "admin" }),
      async () => ({ id: `adm_${Date.now()}`, ...payload }),
      "POST /admin/users"
    );
  },
  update(id, payload) {
    return withMockFallback(
      () => request("PATCH", `/admin/users/${id}`, { body: payload, authScope: "admin" }),
      async () => ({ id, ...payload }),
      "PATCH /admin/users/{id}"
    );
  },
  remove(id) {
    return withMockFallback(
      () => request("DELETE", `/admin/users/${id}`, { authScope: "admin" }),
      async () => null,
      "DELETE /admin/users/{id}"
    );
  },
};

const AdminSettings = {
  get() {
    return withMockFallback(
      () => request("GET", "/admin/settings", { authScope: "admin" }),
      async () => window.MOCK_DB.settings,
      "GET /admin/settings"
    );
  },
  update(payload) {
    return withMockFallback(
      () => request("PATCH", "/admin/settings", { body: payload, authScope: "admin" }),
      async () => ({ ...window.MOCK_DB.settings, ...payload }),
      "PATCH /admin/settings"
    );
  },
};

const AdminDashboard = {
  summary() {
    return withMockFallback(
      () => request("GET", "/admin/dashboard/summary", { authScope: "admin" }),
      async () => ({ upcoming_pickups_today: 3, upcoming_returns_today: 2, new_bookings_this_week: 11, pending_reviews_count: 4, revenue_this_month: "8420.00", currency: "USD" }),
      "GET /admin/dashboard/summary"
    );
  },
};

window.API = {
  ApiError,
  Catalog,
  Pricing,
  Bookings,
  Payments,
  CustomerAuth,
  Account,
  Reviews,
  Destinations,
  Contact,
  AdminAuth,
  AdminFleet,
  AdminBookings,
  AdminCustomers,
  AdminPricing,
  AdminReviews,
  AdminContent,
  AdminUsers,
  AdminSettings,
  AdminDashboard,
};
