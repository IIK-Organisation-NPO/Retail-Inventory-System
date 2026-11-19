// src/pages/Store Owner/StoreOwnerNotifications.jsx
import { useState, useEffect } from "react";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Store Owner/StoreOwnerNotifications.css";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

// "2023-11-13T08:00:00.000Z" -> "13 Nov, 08:00"
const formatTimestamp = (isoString) => {
  const d = new Date(isoString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Assign dot colors based on the notification type
const getDotColor = (type) => {
  if (type === "stock") return "red";
  if (type === "quotes") return "blue";
  return "black"; // system
};

const Notifications = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  
  // Real Data State
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // --- 1. FETCH NOTIFICATIONS ON LOAD ---
  const fetchNotifications = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to load notifications");

      // Map DB columns to the frontend's expected structure
      const formatted = data.map((n) => ({
        id: n.NotificationID,
        type: n.Type,
        title: n.Title,
        message: n.Message,
        timestamp: formatTimestamp(n.CreatedAt),
        dotColor: getDotColor(n.Type),
        read: Boolean(n.IsRead)
      }));

      setNotifications(formatted);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchNotifications();
  }, [token]);

  // --- 2. MARK ALL AS READ ---
  const markAllAsRead = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications/mark-read", {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (response.ok) {
        // Update local state instantly so the UI feels responsive
        setNotifications((currentNotifications) =>
          currentNotifications.map((notification) => ({ ...notification, read: true }))
        );
      }
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  // --- Helpers for UI ---
  const visibleNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((notification) => notification.type === activeFilter);
      
  const hasUnreadNotifications = notifications.some((notification) => !notification.read);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div style={{ padding: '50px' }}>Loading notifications...</div>;

  return (
    <div className="app-layout">
      {/* Pass the dynamic unread count to the sidebar badge */}
      <StoreOwnerSidebar notificationCount={unreadCount} />

      <main className="main-content">
        
        {/* Page Header */}
        <header className="page-header">
          <h1 className="page-title">Notifications</h1>
          
          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            
            <button
              type="button"
              className="btn-outline mark-read-btn"
              onClick={markAllAsRead}
              disabled={!hasUnreadNotifications}
            >
              Mark all as read
            </button>
            <StoreOwner_UserMenu />
          </div>
        </header>

        {error && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
            {error}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="notification-tabs">
          <button
            type="button"
            className={`tab-btn${activeFilter === "all" ? " active" : ""}`}
            aria-pressed={activeFilter === "all"}
            onClick={() => setActiveFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`tab-btn${activeFilter === "stock" ? " active" : ""}`}
            aria-pressed={activeFilter === "stock"}
            onClick={() => setActiveFilter("stock")}
          >
            Stock
          </button>
          <button
            type="button"
            className={`tab-btn${activeFilter === "quotes" ? " active" : ""}`}
            aria-pressed={activeFilter === "quotes"}
            onClick={() => setActiveFilter("quotes")}
          >
            Quotes
          </button>
          <button
            type="button"
            className={`tab-btn${activeFilter === "system" ? " active" : ""}`}
            aria-pressed={activeFilter === "system"}
            onClick={() => setActiveFilter("system")}
          >
            System
          </button>
        </div>

        {/* Notifications List Card */}
        <div className="card notifications-card">
          <div className="notifications-list">
            {visibleNotifications.length === 0 ? (
              <p className="notifications-empty" style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                No notifications in this category.
              </p>
            ) : (
              visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item${notification.read ? " is-read" : ""}`}
                >
                  {/* Left side: Dot + Content */}
                  <div className="notification-content-wrapper">
                    <div className={`status-dot bg-${notification.dotColor}`}></div>
                    <div className="notification-content">
                      <h4 className="notification-title">{notification.title}</h4>
                      <p className="notification-message">{notification.message}</p>
                    </div>
                  </div>

                  {/* Right side: Timestamp */}
                  <div className="notification-time">
                    {notification.timestamp}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default Notifications;