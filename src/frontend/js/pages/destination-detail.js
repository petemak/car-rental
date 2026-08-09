/**
 * Destination guide detail — design-spec.md Section 2.6.
 * Backs: GET /destinations/{slug} (api-contract.md Section 7).
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const slug = new URLSearchParams(window.location.search).get("slug");
    const el = document.getElementById("guide-content");
    if (!slug) {
      el.innerHTML = `<p class="alert alert--error">No guide specified.</p>`;
      return;
    }
    try {
      const d = await window.API.Destinations.get(slug);
      document.getElementById("page-title").textContent = `${d.title} | Rwanda Roadways`;
      document.getElementById("breadcrumb-current").textContent = d.title;
      el.innerHTML = `
        <article>
          <p class="eyebrow">Trip Guide</p>
          <h1>${d.title}</h1>
          <img src="${d.hero_image_url}" alt="${d.title}" style="width:100%;border-radius:var(--radius-md);margin-bottom:var(--space-5);" />
          <div>${d.body_html}</div>
          ${
            d.suggested_category
              ? `<div class="cta-banner cta-banner--teal" style="border-radius:var(--radius-md);margin-top:var(--space-6);">
                  <h2>Recommended for this route: ${d.suggested_category.name}</h2>
                  <a class="btn btn-outline-light" href="fleet.html?category=${encodeURIComponent(d.suggested_category.id)}">See ${d.suggested_category.name} vehicles</a>
                </div>`
              : ""
          }
        </article>`;
    } catch (err) {
      el.innerHTML = `<p class="alert alert--error">${err.message || "This guide could not be found."}</p><a class="btn btn-outline" href="destinations.html">Back to Destinations</a>`;
    }
  });
})();
