/**
 * Profile page — design-spec.md Section 2.12.
 * Backs: GET /account/profile, PATCH /account/profile (api-contract.md
 * Section 5).
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const hasToken = !!window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken);
    if (!hasToken) {
      document.getElementById("auth-required").hidden = false;
      return;
    }
    const form = document.getElementById("profile-form");
    form.hidden = false;
    try {
      const profile = await window.API.Account.profile();
      Object.entries(profile).forEach(([key, value]) => {
        const field = form.querySelector(`[name="${key}"]`);
        if (field) field.value = value || "";
      });
    } catch (err) {
      document.getElementById("profile-result").textContent = err.message || "Couldn't load your profile.";
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultEl = document.getElementById("profile-result");
      resultEl.textContent = "Saving…";
      try {
        const values = Object.fromEntries(new FormData(form).entries());
        delete values.email;
        await window.API.Account.updateProfile(values);
        resultEl.textContent = "Saved.";
      } catch (err) {
        resultEl.textContent = err.message || "Couldn't save your profile.";
      }
    });
  });
})();
