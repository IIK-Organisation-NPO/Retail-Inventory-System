// src/pages/Staff/Staff_Alerts.jsx
import { useState, useEffect } from "react";
import "../../Style/Staff/Staff_Layout.css";
import "../../Style/Staff/Staff_Alerts.css";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

// "2026-11-13T09:00:00" -> "13 Nov, 09:00"
const formatTimestamp = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// "Mseleku Tuckshop" -> "MT"
const getInitials = (name) => {
  if (!name) return "ST";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");
};

const Staff_Alerts = () => {
  // Data State
  const [alerts, setAlerts] = useState([]);
  const [storeName, setStoreName] = useState("My Store");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName") || "Staff Member";

  // --- 1. FETCH ALERTS FROM BACKEND ---
  const fetchAlerts = async () => {
    try {
      const headers = { "Authorization": `Bearer ${token}` };

      // Fetch Notifications
      const response = await fetch(`http://localhost:5000/api/notifications?storeId=${storeId}`, { headers });
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || "Failed to load alerts");

      // Map DB columns to the UI structure
      const formatted = data.map((n) => ({
        id: n.NotificationID,
        type: n.Type, // 'stock' or 'system'
        title: n.Title,
        message: n.Message,
        timestamp: formatTimestamp(n.CreatedAt),
        read: Boolean(n.IsRead)
      }));
      
      setAlerts(formatted);

      // Fetch Store Name
      const storeRes = await fetch(`http://localhost:5000/api/stores/my-stores`, { headers });
      const storeData = await storeRes.json();
      if (storeRes.ok && storeData.length > 0) {
        const currentStore = storeData.find(s => s.StoreID === Number(storeId));
        if (currentStore) setStoreName(currentStore.StoreName);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAlerts();
  }, [storeId, token]);

  // --- 2. MARK AS READ HANDLERS ---
  const markAllAsRead = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/mark-read?storeId=${storeId}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        // Update local state instantly so UI reflects the change
        setAlerts((current) => current.map((alert) => ({ ...alert, read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/notifications/${id}/read`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        // Update local state instantly
        setAlerts((current) =>
          current.map((alert) => (alert.id === id ? { ...alert, read: true } : alert))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const unreadCount = alerts.filter((alert) => !alert.read).length;

  if (loading) return <div style={{ padding: '50px' }}>Loading alerts...</div>;

  return (
    <div className="st-layout">
      <Staff_Sidebar alertCount={unreadCount} />

      <main className="st-main">
        <header className="st-header">
          <h1 className="st-page-title">Alerts</h1>

          <div className="st-header-actions">
            <span className="st-sync">Synced just now</span>

            <button
              type="button"
              className="st-btn st-btn-outline"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark all as read
            </button>

            <div className="st-store-chip">
              <span className="st-avatar st-avatar-sm" aria-hidden="true">
                {getInitials(storeName)}
              </span>
              <span>{storeName}</span>
            </div>

            <StoreOwner_UserMenu
              name={userName}
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        {error && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {/* Alerts list */}
        <section className="st-alerts-card" aria-label="Alerts">
          {alerts.length === 0 ? (
            <p className="st-alerts-empty" style={{ textAlign: "center", padding: "20px" }}>
              You have no alerts.
            </p>
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