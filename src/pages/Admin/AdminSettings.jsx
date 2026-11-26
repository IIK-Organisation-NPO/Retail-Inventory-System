import { useEffect, useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminSettings.css";

const API_URL = "http://localhost:5000/api/admin";

const errorStyle = { color: "#d32f2f", fontSize: "13px", margin: "8px 0 0" };

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const AdminSettings = () => {
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const res = await fetch(`${API_URL}/settings/notifications`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.message || "Could not load your settings.");
          return;
        }
        setPreferences(data.preferences);
      } catch {
        setLoadError("Could not reach the server. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadPreferences();
  }, []);

  const togglePreference = (eventKey, channel) => {
    setPreferences((current) => current.map((preference) => (
      preference.key === eventKey
        ? { ...preference, [channel]: !preference[channel] }
        : preference
    )));
    setFeedback("");
    setSaveError("");
  };

  const savePreferences = async () => {
    setSaving(true);
    setSaveError("");
    setFeedback("");
    try {
      const res = await fetch(`${API_URL}/settings/notifications`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          preferences: preferences.map(({ key, inApp, email }) => ({ key, inApp, email })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.message || "Could not save your settings.");
        return;
      }
      setPreferences(data.preferences);
      setFeedback("Preferences saved.");
    } catch {
      setSaveError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-settings-layout">
      <AdminSidebar />

      <main className="admin-settings-main">
        <header className="admin-settings-header">
          <h1>Settings</h1>
          <AdminUserMenu />
        </header>

        <section className="admin-settings-card">
          <h2>Notification preferences</h2>

          {loading && <p role="status">Loading your settings...</p>}
          {!loading && loadError && <p style={errorStyle} role="alert">{loadError}</p>}

          {!loading && !loadError && (
            <>
              <div className="admin-settings-table-scroll">
                <table className="admin-settings-table">
                  <thead>
                    <tr>
                      <th scope="col">Event</th>
                      <th scope="col">In the app</th>
                      <th scope="col">By email</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preferences.map((preference) => (
                      <tr key={preference.key}>
                        <td>{preference.event}</td>
                        <td>
                          <button
                            type="button"
                            className={`admin-settings-toggle${preference.inApp ? " on" : ""}`}
                            aria-label={`${preference.event} in the app: ${preference.inApp ? "On" : "Off"}`}
                            aria-pressed={preference.inApp}
                            onClick={() => togglePreference(preference.key, "inApp")}
                          >
                            {preference.inApp ? "On" : "Off"}
                          </button>
                        </td>
                        <td>
                          {preference.email === null ? (
                            <span className="admin-settings-unavailable">Not available</span>
                          ) : (
                            <button
                              type="button"
                              className={`admin-settings-toggle${preference.email ? " on" : ""}`}
                              aria-label={`${preference.event} by email: ${preference.email ? "On" : "Off"}`}
                              aria-pressed={preference.email}
                              onClick={() => togglePreference(preference.key, "email")}
                            >
                              {preference.email ? "On" : "Off"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {saveError && <p style={errorStyle} role="alert">{saveError}</p>}

              <div className="admin-settings-actions">
                <button
                  type="button"
                  className="admin-settings-save"
                  onClick={savePreferences}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save preferences"}
                </button>
                {feedback && <p role="status">{feedback}</p>}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminSettings;