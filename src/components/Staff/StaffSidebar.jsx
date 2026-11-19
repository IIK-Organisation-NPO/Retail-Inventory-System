import React from "react";
import { NavLink } from "react-router-dom";
// Reusing the existing Sidebar CSS since the layout is identical
import "../../Style/Store Owner/Sidebar.css";

const StaffSidebar = () => {
  const navItems = [
    { name: "Home", path: "/staff" },
    { name: "Sell", path: "/staff/sell" },
    { name: "Stock", path: "/staff/stock" },
    { name: "Sales history", path: "/staff/history" },
    { name: "Alerts", path: "/staff/alerts", badge: 3 },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>SpazaNet</h1>
        <p>Store Staff</p> {/* Note: Label changed to Store Staff */}
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.name} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            <span>{item.name}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default StaffSidebar;