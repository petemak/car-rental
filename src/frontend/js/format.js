/**
 * Formatting helpers. Money always arrives from the API as a decimal
 * string + currency code (api-contract.md Section 0 "Money") — the
 * frontend never computes totals, only formats what it's given.
 */
window.fmt = {
  money(amount, currency) {
    if (amount === null || amount === undefined) return "—";
    const num = Number(amount);
    if (Number.isNaN(num)) return amount;
    try {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD" }).format(num);
    } catch (e) {
      return `${currency || "USD"} ${num.toFixed(2)}`;
    }
  },

  date(isoDateStr) {
    if (!isoDateStr) return "—";
    const d = new Date(`${isoDateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return isoDateStr;
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  },

  dateTime(isoTimestamp) {
    if (!isoTimestamp) return "—";
    const d = new Date(isoTimestamp);
    if (Number.isNaN(d.getTime())) return isoTimestamp;
    return d.toLocaleString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  },

  stars(rating) {
    const full = Math.round(rating || 0);
    return "★★★★★☆☆☆☆☆".slice(5 - full, 10 - full);
  },

  title(str) {
    if (!str) return "";
    return str.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  },

  transmission(t) {
    return t === "automatic" ? "Automatic" : "Manual";
  },

  fuel(f) {
    return window.fmt.title(f || "");
  },
};
