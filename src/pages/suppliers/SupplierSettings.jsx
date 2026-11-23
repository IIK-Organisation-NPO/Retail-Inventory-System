import { useState } from "react";
import { Link } from "react-router-dom";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import "../../Style/components/Supplier/SupplierDashboard.css";
import "../../Style/components/Supplier/SupplierSettings.css";

const INITIAL_PREFERENCES = [
  { event: "New demand request", inApp: true, email: true },
  { event: "Quotation accepted or declined", inApp: true, email: true },
  { event: "Order to confirm", inApp: true, email: true },
  { event: "System announcements", inApp: true, email: null },
];

const SupplierSettings = () => {
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

  return (
    <div className="supplier-dashboard-layout">
      <SupplierSidebar />

      <main className="supplier-dashboard-main supplier-settings-main">
        <header className="supplier-dashboard-header">
          <h1>Settings</h1>
          <div className="supplier-dashboard-account">
            <Link
              to="/supplier/company-profile"
              className="supplier-company-pill"
              aria-label="Tiger Brands Ltd company profile"
            >
              <span className="supplier-company-initials" aria-hidden="true">TB</span>
              <span>Tiger Brands Ltd</span>
            </Link>
            <SupplierUserMenu />
          </div>
        </header>

        <section className="supplier-settings-card">
          <h2>Notification preferences</h2>
          <p>Choose how you hear about each event.</p>
          <div className="supplier-settings-table-scroll">
            <table className="supplier-settings-table">
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
                        className={`supplier-settings-toggle${preference.inApp ? " on" : ""}`}
                        aria-label={`${preference.event} in the app: ${preference.inApp ? "On" : "Off"}`}
                        aria-pressed={preference.inApp}
                        onClick={() => togglePreference(preference.event, "inApp")}
                      >
                        {preference.inApp ? "On" : "Off"}
                      </button>
                    </td>
                    <td>
                      {preference.email === null ? (
                        <span className="supplier-settings-unavailable">Not available</span>
                      ) : (
                        <button
                          type="button"
                          className={`supplier-settings-toggle${preference.email ? " on" : ""}`}
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

          <div className="supplier-settings-actions">
            <button
              type="button"
              className="supplier-settings-save"
              onClick={() => setFeedback("Preferences saved for this session.")}
            >
              Save preferences
            </button>
            {feedback && <p role="status">{feedback}</p>}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SupplierSettings;
