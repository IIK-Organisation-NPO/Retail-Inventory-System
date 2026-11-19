// src/components/Store Owner/StoreOwner_UserMenu.jsx
// Avatar button in the header that opens the account menu (user info, settings, profile, sign out)
import { useNavigate } from "react-router-dom";
import useDropdown from "../../hooks/useDropdown";
import "../../Style/Store Owner/StoreOwner_HeaderMenus.css";

// "Sipho Dlamini" -> "SD"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

// Mock user — replace with the signed-in user from the API
const StoreOwner_UserMenu = ({ name = "Sipho Dlamini", role = "Store Owner" }) => {
  const navigate = useNavigate();
  const { ref, isOpen, toggle, close } = useDropdown();

  const goTo = (path) => {
    close();
    navigate(path);
  };

  const handleSignOut = () => {
    close();
    // TODO: end the session with the API and clear any saved login token
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
        aria-label={`Account menu for ${name}`}
        onClick={toggle}
      >
        {getInitials(name)}
      </button>

      {isOpen && (
        <div className="hm-menu hm-user-menu" role="menu" aria-label="Account">
          {/* User information */}
          <div className="hm-user-info">
            <p className="hm-user-name">{name}</p>
            <p className="hm-user-role">{role}</p>
          </div>

          <div className="hm-divider" />

          <button type="button" role="menuitem" className="hm-item" onClick={() => goTo("/store-owner/settings")}>
            <span className="hm-item-title">Settings</span>
            <span className="hm-item-sub">Notification preferences</span>
          </button>

          <button type="button" role="menuitem" className="hm-item" onClick={() => goTo("/store-owner/profile")}>
            <span className="hm-item-title">Profile</span>
            <span className="hm-item-sub">Your details and password</span>
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
