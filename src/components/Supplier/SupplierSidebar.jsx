import { NavLink } from "react-router-dom";
import "../../Style/components/Supplier/SupplierSidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/supplier/dashboard" },
  { label: "Demand requests", to: "/supplier/demand-requests", badge: 2 },
  { label: "My quotations", to: "/supplier/quotations" },
  { label: "Orders", to: "/supplier/orders", badge: 1 },
  { label: "Notifications", to: "/supplier/notifications", badge: 3 },
];

const SupplierSidebar = ({ showActivityBadges = false }) => (
  <aside className="supplier-sidebar">
    <div className="supplier-sidebar-brand">
      <span className="supplier-sidebar-logo">SpazaNet</span>
      <span className="supplier-sidebar-role">Supplier</span>
    </div>

    <nav className="supplier-sidebar-nav" aria-label="Supplier navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/supplier/dashboard"}
          className={({ isActive }) =>
            isActive ? "supplier-sidebar-link active" : "supplier-sidebar-link"
          }
        >
          <span>{item.label}</span>
          {showActivityBadges && item.badge ? (
            <span className="supplier-sidebar-badge" aria-hidden="true">{item.badge}</span>
          ) : null}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default SupplierSidebar;