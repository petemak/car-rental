/**
 * Destinations & Trip Guides — design-spec.md Section 2.6.
 * Backs: GET /destinations (api-contract.md Section 7).
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const el = document.getElementById("destinations-grid");
    try {
      const { data } = await window.API.Destinations.list();
      el.innerHTML = data.length
        ? data
            .map(
              (d) => `
        <a class="dest-card" href="destination-detail.html?slug=${encodeURIComponent(d.slug)}">
          <div class="dest-card__media"><img src="${d.thumbnail_url}" alt="${d.title}" loading="lazy" /></div>
          <div class="dest-card__body">
            <h2>${d.title}</h2>
            <p>${d.excerpt}</p>
          </div>
        </a>`
            )
            .join("")
        : `<p class="empty-state">No guides published yet — check back soon.</p>`;
    } catch (err) {
      el.innerHTML = `<p class="empty-state">Couldn't load destination guides right now.</p>`;
      console.error(err);
    }
  });
})();
