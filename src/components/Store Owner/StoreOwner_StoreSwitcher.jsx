// src/components/Store Owner/StoreOwner_StoreSwitcher.jsx
// Header dropdown for switching between the store owner's tuckshops
import { useState, useEffect } from "react";
import useDropdown from "../../hooks/useDropdown";
import "../../Style/Store Owner/StoreOwner_HeaderMenus.css";

const StoreLogo = ({ store }) => (
  <svg
    className="so-store-logo"
    viewBox="0 0 32 32"
    role="img"
    aria-label={`${store.name} logo`}
  >
    <circle cx="16" cy="16" r="16" fill="#e5e7eb" />
    <rect x="7" y="8" width="18" height="16" rx="3" fill="#fff" stroke="#9ca3af" strokeWidth="1.5" />
    <circle cx="12.5" cy="13.5" r="2" fill="#9ca3af" />
    <path d="m9 22 5-5 3 3 2-2 4 4" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const StoreOwner_StoreSwitcher = ({ onChange, readOnly = false }) => {
  const { ref, isOpen, toggle, close } = useDropdown();
  
  // State
  const [stores, setStores] = useState([]);
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem("activeStoreId") || "");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // --- 1. FETCH STORES FROM BACKEND ---
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/stores/my-stores", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok && data.length > 0) {
          // Map database columns to the frontend's expected structure
          const formattedStores = data.map(s => ({
            id: String(s.StoreID),
            name: s.StoreName
          }));

          setStores(formattedStores);

          // If no active store is saved, or the saved one doesn't exist anymore, default to the first
          const currentSavedId = localStorage.getItem("activeStoreId");
          const isValidSavedId = formattedStores.some(s => s.id === currentSavedId);

          if (!currentSavedId || !isValidSavedId) {
            setSelectedId(formattedStores[0].id);
            localStorage.setItem("activeStoreId", formattedStores[0].id);
          } else {
            setSelectedId(currentSavedId);
          }
        }
      } catch (err) {
        console.error("Failed to load stores", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchStores();
  }, [token]);

  // Find the full store object for the currently selected ID
  const selected = stores.find((store) => store.id === selectedId) || stores[0];

  const handleSelect = (store) => {
    setSelectedId(store.id);
    localStorage.setItem("activeStoreId", store.id);
    close();
    
    // Notify parent (if it passed an onChange handler)
    onChange?.(store);
    
    // Reload the page so all components fetch data for the new store
    window.location.reload(); 
  };

  // Show nothing while loading or if the user has 0 stores
  if (loading) return <div className="so-store-selector" style={{ opacity: 0.5 }}>Loading...</div>;
  if (!selected) return <div className="so-store-selector" style={{ opacity: 0.5 }}>No Stores</div>;

  return (
    <div className="hm-dropdown" ref={ref}>
      {readOnly ? (
        <div
          className="so-store-selector so-store-selector-read-only"
          role="group"
          aria-label={`Store: ${selected.name}`}
        >
          <StoreLogo store={selected} />
          <span className="so-store-name">{selected.name}</span>
        </div>
      ) : (
        <>
          <button
            type="button"
            className="so-store-selector"
            aria-haspopup="menu"
            aria-expanded={isOpen}
            onClick={toggle}
          >
            <StoreLogo store={selected} />
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

          {isOpen && (
            <div className="hm-menu hm-store-menu" role="menu" aria-label="Your stores">
              <p className="hm-menu-heading">Your stores</p>
              {stores.map((store) => {
                const isSelected = String(store.id) === String(selected.id);
                return (
                  <button
                    key={store.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={isSelected}
                    className="hm-store-option"
                    onClick={() => handleSelect(store)}
                  >
                    <StoreLogo store={store} />
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
        </>
      )}
    </div>
  );
};

export default StoreOwner_StoreSwitcher;