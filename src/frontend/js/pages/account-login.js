/**
 * Account Login / Register / Guest Lookup — design-spec.md Section 2.12.
 * Backs: POST /auth/customer/login, POST /auth/customer/register,
 * POST /auth/customer/forgot-password, GET /bookings/lookup
 * (api-contract.md Sections 3, 5).
 */
(function () {
  const tabs = ["login", "register", "lookup"];

  document.addEventListener("DOMContentLoaded", () => {
    tabs.forEach((name) => {
      document.getElementById(`tab-${name}`).addEventListener("click", () => activateTab(name));
    });

    document.getElementById("login-form").addEventListener("submit", handleLogin);
    document.getElementById("register-form").addEventListener("submit", handleRegister);
    document.getElementById("lookup-form").addEventListener("submit", handleLookup);
    document.getElementById("forgot-password-link").addEventListener("click", handleForgotPassword);
  });

  function activateTab(name) {
    tabs.forEach((t) => {
      document.getElementById(`tab-${t}`).setAttribute("aria-selected", String(t === name));
      document.getElementById(`panel-${t}`).hidden = t !== name;
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const resultEl = document.getElementById("login-result");
    resultEl.textContent = "Logging in…";
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const res = await window.API.CustomerAuth.login(values);
      window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken, res.token);
      window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.customerRefresh, res.refresh_token);
      resultEl.textContent = "";
      window.location.href = "bookings.html";
    } catch (err) {
      resultEl.textContent = err.message || "Invalid email or password.";
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const resultEl = document.getElementById("register-result");
    resultEl.textContent = "Creating account…";
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const res = await window.API.CustomerAuth.register(values);
      window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken, res.token);
      window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.customerRefresh, res.refresh_token);
      resultEl.textContent = "";
      window.location.href = "bookings.html";
    } catch (err) {
      resultEl.textContent = err.message || "Couldn't create your account.";
    }
  }

  async function handleLookup(e) {
    e.preventDefault();
    const form = e.target;
    const resultEl = document.getElementById("lookup-result");
    resultEl.textContent = "Searching…";
    try {
      const values = Object.fromEntries(new FormData(form).entries());
      const booking = await window.API.Bookings.lookup(values.reference, values.email);
      resultEl.textContent = "";
      window.location.href = `booking-detail.html?id=${encodeURIComponent(booking.id)}&reference=${encodeURIComponent(values.reference)}&email=${encodeURIComponent(values.email)}`;
    } catch (err) {
      resultEl.textContent = err.message || "No booking found for that reference and email.";
    }
  }

  async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    if (!email) {
      window.showToast("Enter your email above first, then click Forgot password.", "info");
      return;
    }
    try {
      await window.API.CustomerAuth.forgotPassword({ email });
      window.showToast("If that email has an account, a reset link is on its way.", "success");
    } catch (err) {
      window.showToast(err.message || "Couldn't process that request.", "error");
    }
  }
})();
