/**
 * Admin Destinations/Content Management — design-spec.md Section 3.8.
 * Backs: GET/POST/PATCH/DELETE /admin/destinations(/{id})
 * (api-contract.md Section 13).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    loadList();
    document.getElementById("content-form").addEventListener("submit", saveGuide);
    document.getElementById("clear-form-btn").addEventListener("click", clearForm);
  });

  function clearForm() {
    document.getElementById("content-form").reset();
    document.getElementById("dest-id").value = "";
    document.getElementById("form-heading").textContent = "Add a guide";
  }

  async function loadList() {
    const tbody = document.getElementById("content-table-body");
    try {
      const { data } = await window.API.AdminContent.list();
      tbody.innerHTML = data.length
        ? data
            .map(
              (d) => `<tr>
              <td>${d.title}</td>
              <td>${d.slug}</td>
              <td><span class="badge badge--${d.status === "published" ? "approved" : "pending"}">${window.fmt.title(d.status)}</span></td>
              <td class="actions">
                <button type="button" class="btn btn-outline btn-sm" data-edit="${d.id}">Edit</button>
                <button type="button" class="btn btn-danger btn-sm" data-delete="${d.id}">Delete</button>
              </td>
            </tr>`
            )
            .join("")
        : `<tr><td colspan="4">No guides yet.</td></tr>`;

      window._destinationsCache = data;
      tbody.querySelectorAll("[data-edit]").forEach((btn) => btn.addEventListener("click", () => editGuide(btn.dataset.edit)));
      tbody.querySelectorAll("[data-delete]").forEach((btn) => btn.addEventListener("click", () => deleteGuide(btn.dataset.delete)));
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="4">Couldn't load guides.</td></tr>`;
    }
  }

  function editGuide(id) {
    const d = (window._destinationsCache || []).find((x) => x.id === id);
    if (!d) return;
    document.getElementById("form-heading").textContent = `Edit: ${d.title}`;
    document.getElementById("dest-id").value = d.id;
    document.getElementById("dest-title").value = d.title;
    document.getElementById("dest-slug").value = d.slug;
    document.getElementById("dest-thumb").value = d.thumbnail_url;
    document.getElementById("dest-hero").value = d.hero_image_url || "";
    document.getElementById("dest-excerpt").value = d.excerpt || "";
    document.getElementById("dest-body").value = d.body_html || "";
    document.getElementById("dest-category").value = (d.suggested_category && d.suggested_category.id) || "";
    document.getElementById("dest-status").value = d.status || "draft";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveGuide(e) {
    e.preventDefault();
    const resultEl = document.getElementById("content-result");
    resultEl.textContent = "Saving…";
    const values = Object.fromEntries(new FormData(e.target).entries());
    const id = values.id;
    delete values.id;
    try {
      if (id) {
        await window.API.AdminContent.update(id, values);
      } else {
        await window.API.AdminContent.create(values);
      }
      resultEl.textContent = "Saved.";
      window.showToast("Guide saved.", "success");
      clearForm();
      loadList();
    } catch (err) {
      resultEl.textContent = err.message || "Couldn't save guide.";
    }
  }

  async function deleteGuide(id) {
    if (!window.confirm("Delete this guide?")) return;
    try {
      await window.API.AdminContent.remove(id);
      window.showToast("Guide deleted.", "success");
      loadList();
    } catch (err) {
      window.showToast(err.message || "Couldn't delete guide.", "error");
    }
  }
})();
