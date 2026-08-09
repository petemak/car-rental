/**
 * Admin Login — design-spec.md Section 3.1.
 * Backs: POST /admin/auth/login (api-contract.md Section 10).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("admin-login-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultEl = document.getElementById("login-result");
      resultEl.textContent = "Signing in…";
      try {
        const values = Object.fromEntries(new FormData(e.target).entries());
        const res = await window.API.AdminAuth.login(values);
        window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.adminToken, res.token);
        window.localStorage.setItem(window.SITE_CONFIG.STORAGE_KEYS.adminRefresh, res.refresh_token);
        window.localStorage.setItem("rr_admin_name", res.admin.name);
        window.localStorage.setItem("rr_admin_role", res.admin.role);
        window.location.href = "dashboard.html";
      } catch (err) {
        resultEl.textContent = err.message || "Invalid email or password.";
      }
    });
  });
})();
