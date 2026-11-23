// src/pages/suppliers/SupplierNotifications.jsx
import { useState } from "react";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import "../../Style/components/Supplier/SupplierDashboard.css";
import "../../Style/components/Supplier/SupplierNotifications.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "requests", label: "Requests" },
  { key: "orders", label: "Orders" },
  { key: "system", label: "System" },
];

// Mock notifications. Replace with data from the API.
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    category: "requests",
    title: "New demand request",
    message: "Coca-Cola 500ml, 72 units. Quotes close Sun 22 Nov.",
    time: "13 Nov, 08:00",
    read: false,
  },
  {
    id: 2,
    category: "requests",
    title: "New demand request",
    message: "Sunflower oil 5L, 60 L. Quotes close Wed 25 Nov.",
    time: "13 Nov, 07:30",
    read: false,
  },
  {
    id: 3,
    category: "orders",
    title: "Quotation accepted",
    message: "Ace Maize Meal 2.5kg: 70 units accepted by 2 of 3 stores, at R52.00.",
    time: "12 Nov, 15:20",
    read: false,
  },
  {
    id: 4,
    category: "orders",
    title: "Order to confirm",
    message: "ORD-001 is waiting for your confirmation.",
    time: "12 Nov, 15:20",
    read: false,
  },
  {
    id: 5,
    category: "system",
    title: "System announcement",
    message: "Welcome to the pilot.",
    time: "10 Nov, 09:00",
    read: true,
  },
];

const SupplierNotifications = () => {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState("all");

  const visibleNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((item) => item.category === activeFilter);

  const hasUnread = notifications.some((item) => !item.read);

  const markAllAsRead = () => {
    // TODO: tell the API all notifications are read
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  };

  const markAsRead = (id) => {
    // TODO: tell the API this notification is read
    setNotifications((items) =>
      items.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  };

  return (
    <div className="supplier-dashboard-layout">
      <SupplierSidebar showActivityBadges />

      <main className="supplier-dashboard-main supplier-notifications">
        <header className="supplier-dashboard-header">
          <h1>Notifications</h1>
          <div className="supplier-dashboard-account">
            <button
              type="button"
              className="supplier-notifications-mark-all"
              onClick={markAllAsRead}
              disabled={!hasUnread}
            >
              Mark all as read
            </button>
            <div className="supplier-company-pill">
              <span className="supplier-company-initials">TB</span>
              <span>Tiger Brands Ltd</span>
            </div>
            <SupplierUserMenu />
          </div>
        </header>

        <div className="supplier-notifications-filters" role="tablist" aria-label="Filter notifications">
          {FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.key}
              className={`supplier-notifications-filter${activeFilter === filter.key ? " active" : ""}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <section className="supplier-notifications-card" aria-label="Notifications">
          {visibleNotifications.length === 0 ? (
            <p className="supplier-notifications-empty">No notifications here yet.</p>
          ) : (
            <ul className="supplier-notifications-list">
              {visibleNotifications.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`supplier-notification${item.read ? "" : " unread"}`}
                    onClick={() => markAsRead(item.id)}
                  >
                    <span className="supplier-notification-dot" aria-hidden="true" />
                    <span className="supplier-notification-body">
                      <span className="supplier-notification-title">
                        {item.title}
                        {!item.read && <span className="supplier-visually-hidden"> (unread)</span>}
                      </span>
                      <span className="supplier-notification-message">{item.message}</span>
                    </span>
                    <span className="supplier-notification-time">{item.time}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};

export default SupplierNotifications;
