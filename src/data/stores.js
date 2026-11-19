// src/data/stores.js
// The store owner's tuckshops and the currently selected one.

// Mock data — replace with the owner's stores from the API
export const STORES = [
  { id: "mseleku", name: "Mseleku Tuckshop" },
  { id: "ezakheni", name: "Ezakheni Spaza" },
  { id: "nquthu", name: "Nquthu Corner Shop" },
];

export const STAFF_STORE = STORES[0];

// Remembers the chosen store when moving between pages
const STORAGE_KEY = "spazanet.selectedStoreId";

export const readSavedStoreId = (stores = STORES) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (stores.some((store) => String(store.id) === saved)) return saved;
  } catch {
    // Storage unavailable (e.g. private mode) — fall back to the first store
  }
  return stores[0] ? String(stores[0].id) : undefined;
};

export const saveStoreId = (storeId) => {
  try {
    localStorage.setItem(STORAGE_KEY, storeId);
  } catch {
    // Ignore — the choice just won't be remembered
  }
};
