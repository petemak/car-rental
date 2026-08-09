/**
 * Contact page — design-spec.md Section 2.10.
 * Backs: POST /contact (api-contract.md Section 8).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contact-form");
    const resultEl = document.getElementById("contact-result");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = document.getElementById("contact-submit");
      btn.disabled = true;
      resultEl.innerHTML = "";
      try {
        const values = Object.fromEntries(new FormData(form).entries());
        const res = await window.API.Contact.send(values);
        resultEl.innerHTML = `<p class="alert alert--success">Thanks, ${values.name.split(" ")[0]}! Your message was received (ticket ${res.ticket_id}). We'll reply to ${values.email} shortly.</p>`;
        form.reset();
      } catch (err) {
        resultEl.innerHTML = `<p class="alert alert--error">${err.message || "Couldn't send your message — please try again or WhatsApp us directly."}</p>`;
      } finally {
        btn.disabled = false;
      }
    });
  });
})();
