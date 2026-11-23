// src/components/Store Owner/StoreOwner_UserMenu.jsx
// Avatar button in the header that opens the account menu (user info, settings, profile, sign out)
import { useNavigate } from "react-router-dom";
import useDropdown from "../../hooks/useDropdown";
import "../../Style/Store Owner/StoreOwner_HeaderMenus.css";

// "Sipho Dlamini" -> "SD"
const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

// The name of whoever is signed in, saved at login (and updated when the profile is edited)
const getSavedName = () => {
  const first = localStorage.getItem("userName") || "";
  const last = localStorage.getItem("userSurname") || "";
  return `${first} ${last}`.trim();
};

const StoreOwner_UserMenu = ({
  name, // optional: if a page passes a name it is used, otherwise the saved login name is shown
  role = "Store Owner",
  accountPath = "/store-owner/profile",
  accountLabel = "Profile",
  showSettings = true,
}) => {
  const navigate = useNavigate();
  const { ref, isOpen, toggle, close } = useDropdown();

  const displayName = getSavedName() || (name && name.trim()) || "Account";

  const goTo = (path) => {
    close();
    navigate(path);
  };

  const handleSignOut = () => {
    close();
    // Clear the saved login so the next person who signs in never sees this person's details
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userSurname");
    navigate("/login/store-owner-staff", { replace: true });
  };

  return (
    <div className="hm-dropdown" ref={ref}>
      {/* Avatar button */}
      <button
        type="button"
        className={`so-avatar hm-avatar-btn${isOpen ? " open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${displayName}`}
        onClick={toggle}
      >
        {getInitials(displayName)}
      </button>

      {isOpen && (
        <div className="hm-menu hm-user-menu" role="menu" aria-label="Account">
          {/* User information */}
          <div className="hm-user-info">
            <p className="hm-user-name">{displayName}</p>
            <p className="hm-user-role">{role}</p>
          </div>

          <div className="hm-divider" />

          {showSettings && (
            <button type="button" role="menuitem" className="hm-item" onClick={() => goTo("/store-owner/settings")}>
              <span className="hm-item-title">Settings</span>
              <span className="hm-item-sub">Notification preferences</span>
            </button>
          )}

          <button type="button" role="menuitem" className="hm-item" onClick={() => goTo(accountPath)}>
            <span className="hm-item-title">{accountLabel}</span>
            <span className="hm-item-sub">Your details and account</span>
          </button>

          <div className="hm-divider" />

          <button type="button" role="menuitem" className="hm-item" onClick={handleSignOut}>
            <span className="hm-item-title">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default StoreOwner_UserMenu;