/**
 * Footer newsletter signup — design-spec.md Shared Components "Footer".
 * Backs: POST /newsletter/subscribe (api-contract.md Section 8).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("[data-newsletter-form]");
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = form.querySelector('[name="email"]').value.trim();
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await window.API.Contact.subscribe({ email });
        window.showToast("Subscribed! Watch your inbox for Rwanda trip tips.", "success");
        form.reset();
      } catch (err) {
        window.showToast(err.message || "Couldn't subscribe right now — please try again.", "error");
      } finally {
        button.disabled = false;
      }
    });
  });
})();
