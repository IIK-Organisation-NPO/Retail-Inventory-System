// src/components/Store Owner/StoreOwner_StoreSwitcher.jsx
// Header dropdown for switching between the store owner's tuckshops
import { useState } from "react";
import useDropdown from "../../hooks/useDropdown";
import "../../Style/Store Owner/StoreOwner_HeaderMenus.css";

// Mock data — replace with the owner's stores from the API
const DEFAULT_STORES = [
  { id: "mseleku", name: "Mseleku Tuckshop" },
  { id: "ezakheni", name: "Ezakheni Spaza" },
  { id: "nquthu", name: "Nquthu Corner Shop" },
];

// Remembers the chosen store when moving between pages
const STORAGE_KEY = "spazanet.selectedStoreId";

// "Mseleku Tuckshop" -> "MT"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const readSavedStoreId = (stores) => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (stores.some((s) => s.id === saved)) return saved;
  } catch {
    // Storage unavailable (e.g. private mode) — fall back to the first store
  }
  return stores[0]?.id;
};

const StoreOwner_StoreSwitcher = ({ stores = DEFAULT_STORES, onChange }) => {
  const { ref, isOpen, toggle, close } = useDropdown();
  const [selectedId, setSelectedId] = useState(() => readSavedStoreId(stores));

  const selected = stores.find((s) => s.id === selectedId) ?? stores[0];
  if (!selected) return null;

  const handleSelect = (store) => {
    setSelectedId(store.id);
    try {
      localStorage.setItem(STORAGE_KEY, store.id);
    } catch {
      // Ignore — the choice just won't be remembered
    }
    close();
    onChange?.(store);
  };

  return (
    <div className="hm-dropdown" ref={ref}>
      {/* Button showing the current store */}
      <button
        type="button"
        className="so-store-selector"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={toggle}
      >
        <span className="so-avatar so-avatar-sm">{getInitials(selected.name)}</span>
        <span className="so-store-name">{selected.name}</span>
        <svg
          className={`hm-chevron${isOpen ? " open" : ""}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          aria-hidden="true"
        >
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* List of the owner's stores */}
      {isOpen && (
        <div className="hm-menu hm-store-menu" role="menu" aria-label="Your stores">
          <p className="hm-menu-heading">Your stores</p>
          {stores.map((store) => {
            const isSelected = store.id === selected.id;
            return (
              <button
                key={store.id}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                className="hm-store-option"
                onClick={() => handleSelect(store)}
              >
                <span className="so-avatar so-avatar-sm">{getInitials(store.name)}</span>
                <span className="hm-store-option-name">{store.name}</span>
                {isSelected && (
                  <svg className="hm-check" width="14" height="14" viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M3 8.5l3 3 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StoreOwner_StoreSwitcher;
