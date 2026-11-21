// src/data/stores.js
// Utility for managing the currently selected store.

// NOTE: We no longer use hardcoded mock stores. The Store Switcher component 
// fetches the owner's real stores from the database.
// We keep an empty fallback array just in case any old components still import it.
export const STORES = [];

export const STAFF_STORE = null;

// Standardized key used across the entire application
const STORAGE_KEY = "activeStoreId";

/**
 * Reads the saved store ID from localStorage.
 * If an array of stores is passed, it verifies the saved ID exists in that array.
 */
export const readSavedStoreId = (stores = []) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    // If we passed an array of stores, make sure the saved ID is actually in there
    if (stores.length > 0) {
      const isValid = stores.some((store) => String(store.id || store.StoreID) === saved);
      if (isValid) return saved;
      // If saved ID is invalid, fallback to the first store in the array
      return String(stores[0].id || stores[0].StoreID);
    }
    
    return saved || "1"; // Default fallback to store 1 if nothing is saved
  } catch {
    return "1";
  }
};

/**
 * Saves the chosen store ID so it persists across page reloads.
 */
export const saveStoreId = (storeId) => {
  try {
    localStorage.setItem(STORAGE_KEY, storeId);
  } catch {
    // Ignore — the choice just won't be remembered (e.g. private mode)
  }
};