/**
 * Toast / alert region — design-spec.md Shared Components "Alert / Toast".
 * Injects a live region once per page and exposes window.showToast().
 */
(function () {
  function ensureRegion() {
    let region = document.querySelector(".toast-region");
    if (!region) {
      region = document.createElement("div");
      region.className = "toast-region";
      region.setAttribute("aria-live", "polite");
      region.setAttribute("role", "status");
      document.body.appendChild(region);
    }
    return region;
  }

  window.showToast = function showToast(message, type = "info", timeout = 5000) {
    const region = ensureRegion();
    const toast = document.createElement("div");
    toast.className = `toast toast--${type}`;
    toast.textContent = message;
    region.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, timeout);
  };
})();
