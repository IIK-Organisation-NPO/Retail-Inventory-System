// src/components/Supplier/SupplierUserMenu.jsx
// Avatar button in the supplier header that opens the account menu (user info, account, settings, sign out)
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useDropdown from "../../hooks/useDropdown";
import { PopupShell } from "../Store Owner/StoreOwner_StockIn_popup";
import "../../Style/components/Supplier/SupplierUserMenu.css";
import "../../Style/components/Supplier/SupplierDepotPopups.css";

// "Nandi Mokoena" -> "NM"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const MENU_ITEMS = [
  { title: "Profile", subtitle: "Your details and password", to: "/supplier/profile" },
  { title: "Settings", subtitle: "Notification preferences", to: "/supplier/settings" },
];

// Mock user. Replace with the signed-in supplier from the API.
const SupplierUserMenu = ({ name = "Nandi Mokoena", role = "Supplier" }) => {
  const navigate = useNavigate();
  const { ref, isOpen, toggle, close } = useDropdown();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  const goTo = (path) => {
    close();
    navigate(path);
  };

  // Ask first; the user signs out only after confirming in the popup
  const askToSignOut = () => {
    close();
    setConfirmingSignOut(true);
  };

  const cancelSignOut = () => setConfirmingSignOut(false);

  const handleSignOut = () => {
    setConfirmingSignOut(false);
    // TODO: end the session with the API and clear any saved login token
    navigate("/login/supplier", { replace: true });
  };

  return (
    <div className="supplier-user-menu" ref={ref}>
      <button
        type="button"
        className={`supplier-user-menu-trigger${isOpen ? " open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${name}`}
        onClick={toggle}
      >
        {getInitials(name)}
      </button>

      {isOpen && (
        <div className="supplier-user-menu-panel" role="menu" aria-label="Account">
          <div className="supplier-user-menu-info">
            <p className="supplier-user-menu-name">{name}</p>
            <p className="supplier-user-menu-role">{role}</p>
          </div>

          {MENU_ITEMS.map((item) => (
            <button
              key={item.to}
              type="button"
              role="menuitem"
              className="supplier-user-menu-item"
              onClick={() => goTo(item.to)}
            >
              <span className="supplier-user-menu-item-title">{item.title}</span>
              <span className="supplier-user-menu-item-sub">{item.subtitle}</span>
            </button>
          ))}

          <button
            type="button"
            role="menuitem"
            className="supplier-user-menu-item"
            onClick={askToSignOut}
          >
            <span className="supplier-user-menu-item-title">Sign out</span>
          </button>
        </div>
      )}

      {confirmingSignOut && (
        <PopupShell title="Sign out" onClose={cancelSignOut}>
          <div className="sdp">
            <p className="sdp-intro">Are you sure you want to sign out?</p>

            <div className="sdp-actions">
              <button type="button" className="sdp-button sdp-button-danger" onClick={handleSignOut}>
                Sign out
              </button>
              <button type="button" className="sdp-button sdp-button-outline" onClick={cancelSignOut} autoFocus>
                Cancel
              </button>
            </div>
          </div>
        </PopupShell>
      )}
    </div>
  );
};

export default SupplierUserMenu;
