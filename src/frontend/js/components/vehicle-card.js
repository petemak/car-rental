/**
 * Vehicle Card — design-spec.md Shared Components "Vehicle Card".
 * Renders the card markup for a vehicle summary object as returned by
 * GET /vehicles (api-contract.md Section 1).
 */
window.renderVehicleCard = function renderVehicleCard(v, opts = {}) {
  const detailHref = `vehicle-detail.html?id=${encodeURIComponent(v.id)}${opts.searchQS || ""}`;
  const unavailable = v.available === false;
  return `
    <article class="vehicle-card">
      <div class="vehicle-card__media">
        <img src="${v.thumbnail_url}" alt="${v.name}, ${v.category.name} available for rent" loading="lazy" width="400" height="300" />
        <span class="vehicle-card__badge">${v.category.name}</span>
        ${unavailable ? '<div class="vehicle-card__unavailable">Not available for selected dates</div>' : ""}
      </div>
      <div class="vehicle-card__body">
        <h3 class="vehicle-card__title"><a href="${detailHref}">${v.name}</a></h3>
        <ul class="vehicle-card__meta">
          <li>${v.seats} seats</li>
          <li>${window.fmt.transmission(v.transmission)}</li>
          <li>${window.fmt.fuel(v.fuel_type)}</li>
          ${v.rating_avg ? `<li>★ ${v.rating_avg} (${v.rating_count})</li>` : ""}
        </ul>
        <p class="vehicle-card__trust">Well maintained &amp; inspected before every trip</p>
        <div class="vehicle-card__footer">
          <p class="vehicle-card__price">${window.fmt.money(v.price_per_day, v.currency)}<br /><small>per day</small></p>
          <div class="vehicle-card__actions">
            <a class="btn btn-outline btn-sm" href="${detailHref}">View details</a>
          </div>
        </div>
      </div>
    </article>`;
};

window.renderVehicleCardSkeleton = function renderVehicleCardSkeleton() {
  return `
    <div class="vehicle-card" aria-hidden="true">
      <div class="skeleton" style="aspect-ratio:4/3;"></div>
      <div class="vehicle-card__body">
        <div class="skeleton" style="height:1.25rem;width:70%;margin-bottom:.5rem;"></div>
        <div class="skeleton" style="height:.9rem;width:50%;margin-bottom:1rem;"></div>
        <div class="skeleton" style="height:1.5rem;width:40%;"></div>
      </div>
    </div>`;
};
