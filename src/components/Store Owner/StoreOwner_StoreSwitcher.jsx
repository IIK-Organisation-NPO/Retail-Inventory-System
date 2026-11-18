// src/components/Store Owner/StoreOwner_StoreSwitcher.jsx
// Header dropdown for switching between the store owner's tuckshops
import { useState } from "react";
import useDropdown from "../../hooks/useDropdown";
import "../../Style/Store Owner/StoreOwner_HeaderMenus.css";
import { STORES as DEFAULT_STORES, readSavedStoreId, saveStoreId } from "../../data/stores";

// "Mseleku Tuckshop" -> "MT"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const StoreOwner_StoreSwitcher = ({ stores = DEFAULT_STORES, onChange }) => {
  const { ref, isOpen, toggle, close } = useDropdown();
  const [selectedId, setSelectedId] = useState(() => readSavedStoreId(stores));

  const selected = stores.find((s) => s.id === selectedId) ?? stores[0];
  if (!selected) return null;

  const handleSelect = (store) => {
    setSelectedId(store.id);
    saveStoreId(store.id);
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
