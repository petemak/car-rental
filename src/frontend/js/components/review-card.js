/**
 * Testimonial / Review Card — design-spec.md Shared Components.
 * Renders a review object as returned by GET /reviews (api-contract.md
 * Section 6).
 */
window.renderReviewCard = function renderReviewCard(r) {
  return `
    <article class="review-card">
      <div class="review-card__stars" aria-label="${r.rating} out of 5 stars">${window.fmt.stars(r.rating)}</div>
      <p class="review-card__quote">&ldquo;${r.comment}&rdquo;</p>
      <p class="review-card__meta"><strong>${r.customer_name}</strong> · ${r.country}${r.vehicle_name ? ` · Rented ${r.vehicle_name}` : ""}</p>
    </article>`;
};
