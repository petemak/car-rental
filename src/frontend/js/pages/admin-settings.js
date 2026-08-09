/**
 * Admin Business Settings — design-spec.md Section 3.10.
 * Backs: GET/PATCH /admin/settings (api-contract.md Section 13,
 * super_admin only).
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const role = window.localStorage.getItem("rr_admin_role");
    if (role !== "super_admin") {
      document.getElementById("settings-forbidden").hidden = false;
      return;
    }
    const form = document.getElementById("settings-form");
    form.hidden = false;
    try {
      const s = await window.API.AdminSettings.get();
      form.querySelector("#business-name").value = s.business_name || "";
      form.querySelector("#contact-email").value = s.contact_email || "";
      form.querySelector("#contact-phone").value = s.contact_phone || "";
      form.querySelector("#whatsapp-number").value = s.whatsapp_number || "";
      form.querySelector("#office-address").value = s.office_address || "";
      const t = s.notification_templates || {};
      form.querySelector("#tpl-confirmed").value = t.booking_confirmed || "";
      form.querySelector("#tpl-reminder").value = t.booking_reminder || "";
      form.querySelector("#tpl-cancelled").value = t.booking_cancelled || "";
      const p = s.payment_provider || {};
      form.querySelector("#payment-provider").value = p.provider || "stripe";
      form.querySelector("#payment-public-key").value = p.public_key || "";
    } catch (err) {
      document.getElementById("settings-result").textContent = err.message || "Couldn't load settings.";
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultEl = document.getElementById("settings-result");
      resultEl.textContent = "Saving…";
      const payload = {
        business_name: form.querySelector("#business-name").value,
        contact_email: form.querySelector("#contact-email").value,
        contact_phone: form.querySelector("#contact-phone").value,
        whatsapp_number: form.querySelector("#whatsapp-number").value,
        office_address: form.querySelector("#office-address").value,
        notification_templates: {
          booking_confirmed: form.querySelector("#tpl-confirmed").value,
          booking_reminder: form.querySelector("#tpl-reminder").value,
          booking_cancelled: form.querySelector("#tpl-cancelled").value,
        },
        payment_provider: {
          provider: form.querySelector("#payment-provider").value,
          public_key: form.querySelector("#payment-public-key").value,
        },
      };
      try {
        await window.API.AdminSettings.update(payload);
        resultEl.textContent = "Saved.";
        window.showToast("Settings updated.", "success");
      } catch (err) {
        resultEl.textContent = err.message || "Couldn't save settings.";
      }
    });
  });
})();
