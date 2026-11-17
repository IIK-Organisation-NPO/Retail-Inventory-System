import { NavLink } from "react-router-dom";
import "../../Style/Store Owner/Sidebar.css";


const Sidebar = () => {
  const navItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Products", path: "/products" },
    { name: "Inventory", active: false },
    { name: "Sales", active: false },
    { name: "Procurement", active: false },
    { name: "Reports", active: false },
    { name: "Staff", active: false },
    { name: "Store profile", active: false },
    { name: "Notifications", active: false, badge: 3 },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <h1>SpazaNet</h1>
        <p>Store Owner</p>
      </div>

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const contents = (
            <>
              <span>{item.name}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </>
          );

          return item.path ? (
            <NavLink
              key={item.name}
              to={item.path}
              end
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              {contents}
            </NavLink>
          ) : (
            <div key={item.name} className="nav-item">
              {contents}
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
