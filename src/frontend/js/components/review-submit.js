/**
 * Shared "Leave a review" button + modal — design-spec.md Section 2.8's
 * Reviews page CTA ("only enabled for customers with a completed
 * booking") and Section 2.12's My Bookings / Booking Detail actions.
 * Backs: POST /reviews (api-contract.md Section 6), which 403s with
 * BOOKING_NOT_ELIGIBLE unless the booking belongs to the caller and is
 * `completed`, and 409s with REVIEW_ALREADY_EXISTS on a duplicate.
 *
 * Usage: include this script + a `<div id="review-modal">` placeholder
 * (see below), call `window.initReviewSubmission()` once on
 * DOMContentLoaded, and render buttons with
 * `window.renderLeaveReviewButton(bookingId, status)` for each booking
 * row/detail view. Delegated click handling means it works for buttons
 * added after initReviewSubmission() runs (e.g. after an async list
 * render).
 */
(function () {
  function ensureModal() {
    let modal = document.getElementById("review-modal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "review-modal";
    modal.className = "modal-backdrop";
    modal.hidden = true;
    modal.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="review-modal-title">
        <button type="button" class="modal__close" data-modal-close aria-label="Close">&times;</button>
        <h2 id="review-modal-title">Leave a review</h2>
        <form id="review-form" class="form-grid">
          <input type="hidden" id="review-booking-id" />
          <div class="field">
            <label for="review-rating">Rating</label>
            <select id="review-rating" required>
              <option value="5">5 — Excellent</option>
              <option value="4">4 — Very good</option>
              <option value="3">3 — Good</option>
              <option value="2">2 — Fair</option>
              <option value="1">1 — Poor</option>
            </select>
          </div>
          <div class="field">
            <label for="review-comment">Your review</label>
            <textarea id="review-comment" required minlength="5" placeholder="Tell other travelers about your trip…"></textarea>
          </div>
          <button type="submit" class="btn btn-primary">Submit review</button>
          <p id="review-form-result" role="status"></p>
        </form>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  window.renderLeaveReviewButton = function renderLeaveReviewButton(bookingId, status) {
    if (status !== "completed") return "";
    // POST /reviews requires a customer token (api-contract.md Section 6)
    // — guest-checkout bookings viewed via reference+email lookup (no
    // account) have no token to submit with, so don't offer a button that
    // would just 401.
    const hasToken = !!window.localStorage.getItem(window.SITE_CONFIG.STORAGE_KEYS.customerToken);
    if (!hasToken) return `<span class="hint">Log in to leave a review for this booking.</span>`;
    return `<button type="button" class="btn btn-outline btn-sm" data-leave-review="${bookingId}">Leave a review</button>`;
  };

  window.initReviewSubmission = function initReviewSubmission() {
    const modal = ensureModal();
    window.wireModalDismissers();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-leave-review]");
      if (!btn) return;
      document.getElementById("review-booking-id").value = btn.dataset.leaveReview;
      document.getElementById("review-form-result").textContent = "";
      document.getElementById("review-form").reset();
      window.openModal(modal);
    });

    document.getElementById("review-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const resultEl = document.getElementById("review-form-result");
      const bookingId = document.getElementById("review-booking-id").value;
      const rating = Number(document.getElementById("review-rating").value);
      const comment = document.getElementById("review-comment").value;
      resultEl.textContent = "Submitting…";
      try {
        await window.API.Reviews.create({ booking_id: bookingId, rating, comment });
        resultEl.textContent = "";
        window.closeModal(modal);
        window.showToast("Thanks! Your review is submitted and pending moderation before it appears publicly.", "success", 7000);
        const submittedBtn = document.querySelector(`[data-leave-review="${bookingId}"]`);
        if (submittedBtn) {
          submittedBtn.disabled = true;
          submittedBtn.textContent = "Review submitted";
        }
      } catch (err) {
        resultEl.textContent = err.message || "Couldn't submit your review right now.";
      }
    });
  };
})();
