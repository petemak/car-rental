/**
 * Admin Users & Roles — design-spec.md Section 3.9.
 * Backs: GET/POST/PATCH/DELETE /admin/users(/{id}) (api-contract.md
 * Section 13, super_admin only).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const role = window.localStorage.getItem("rr_admin_role");
    if (role !== "super_admin") {
      document.getElementById("users-forbidden").hidden = false;
      return;
    }
    document.getElementById("users-content").hidden = false;
    loadUsers();
    document.getElementById("add-user-form").addEventListener("submit", addUser);
  });

  async function loadUsers() {
    const tbody = document.getElementById("users-table-body");
    try {
      const { data } = await window.API.AdminUsers.list();
      tbody.innerHTML = data.length
        ? data
            .map(
              (u) => `<tr>
              <td>${u.name}</td>
              <td>${u.email}</td>
              <td>${window.fmt.title(u.role)}</td>
              <td class="actions"><button type="button" class="btn btn-danger btn-sm" data-remove="${u.id}">Remove</button></td>
            </tr>`
            )
            .join("")
        : `<tr><td colspan="4">No staff accounts yet.</td></tr>`;
      tbody.querySelectorAll("[data-remove]").forEach((btn) => btn.addEventListener("click", () => removeUser(btn.dataset.remove)));
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4">Couldn't load staff accounts.</td></tr>`;
    }
  }

  async function addUser(e) {
    e.preventDefault();
    const resultEl = document.getElementById("add-user-result");
    resultEl.textContent = "";
    try {
      const values = Object.fromEntries(new FormData(e.target).entries());
      await window.API.AdminUsers.create(values);
      window.showToast("Staff account added.", "success");
      e.target.reset();
      loadUsers();
    } catch (err) {
      const fieldMsgs = err.fields ? Object.entries(err.fields).map(([k, v]) => `${k}: ${v}`).join(" ") : "";
      resultEl.textContent = [err.message, fieldMsgs].filter(Boolean).join(" — ") || "Couldn't add staff account.";
      window.showToast(err.message || "Couldn't add staff account.", "error");
    }
  }

  async function removeUser(id) {
    if (!window.confirm("Remove this staff account?")) return;
    try {
      await window.API.AdminUsers.remove(id);
      window.showToast("Staff account removed.", "success");
      loadUsers();
    } catch (err) {
      window.showToast(err.message || "Couldn't remove staff account.", "error");
    }
  }
})();
