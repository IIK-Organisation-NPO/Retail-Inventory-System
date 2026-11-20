// src/pages/Store Owner/StoreOwner_Settings.jsx
import { useEffect, useState } from "react";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Settings.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Events and the channels each one supports. A channel set to null is "Not available".
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

// Used as a fallback if the database is empty or fails to load
const DEFAULT_PREFERENCES = {
  lowStock: { app: true, email: true },
  supplierQuote: { app: true, email: false },
  procurementUpdates: { app: null, email: true },
  announcements: { app: true, email: null },
};

const TOAST_MS = 3000;

const samePreferences = (a, b) =>
  EVENTS.every((event) => CHANNELS.every((channel) => a[event.id]?.[channel.id] === b[event.id]?.[channel.id]));

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
  
  // Network state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  // --- 1. FETCH SETTINGS FROM BACKEND ---
  useEffect(() => {
    const fetchSettings = async () => {
      if (!token) return;
      
      try {
        const response = await fetch("http://localhost:5000/api/settings", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
          setSaved(data);
          setPreferences(data);
        }
      } catch (err) {
        setError("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [token]);

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

  // --- 2. SAVE SETTINGS TO BACKEND ---
  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(preferences)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save preferences");

      setSaved(preferences);
      setToast("Your notification preferences were saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="so-layout">
        <StoreOwnerSidebar />
        <main className="so-main" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p>Loading settings...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="so-layout">
      <StoreOwnerSidebar notificationCount={3} />

      <main className="so-main">
        <header className="so-header">
          <h1 className="so-page-title">Settings</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        <section className="ns-card" aria-labelledby="ns-title">
          <h2 id="ns-title" className="ns-title">Notification preferences</h2>
          <p className="ns-subtitle">Choose how you hear about each event.</p>

          {error && (
            <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>
              {error}
            </div>
          )}

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
                      const value = preferences[event.id]?.[channel.id];
                      return (
                        <td key={channel.id}>
                          {value === null ? (
                            <span className="ns-unavailable">Not available</span>
                          ) : (
                            <Toggle
                              checked={!!value}
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

          <button 
            type="button" 
            className="ns-save" 
            onClick={handleSave} 
            disabled={!isDirty || saving}
          >
            {saving ? "Saving..." : "Save preferences"}
          </button>
        </section>
      </main>

      {toast && (
        <div className="ns-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};

export default StoreOwner_Settings;