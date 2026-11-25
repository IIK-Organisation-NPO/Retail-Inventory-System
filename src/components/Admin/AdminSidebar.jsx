import { NavLink } from "react-router-dom";
import "../../Style/Admin/AdminSidebar.css";

const ADMIN_NAV_ITEMS = [
  { label: "Dashboard", to: "/admin/dashboard" },
  { label: "Stores", to: "/admin/stores", badge: 1 },
  { label: "Suppliers", to: "/admin/suppliers", badge: 1 },
  { label: "Users", to: "/admin/users" },
  { label: "Procurement", to: "/admin/procurement" },
  { label: "Reports", to: "/admin/reports" },
  { label: "Audit log", to: "/admin/audit-log" },
  { label: "System health", to: "/admin/system-health" },
  { label: "Announcements", to: "/admin/announcements" },
];

const AdminSidebar = () => (
  <aside className="admin-sidebar">
    <div className="admin-sidebar-brand">
      <span className="admin-sidebar-logo">SpazaNet</span>
      <span className="admin-sidebar-role">Administrator</span>
    </div>
    <nav className="admin-sidebar-nav" aria-label="Administrator navigation">
      {ADMIN_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin/dashboard"}
          className={({ isActive }) => (
            isActive ? "admin-sidebar-link active" : "admin-sidebar-link"
          )}
        >
          <span>{item.label}</span>
          {item.badge ? <span className="admin-sidebar-badge">{item.badge}</span> : null}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default AdminSidebar;