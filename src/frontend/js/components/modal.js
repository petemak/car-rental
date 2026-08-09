/**
 * Minimal modal / lightbox helper — design-spec.md Shared Components
 * "Modal / Lightbox". Handles open/close, Escape key, backdrop click,
 * and basic focus return.
 */
(function () {
  let lastFocused = null;

  window.openModal = function openModal(modalEl) {
    lastFocused = document.activeElement;
    modalEl.hidden = false;
    const focusable = modalEl.querySelector("[autofocus], button, a, input, select, textarea");
    if (focusable) focusable.focus();
    document.addEventListener("keydown", onKeydown);
  };

  window.closeModal = function closeModal(modalEl) {
    modalEl.hidden = true;
    document.removeEventListener("keydown", onKeydown);
    if (lastFocused) lastFocused.focus();
  };

  function onKeydown(e) {
    if (e.key === "Escape") {
      const open = document.querySelector(".modal-backdrop:not([hidden])");
      if (open) window.closeModal(open);
    }
  }

  window.wireModalDismissers = function wireModalDismissers(root = document) {
    root.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) window.closeModal(backdrop);
      });
      backdrop.querySelectorAll("[data-modal-close]").forEach((btn) => {
        btn.addEventListener("click", () => window.closeModal(backdrop));
      });
    });
  };
})();
