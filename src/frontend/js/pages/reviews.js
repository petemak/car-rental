/**
 * Reviews page — design-spec.md Section 2.8.
 * Backs: GET /reviews, GET /vehicle-categories (api-contract.md
 * Sections 1, 6).
 */
(function () {
  let currentPage = 1;

  document.addEventListener("DOMContentLoaded", async () => {
    await populateCategories();
    document.getElementById("review-category-filter").addEventListener("change", () => {
      currentPage = 1;
      loadReviews();
    });
    loadReviews();
  });

  async function populateCategories() {
    try {
      const { data } = await window.API.Catalog.categories();
      const sel = document.getElementById("review-category-filter");
      data.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name;
        sel.appendChild(opt);
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function loadReviews() {
    const grid = document.getElementById("reviews-grid");
    const summaryEl = document.getElementById("rating-summary");
    const category = document.getElementById("review-category-filter").value;
    grid.innerHTML = Array.from({ length: 6 })
      .map(() => `<div class="review-card"><div class="skeleton" style="height:6rem;"></div></div>`)
      .join("");

    try {
      const { data, meta, aggregate } = await window.API.Reviews.list({ category: category || undefined, page: currentPage, per_page: 6 });
      summaryEl.innerHTML = `
        <span class="rating-summary__score">${aggregate.average_rating}</span>
        <div>
          <div class="stars" aria-hidden="true">${window.fmt.stars(aggregate.average_rating)}</div>
          <p style="margin:0;color:var(--color-text-muted);">Based on ${aggregate.count} verified reviews</p>
        </div>`;
      grid.innerHTML = data.length ? data.map((r) => window.renderReviewCard(r)).join("") : `<p class="empty-state">No reviews yet for this filter.</p>`;
      renderPagination(meta);
    } catch (err) {
      grid.innerHTML = `<p class="empty-state">Couldn't load reviews right now.</p>`;
      summaryEl.innerHTML = "";
      console.error(err);
    }
  }

  function renderPagination(meta) {
    const el = document.getElementById("reviews-pagination");
    if (meta.total_pages <= 1) {
      el.innerHTML = "";
      return;
    }
    let html = "";
    for (let i = 1; i <= meta.total_pages; i++) {
      html += `<li><button type="button" data-page="${i}" ${i === meta.page ? 'aria-current="page"' : ""}>${i}</button></li>`;
    }
    el.innerHTML = html;
    el.querySelectorAll("button[data-page]").forEach((btn) =>
      btn.addEventListener("click", () => {
        currentPage = Number(btn.dataset.page);
        loadReviews();
      })
    );
  }
})();
