import { NavLink } from "react-router-dom";
import "../../Style/components/Supplier/SupplierSidebar.css";

const NAV_ITEMS = [
  { label: "Dashboard", to: "/supplier/dashboard" },
  { label: "Demand requests", to: "/supplier/demand-requests" },
  { label: "My quotations", to: "/supplier/quotations" },
  { label: "Orders", to: "/supplier/orders" },
  { label: "Notifications", to: "/supplier/notifications" },
];

const SupplierSidebar = () => (
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
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default SupplierSidebar;