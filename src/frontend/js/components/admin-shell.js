/**
 * Admin shell behavior — auth guard, sidebar toggle, user menu, role-based
 * hiding of Pricing/Users links (booking_staff gets 403 on those per
 * api-contract.md Section 0's role rules).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const token = window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.adminToken);
    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const name = window.localStorage.getItem("rr_admin_name") || "Staff";
    const role = window.localStorage.getItem("rr_admin_role") || "booking_staff";
    const nameEl = document.getElementById("admin-user-name");
    if (nameEl) nameEl.textContent = `${name} (${window.fmt.title(role)})`;

    if (role !== "super_admin") {
      document.querySelectorAll("[data-role-restricted]").forEach((el) => el.remove());
    }

    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebar = document.getElementById("admin-sidebar");
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener("click", () => sidebar.classList.toggle("is-open"));
    }

    const logoutBtn = document.getElementById("admin-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await window.API.AdminAuth.logout();
        } catch (e) {
          /* ignore */
        }
        window.localStorage.removeItem(window.SITE_CONFIG.STORAGE_KEYS.adminToken);
        window.localStorage.removeItem(window.SITE_CONFIG.STORAGE_KEYS.adminRefresh);
        window.location.href = "login.html";
      });
    }
  });
})();
