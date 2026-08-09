/**
 * Admin Dashboard — design-spec.md Section 3.2.
 * Backs: GET /admin/dashboard/summary (api-contract.md Section 13).
 */
(function () {
  document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.getElementById("stat-grid");
    try {
      const s = await window.API.AdminDashboard.summary();
      grid.innerHTML = `
        <div class="stat-card"><p class="stat-card__label">Pickups today</p><p class="stat-card__value">${s.upcoming_pickups_today}</p></div>
        <div class="stat-card"><p class="stat-card__label">Returns today</p><p class="stat-card__value">${s.upcoming_returns_today}</p></div>
        <div class="stat-card"><p class="stat-card__label">New bookings this week</p><p class="stat-card__value">${s.new_bookings_this_week}</p></div>
        <div class="stat-card"><p class="stat-card__label">Pending reviews</p><p class="stat-card__value">${s.pending_reviews_count}</p></div>
        <div class="stat-card"><p class="stat-card__label">Revenue this month</p><p class="stat-card__value">${window.fmt.money(s.revenue_this_month, s.currency)}</p></div>
      `;
    } catch (err) {
      grid.innerHTML = `<p class="alert alert--error">Couldn't load dashboard summary.</p>`;
    }
  });
})();
