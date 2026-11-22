// src/components/Staff/Staff_Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import "../../Style/Staff/Staff_Sidebar.css";

// Navigation items for the Store Staff area
const NAV_ITEMS = [
  { label: "Home", to: "/staff" },
  { label: "Sell", to: "/staff/sell" },
  { label: "Stock", to: "/staff/stock" },
  { label: "Sales history", to: "/staff/sales-history" },
  { label: "Alerts", to: "/staff/alerts", showBadge: true },
];

const Staff_Sidebar = ({ alertCount = 0 }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("activeStoreId");
    
    // Redirect to the login page
    navigate("/login/store-owner-staff");
  };

  return (
    <aside className="st-sidebar">
      {/* Brand */}
      <div className="st-sidebar-brand">
        <span className="st-sidebar-logo">SpazaNet</span>
        <span className="st-sidebar-role">Store Staff</span>
      </div>

      {/* Navigation links */}
      <nav className="st-sidebar-nav" aria-label="Store staff navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/staff"}
            className={({ isActive }) =>
              isActive ? "st-sidebar-link active" : "st-sidebar-link"
            }
          >
            <span>{item.label}</span>
            {item.showBadge && alertCount > 0 && (
              <span className="st-sidebar-badge">{alertCount}</span>
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

export default Staff_Sidebar;