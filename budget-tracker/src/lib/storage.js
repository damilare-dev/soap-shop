import { supabase, cloudEnabled } from './supabase.js';

// Single shared row — everyone with the site URL reads/writes the same budget.
const ROW_ID = 'default';

function loadLocal(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}

function saveLocal(key, value) {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
}

async function loadRemote() {
  const { data, error } = await supabase
    .from('budget_data')
    .select('data')
    .eq('id', ROW_ID)
    .maybeSingle();
  if (error) {
    console.warn('Supabase load failed:', error.message);
    return null;
  }
  return data?.data ?? null;
}

async function saveRemote(value) {
  const { error } = await supabase.from('budget_data').upsert({ id: ROW_ID, data: value });
  if (error) {
    console.warn('Supabase save failed:', error.message);
    return false;
  }
  return true;
}

// Minimal async key-value storage shim matching the
// { get(key) -> {value}|null, set(key, value) -> boolean } shape the app expects.
// Backed by Supabase (shared across everyone) when configured, with localStorage
// as an offline cache and a fallback when Supabase isn't set up.
function ensureWindowStorage() {
  if (typeof window === 'undefined' || window.storage) return;

  window.storage = {
    async get(key) {
      if (cloudEnabled) {
        const remote = await loadRemote();
        if (remote !== null) {
          saveLocal(key, remote);
          return { value: remote };
        }
        // No remote row yet — seed it from whatever this device has locally.
        const local = loadLocal(key);
        if (local !== null) await saveRemote(local);
        return local === null ? null : { value: local };
      }
      const local = loadLocal(key);
      return local === null ? null : { value: local };
    },
    async set(key, value) {
      const localOk = saveLocal(key, value);
      if (cloudEnabled) return saveRemote(value);
      return localOk;
    },
  };
}

ensureWindowStorage();
