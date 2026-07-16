// Minimal async key-value storage shim backed by localStorage, matching the
// { get(key) -> {value}|null, set(key, value) -> boolean } shape the app expects.
function ensureWindowStorage() {
  if (typeof window === "undefined" || window.storage) return;

  window.storage = {
    async get(key) {
      try {
        const value = window.localStorage.getItem(key);
        return value === null ? null : { value };
      } catch (e) {
        return null;
      }
    },
    async set(key, value) {
      try {
        window.localStorage.setItem(key, value);
        return true;
      } catch (e) {
        return false;
      }
    },
  };
}

ensureWindowStorage();
