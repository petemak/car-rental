/**
 * FAQ Accordion — design-spec.md Shared Components "FAQ Accordion".
 * Progressive enhancement over a <details>-free button/panel pattern so
 * each trigger has correct aria-expanded / aria-controls wiring.
 */
(function () {
  function initAccordion(root) {
    root.querySelectorAll(".accordion-item__trigger").forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const expanded = trigger.getAttribute("aria-expanded") === "true";
        trigger.setAttribute("aria-expanded", String(!expanded));
        const panelId = trigger.getAttribute("aria-controls");
        const panel = document.getElementById(panelId);
        if (panel) panel.hidden = expanded;
      });
    });
  }

  window.initAccordions = function initAccordions(selector = ".accordion") {
    document.querySelectorAll(selector).forEach(initAccordion);
  };

  /**
   * Builds accordion markup from [{ q, a }] and inserts into container.
   */
  window.renderAccordion = function renderAccordion(container, items, idPrefix = "faq") {
    container.innerHTML = items
      .map((item, i) => {
        const panelId = `${idPrefix}-panel-${i}`;
        const triggerId = `${idPrefix}-trigger-${i}`;
        return `
          <div class="accordion-item">
            <h3>
              <button type="button" class="accordion-item__trigger" id="${triggerId}" aria-expanded="false" aria-controls="${panelId}">
                <span>${item.q}</span>
                <svg class="chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 9l6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </h3>
            <div class="accordion-item__panel" id="${panelId}" role="region" aria-labelledby="${triggerId}" hidden>
              <p>${item.a}</p>
            </div>
          </div>`;
      })
      .join("");
    initAccordion(container);
  };
})();
