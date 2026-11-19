// src/pages/Staff/Staff_Alerts.jsx
import { useState } from "react";
import "../../Style/Staff/Staff_Layout.css";
import "../../Style/Staff/Staff_Alerts.css";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Mock data — replace with API data once the backend is connected
const STORE = { name: "Mseleku Tuckshop" };
const LAST_SYNCED = "2 min ago";

// type "stock" shows a red dot, "system" a blue dot
const ALERTS = [
  {
    id: 1,
    type: "stock",
    title: "Low stock",
    message: "Rama Margarine 500g is out of stock",
    timestamp: "13 Nov, 09:00",
    read: false,
  },
  {
    id: 2,
    type: "stock",
    title: "Low stock",
    message: "Sasko Premium Bread is below reorder level (12 of 15)",
    timestamp: "13 Nov, 08:00",
    read: false,
  },
  {
    id: 3,
    type: "system",
    title: "System announcement",
    message: "Welcome to the pilot. Please record every sale.",
    timestamp: "10 Nov, 09:00",
    read: false,
  },
];

// "Mseleku Tuckshop" -> "MT"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const Staff_Alerts = () => {
  const [alerts, setAlerts] = useState(ALERTS);

  const unreadCount = alerts.filter((alert) => !alert.read).length;

  // TODO: save read state with the API
  const markAllAsRead = () => {
    setAlerts((current) => current.map((alert) => ({ ...alert, read: true })));
  };

  const markAsRead = (id) => {
    setAlerts((current) =>
      current.map((alert) => (alert.id === id ? { ...alert, read: true } : alert))
    );
  };

  return (
    <div className="st-layout">
      {/* =========================================
          SIDEBAR
          ========================================= */}
      <Staff_Sidebar alertCount={unreadCount} />

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main className="st-main">
        {/* Page header: title, sync status, mark all as read, store, user avatar */}
        <header className="st-header">
          <h1 className="st-page-title">Alerts</h1>

          <div className="st-header-actions">
            <span className="st-sync">Synced {LAST_SYNCED}</span>

            <button
              type="button"
              className="st-btn st-btn-outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>

            {/* Staff work in one store, so this is a label, not a switcher */}
            <div className="st-store-chip">
              <span className="st-avatar st-avatar-sm" aria-hidden="true">
                {getInitials(STORE.name)}
              </span>
              <span>{STORE.name}</span>
            </div>

            <StoreOwner_UserMenu
              name="Lindiwe Ngcobo"
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        {/* Alerts list */}
        <section className="st-alerts-card" aria-label="Alerts">
          {alerts.length === 0 ? (
            <p className="st-alerts-empty">You have no alerts.</p>
          ) : (
            <ul className="st-alerts-list">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <button
                    type="button"
                    className={`st-alert${alert.read ? " read" : ""}`}
                    onClick={() => markAsRead(alert.id)}
                  >
                    <span
                      className={`st-alert-dot st-alert-dot-${alert.type}`}
                      aria-hidden="true"
                    />
                    <span className="st-alert-body">
                      <span className="st-alert-title">
                        {alert.title}
                        {!alert.read && <span className="st-visually-hidden"> (unread)</span>}
                      </span>
                      <span className="st-alert-message">{alert.message}</span>
                    </span>
                    <span className="st-alert-time">{alert.timestamp}</span>
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

export default Staff_Alerts;
