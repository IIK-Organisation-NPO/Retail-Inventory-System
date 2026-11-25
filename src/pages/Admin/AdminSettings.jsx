import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminSettings.css";

const INITIAL_PREFERENCES = [
  { event: "New store application", inApp: true, email: true },
  { event: "New supplier application", inApp: true, email: true },
  { event: "Sync problems", inApp: true, email: false },
  { event: "System announcements sent", inApp: true, email: null },
];

const AdminSettings = () => {
  const [preferences, setPreferences] = useState(INITIAL_PREFERENCES);
  const [feedback, setFeedback] = useState("");

  const togglePreference = (eventName, channel) => {
    setPreferences((current) => current.map((preference) => (
      preference.event === eventName
        ? { ...preference, [channel]: !preference[channel] }
        : preference
    )));
    setFeedback("");
  };

  const savePreferences = () => setFeedback("Preferences saved for this session.");

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
                  <tr key={preference.event}>
                    <td>{preference.event}</td>
                    <td>
                      <button
                        type="button"
                        className={`admin-settings-toggle${preference.inApp ? " on" : ""}`}
                        aria-label={`${preference.event} in the app: ${preference.inApp ? "On" : "Off"}`}
                        aria-pressed={preference.inApp}
                        onClick={() => togglePreference(preference.event, "inApp")}
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
                          onClick={() => togglePreference(preference.event, "email")}
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

          <div className="admin-settings-actions">
            <button type="button" className="admin-settings-save" onClick={savePreferences}>
              Save preferences
            </button>
            {feedback && <p role="status">{feedback}</p>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminSettings;
