/**
 * Home page — design-spec.md Section 2.1.
 * Backs: GET /vehicles (featured pull), GET /destinations, GET /reviews.
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    window.initSearchWidget(document.getElementById("hero-search-form"));
    loadFeaturedVehicles();
    loadDestinationTeasers();
    loadReviewStrip();
  });

  async function loadFeaturedVehicles() {
    const el = document.getElementById("featured-vehicles");
    try {
      const { data } = await window.API.Catalog.vehicles({ per_page: 4, sort: "recommended" });
      el.innerHTML = data.length
        ? data.map((v) => window.renderVehicleCard(v)).join("")
        : '<p class="empty-state">Fleet listings are temporarily unavailable — please check the full Fleet page.</p>';
    } catch (err) {
      el.innerHTML = `<p class="empty-state">Couldn't load featured vehicles right now. <a href="fleet.html">Browse the full fleet</a>.</p>`;
      console.error(err);
    }
  }

  async function loadDestinationTeasers() {
    const el = document.getElementById("destination-teasers");
    try {
      const { data } = await window.API.Destinations.list();
      el.innerHTML = data
        .slice(0, 3)
        .map(
          (d) => `
        <a class="dest-card" href="destination-detail.html?slug=${encodeURIComponent(d.slug)}">
          <div class="dest-card__media"><img src="${d.thumbnail_url}" alt="${d.title}" loading="lazy" /></div>
          <div class="dest-card__body">
            <h3>${d.title}</h3>
            <p>${d.excerpt}</p>
          </div>
        </a>`
        )
        .join("");
    } catch (err) {
      el.innerHTML = `<p class="empty-state">Couldn't load destination guides right now.</p>`;
      console.error(err);
    }
  }

  async function loadReviewStrip() {
    const el = document.getElementById("review-strip");
    try {
      const { data } = await window.API.Reviews.list({ per_page: 3 });
      el.innerHTML = data.map((r) => window.renderReviewCard(r)).join("");
    } catch (err) {
      el.innerHTML = `<p class="empty-state">Couldn't load reviews right now.</p>`;
      console.error(err);
    }
  }
})();
