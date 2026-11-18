// src/components/Store Owner/StoreOwnerSidebar.jsx
import { NavLink } from "react-router-dom";
import "../../Style/Store Owner/StoreOwnerInventory.css";

// Navigation items for the Store Owner area
const NAV_ITEMS = [
  { label: "Dashboard", to: "/store-owner/dashboard" },
  { label: "Products", to: "/store-owner/products" },
  { label: "Inventory", to: "/store-owner/inventory" },
  { label: "Sales", to: "/store-owner/sales" },
  { label: "Procurement", to: "/store-owner/procurement" },
  { label: "Reports", to: "/store-owner/reports" },
  { label: "Staff", to: "/store-owner/staff" },
  { label: "Store profile", to: "/store-owner/store-profile" },
  { label: "Notifications", to: "/store-owner/notifications", showBadge: true },
];

const StoreOwnerSidebar = ({ notificationCount = 0 }) => {
  return (
    <aside className="so-sidebar">
      {/* Brand */}
      <div className="so-sidebar-brand">
        <span className="so-sidebar-logo">SpazaNet</span>
        <span className="so-sidebar-role">Store Owner</span>
      </div>

      {/* Navigation links */}
      <nav className="so-sidebar-nav" aria-label="Store owner navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? "so-sidebar-link active" : "so-sidebar-link"
            }
          >
            <span>{item.label}</span>
            {item.showBadge && notificationCount > 0 && (
              <span className="so-sidebar-badge">{notificationCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default StoreOwnerSidebar;
