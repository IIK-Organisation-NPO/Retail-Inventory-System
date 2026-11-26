// src/components/Supplier/SupplierUserMenu.jsx
import { useNavigate } from "react-router-dom";
import useDropdown from "../../hooks/useDropdown";
import "../../Style/components/Supplier/SupplierUserMenu.css";

const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("") || "??";

const MENU_ITEMS = [
  { title: "Profile", subtitle: "Your details and password", to: "/supplier/profile" },
  { title: "Settings", subtitle: "Notification preferences", to: "/supplier/settings" },
];

const SupplierUserMenu = ({ name, role } = {}) => {
  const navigate = useNavigate();
  const { ref, isOpen, toggle, close } = useDropdown();

  const storedFirst = localStorage.getItem("userName") || "";
  const storedSurname = localStorage.getItem("userSurname") || "";
  const fullName = name || `${storedFirst} ${storedSurname}`.trim() || "Supplier";
  const displayRole = role || (localStorage.getItem("role") === "SUPPLIER" ? "Supplier" : "Supplier");

  const goTo = (path) => {
    close();
    navigate(path);
  };

  const handleSignOut = () => {
    close();
    // Clear both the legacy and current token keys, plus cached user info.
    localStorage.removeItem("token");
    localStorage.removeItem("supplierToken");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userSurname");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("companyName");
    navigate("/login/supplier", { replace: true });
  };

  return (
    <div className="supplier-user-menu" ref={ref}>
      <button
        type="button"
        className={`supplier-user-menu-trigger${isOpen ? " open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${fullName}`}
        onClick={toggle}
      >
        {getInitials(fullName)}
      </button>

      {isOpen && (
        <div className="supplier-user-menu-panel" role="menu" aria-label="Account">
          <div className="supplier-user-menu-info">
            <p className="supplier-user-menu-name">{fullName}</p>
            <p className="supplier-user-menu-role">{displayRole}</p>
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
            onClick={handleSignOut}
          >
            <span className="supplier-user-menu-item-title">Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default SupplierUserMenu;