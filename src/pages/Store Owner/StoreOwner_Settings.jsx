// src/pages/Store Owner/StoreOwner_Settings.jsx
// Notification preferences (opened from the avatar menu → Settings)
import { useEffect, useState } from "react";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Settings.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Events and the channels each one supports. A channel set to null is "Not available".
// Mock data — replace with the owner's saved preferences from the API
const EVENTS = [
  { id: "lowStock", label: "Low stock" },
  { id: "supplierQuote", label: "New supplier quote" },
  { id: "procurementUpdates", label: "Procurement request updates" },
  { id: "announcements", label: "System announcements" },
];

const CHANNELS = [
  { id: "app", label: "In the app" },
  { id: "email", label: "By email" },
];

const DEFAULT_PREFERENCES = {
  lowStock: { app: true, email: true },
  supplierQuote: { app: true, email: false },
  procurementUpdates: { app: null, email: true },
  announcements: { app: true, email: null },
};

const TOAST_MS = 3000;

const samePreferences = (a, b) =>
  EVENTS.every((event) => CHANNELS.every((channel) => a[event.id][channel.id] === b[event.id][channel.id]));

// On / Off pill switch
const Toggle = ({ checked, onChange, label }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    className={`ns-toggle${checked ? " on" : ""}`}
    onClick={() => onChange(!checked)}
  >
    {checked ? "On" : "Off"}
  </button>
);

const StoreOwner_Settings = () => {
  const [saved, setSaved] = useState(DEFAULT_PREFERENCES);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [toast, setToast] = useState("");

  const isDirty = !samePreferences(preferences, saved);

  // Hide the success message after a few seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const setPreference = (eventId, channelId, value) => {
    setPreferences((current) => ({
      ...current,
      [eventId]: { ...current[eventId], [channelId]: value },
    }));
  };

  const handleSave = () => {
    // TODO: save the notification preferences with the API
    setSaved(preferences);
    setToast("Your notification preferences were saved.");
  };

  return (
    <div className="so-layout">
      {/* =========================================
          SIDEBAR
          ========================================= */}
      <StoreOwnerSidebar notificationCount={3} />

      {/* =========================================
          MAIN CONTENT
          ========================================= */}
      <main className="so-main">
        {/* Page header: title, store selector, user menu */}
        <header className="so-header">
          <h1 className="so-page-title">Settings</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Notification preferences card */}
        <section className="ns-card" aria-labelledby="ns-title">
          <h2 id="ns-title" className="ns-title">Notification preferences</h2>
          <p className="ns-subtitle">Choose how you hear about each event.</p>

          <div className="ns-table-wrapper">
            <table className="ns-table">
              <thead>
                <tr>
                  <th scope="col">Event</th>
                  {CHANNELS.map((channel) => (
                    <th key={channel.id} scope="col">{channel.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {EVENTS.map((event) => (
                  <tr key={event.id}>
                    <th scope="row">{event.label}</th>
                    {CHANNELS.map((channel) => {
                      const value = preferences[event.id][channel.id];
                      return (
                        <td key={channel.id}>
                          {value === null ? (
                            <span className="ns-unavailable">Not available</span>
                          ) : (
                            <Toggle
                              checked={value}
                              label={`${event.label} ${channel.label.toLowerCase()}`}
                              onChange={(next) => setPreference(event.id, channel.id, next)}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="button" className="ns-save" onClick={handleSave} disabled={!isDirty}>
            Save preferences
          </button>
        </section>
      </main>

      {/* Success message */}
      {toast && (
        <div className="ns-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};

export default StoreOwner_Settings;
