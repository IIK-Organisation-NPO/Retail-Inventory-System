import { useState } from "react";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Store Owner/StoreOwnerNotifications.css";

const Notifications = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "stock",
      title: "Low stock",
      message: "Rama Margarine 500g is out of stock",
      timestamp: "13 Nov, 08:00",
      dotColor: "red",
      read: false,
    },
    {
      id: 2,
      type: "stock",
      title: "Low stock",
      message: "Albany Superior White Bread is below reorder level (12 of 15)",
      timestamp: "13 Nov, 08:00",
      dotColor: "red",
      read: false,
    },
    {
      id: 3,
      type: "quotes",
      title: "New supplier quote",
      message: "Tiger Brands Ltd quoted for Ace Maize Meal 2.5kg",
      timestamp: "13 Nov, 07:30",
      dotColor: "blue",
      read: false,
    },
    {
      id: 4,
      type: "quotes",
      title: "New supplier quote",
      message: "Pioneer Foods quoted for Ace Maize Meal 2.5kg",
      timestamp: "12 Nov, 16:10",
      dotColor: "blue",
      read: false,
    },
    {
      id: 5,
      type: "system",
      title: "System announcement",
      message: "Welcome to the pilot. Please record every sale.",
      timestamp: "10 Nov, 09:00",
      dotColor: "black",
      read: false,
    },
  ]);
  const visibleNotifications =
    activeFilter === "all"
      ? notifications
      : notifications.filter((notification) => notification.type === activeFilter);
  const hasUnreadNotifications = notifications.some((notification) => !notification.read);

  const markAllAsRead = () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({ ...notification, read: true }))
    );
  };

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={3} />

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
              <p className="notifications-empty">No notifications in this category.</p>
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