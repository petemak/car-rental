/**
 * Global Nav behavior — design-spec.md Shared Components "Global Nav".
 * Wires the hamburger toggle, persists the currency selector, and swaps
 * the account link between "Login" and "My Bookings" based on whether a
 * customer token is present (js/config.js STORAGE_KEYS.customerToken).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector("[data-nav-toggle]");
    const mobileNav = document.querySelector("[data-mobile-nav]");
    if (toggle && mobileNav) {
      toggle.addEventListener("click", () => {
        const isOpen = mobileNav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
      });
    }

    const currencySelect = document.querySelector("[data-currency-select]");
    if (currencySelect) {
      const stored = window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.currency);
      if (stored) currencySelect.value = stored;
      currencySelect.addEventListener("change", () => {
        window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.currency, currencySelect.value);
        window.showToast && window.showToast(`Currency set to ${currencySelect.value}. Prices from the API are shown in the currency the backend returns; a full multi-currency conversion is a v2 item (see api-contract.md Section 14).`, "info", 6000);
      });
    }

    const accountLink = document.querySelector("[data-account-link]");
    if (accountLink) {
      const hasToken = !!window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken);
      if (hasToken) {
        accountLink.textContent = "My Bookings";
        accountLink.setAttribute("href", accountLink.getAttribute("data-account-href-loggedin") || "/account/bookings.html");
      }
    }

    document.querySelectorAll("[data-brand-name]").forEach((el) => {
      el.textContent = window.SITE_CONFIG.BRAND_NAME;
    });
    document.title = document.title.replace(/\{\{BRAND_NAME\}\}/g, window.SITE_CONFIG.BRAND_NAME);
  });
})();
