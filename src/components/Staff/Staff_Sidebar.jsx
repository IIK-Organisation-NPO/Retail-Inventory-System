// src/components/Staff/Staff_Sidebar.jsx
import { NavLink } from "react-router-dom";
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
    </aside>
  );
};

export default Staff_Sidebar;
