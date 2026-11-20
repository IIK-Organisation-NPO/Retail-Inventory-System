// src/components/Store Owner/StoreOwnerSidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
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
  { label: "Stores", to: "/store-owner/stores" },
  { label: "Notifications", to: "/store-owner/notifications", showBadge: true },
];

const StoreOwnerSidebar = ({ notificationCount = 0 }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // 1. Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("activeStoreId");
    
    // 2. Redirect to the login page
    navigate("/login/store-owner-staff");
  };

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

      {/* Logout Section (Pinned to the bottom) */}
      <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid #eee' }}>
        <button 
          onClick={handleLogout}
          style={{ 
            width: '100%', 
            padding: '10px', 
            backgroundColor: 'transparent', 
            color: '#cc0000', 
            border: '1px solid #cc0000', 
            borderRadius: '5px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#ffebee'}
          onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default StoreOwnerSidebar;