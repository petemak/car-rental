/**
 * Admin Reviews Moderation — design-spec.md Section 3.7.
 * Backs: GET /admin/reviews, PATCH /admin/reviews/{id} (api-contract.md
 * Section 13).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("filter-status").addEventListener("change", loadReviews);
    loadReviews();
  });

  async function loadReviews() {
    const el = document.getElementById("reviews-list");
    el.innerHTML = `<div class="skeleton" style="height:6rem;"></div>`;
    try {
      const { data } = await window.API.AdminReviews.list({ status: document.getElementById("filter-status").value || undefined });
      el.innerHTML = data.length
        ? `<div class="data-table-wrap"><table class="data-table"><thead><tr>
            <th scope="col">Customer</th><th scope="col">Rating</th><th scope="col">Comment</th><th scope="col">Vehicle</th><th scope="col">Status</th><th scope="col">Actions</th>
          </tr></thead><tbody>${data
            .map(
              (r) => `<tr>
              <td>${r.customer_name}</td>
              <td>${window.fmt.stars(r.rating)}</td>
              <td style="white-space:normal;max-width:24rem;">${r.comment}</td>
              <td>${r.vehicle_name || "—"}</td>
              <td><span class="badge badge--${r.status}">${window.fmt.title(r.status)}</span></td>
              <td class="actions">
                <button type="button" class="btn btn-outline btn-sm" data-approve="${r.id}">Approve</button>
                <button type="button" class="btn btn-danger btn-sm" data-reject="${r.id}">Reject</button>
                <button type="button" class="btn btn-outline btn-sm" data-reply="${r.id}">Reply</button>
              </td>
            </tr>`
            )
            .join("")}</tbody></table></div>`
        : `<p class="empty-state">No reviews match this filter.</p>`;

      el.querySelectorAll("[data-approve]").forEach((btn) => btn.addEventListener("click", () => updateReview(btn.dataset.approve, { status: "approved" })));
      el.querySelectorAll("[data-reject]").forEach((btn) => btn.addEventListener("click", () => updateReview(btn.dataset.reject, { status: "rejected" })));
      el.querySelectorAll("[data-reply]").forEach((btn) =>
        btn.addEventListener("click", () => {
          const reply = window.prompt("Reply to this review:");
          if (reply) updateReview(btn.dataset.reply, { admin_reply: reply });
        })
      );
    } catch (err) {
      el.innerHTML = `<p class="alert alert--error">${err.message || "Couldn't load reviews."}</p>`;
    }
  }

  async function updateReview(id, payload) {
    try {
      await window.API.AdminReviews.update(id, payload);
      window.showToast("Review updated.", "success");
      loadReviews();
    } catch (err) {
      window.showToast(err.message || "Couldn't update review.", "error");
    }
  }
})();
