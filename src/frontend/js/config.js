/**
 * Site-wide configuration.
 *
 * BRAND_NAME is a placeholder per brand-brief.md / design-spec.md
 * ({{BRAND_NAME}} token) — swap once the business owner confirms a name.
 *
 * API_ORIGIN / API_BASE follow api-contract.md Section 0 conventions:
 *   /api/v1        customer-facing + shared
 *   /api/v1/admin  staff-only
 *
 * The backend (src/backend/, Clojure) runs as its own server/process —
 * it is NOT served from the same origin as this static frontend, so
 * API_BASE must be an absolute URL (origin + path), not a path-only
 * string. A path-only "/api/v1" would resolve against the frontend's own
 * static-file origin and 404 against itself rather than reaching the
 * backend at all. The backend has permissive CORS configured
 * (resources/config.edn :cors {:allowed-origins "*"} — see routes.clj
 * wrap-cors) specifically so this cross-origin fetch setup works.
 *
 * API_ORIGIN is intentionally the one line to change per environment
 * (local dev vs. a deployed backend host) — everything else derives from
 * it. Override without editing this file by defining
 * `window.__RR_API_ORIGIN__` in a small inline <script> before this file
 * loads (e.g. a per-environment index.html snippet or a build step),
 * which takes precedence if present.
 *
 * MOCK_FALLBACK: every call in js/api.js attempts the real fetch first
 * and only falls back to local fixture data (js/data/mock-data.js) if
 * that fetch fails outright (network error / no server reachable at
 * API_ORIGIN) — a real JSON error response from the backend is always
 * surfaced as-is, never masked. Set MOCK_FALLBACK to false in production
 * once the backend is confirmed reachable, so a real outage is visible
 * instead of silently serving stale mock data.
 */
(function () {
  var API_ORIGIN = window.__RR_API_ORIGIN__ || "http://localhost:3000";

  window.SITE_CONFIG = {
    BRAND_NAME: "Rwanda Roadways",
    API_ORIGIN: API_ORIGIN,
    API_BASE: API_ORIGIN + "/api/v1",
    MOCK_FALLBACK: true,
    DEFAULT_CURRENCY: "USD",
    SUPPORTED_CURRENCIES: ["USD", "EUR", "GBP", "RWF"],
    STORAGE_KEYS: {
      customerToken: "rr_customer_token",
      customerRefresh: "rr_customer_refresh",
      adminToken: "rr_admin_token",
      adminRefresh: "rr_admin_refresh",
      lastSearch: "rr_last_search",
      currency: "rr_currency",
    },
  };
})();
