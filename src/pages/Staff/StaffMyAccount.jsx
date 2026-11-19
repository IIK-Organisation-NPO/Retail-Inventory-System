import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import { STAFF_STORE } from "../../data/stores";
import "../../Style/Staff/StaffMyAccount.css";

const StaffMyAccount = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    name: "Lindiwe",
    surname: "Ngcobo",
    mobile: "082 000 0011",
  });
  const [notifications, setNotifications] = useState({
    lowStock: true,
    announcements: true,
  });
  const [saved, setSaved] = useState(false);

  const updateProfile = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
  };

  const toggleNotification = (setting) => {
    setNotifications((current) => ({ ...current, [setting]: !current[setting] }));
  };

  return (
    <div className="app-layout staff-account-layout">
      <Staff_Sidebar alertCount={3} />

      <main className="staff-account-main">
        <header className="staff-account-header">
          <h1>My account</h1>
          <div className="staff-account-header-actions">
            <span className="sync-status">Synced 2 min ago</span>
            <button
              type="button"
              className="staff-account-signout"
              onClick={() => navigate("/login/store-owner-staff", { replace: true })}
            >
              Sign out
            </button>
            <StoreOwner_StoreSwitcher stores={[STAFF_STORE]} readOnly />
            <StoreOwner_UserMenu
              name={`${profile.name} ${profile.surname}`.trim()}
              role="Cashier"
              accountPath="/staff/account"
              accountLabel="My account"
              showSettings={false}
            />
          </div>
        </header>

        <div className="staff-account-grid">
          <section className="staff-account-card staff-profile-card">
            <div className="staff-profile-heading">
              <div className="staff-account-avatar">
                {`${profile.name[0] ?? ""}${profile.surname[0] ?? ""}`.toUpperCase()}
              </div>
              <div className="staff-profile-name">
                <h2>{`${profile.name} ${profile.surname}`.trim()}</h2>
                <p>Cashier</p>
              </div>
              <button
                type="button"
                className="staff-account-close"
                aria-label="Return to home"
                onClick={() => navigate("/staff")}
              >
                ×
              </button>
            </div>

            <form
              className="staff-account-form"
              onSubmit={(event) => {
                event.preventDefault();
                setSaved(true);
              }}
            >
              <h3>Personal details</h3>
              <div className="staff-account-name-fields">
                <label>
                  Name
                  <input value={profile.name} onChange={updateProfile("name")} />
                </label>
                <label>
                  Surname
                  <input value={profile.surname} onChange={updateProfile("surname")} />
                </label>
              </div>
              <label className="staff-account-mobile">
                Mobile number
                <input
                  type="tel"
                  value={profile.mobile}
                  onChange={updateProfile("mobile")}
                />
              </label>
              <div className="staff-account-detail-row">
                <span>Role</span>
                <strong>Store Staff</strong>
              </div>
              <div className="staff-account-detail-row">
                <span>Store</span>
                <strong>{STAFF_STORE.name}</strong>
              </div>
              <div className="staff-account-save-row">
                <span>{saved ? "Your details have been saved." : "Update your name or mobile number."}</span>
                <button type="submit">Save</button>
              </div>
            </form>
          </section>

          <div className="staff-account-side">
            <section className="staff-account-card staff-account-secret">
              <div className="staff-account-card-heading">
                <h2>Secret code</h2>
                <span>Owner managed</span>
              </div>
              <p>To change your secret code, contact the store owner.</p>
              <p className="staff-account-muted">
                Only the store owner can change this code. You can still update your personal details here.
              </p>
            </section>

            <section className="staff-account-card staff-account-notifications">
              <h2>Notifications</h2>
              <button type="button" onClick={() => toggleNotification("lowStock")}>
                <span>Low stock alerts</span>
                <span className={`staff-account-toggle${notifications.lowStock ? " is-on" : ""}`}>
                  {notifications.lowStock ? "On" : "Off"}
                </span>
              </button>
              <button type="button" onClick={() => toggleNotification("announcements")}>
                <span>System announcements</span>
                <span className={`staff-account-toggle${notifications.announcements ? " is-on" : ""}`}>
                  {notifications.announcements ? "On" : "Off"}
                </span>
              </button>
            </section>

            <section className="staff-account-card staff-account-sync">
              <h2>Sync</h2>
              <p>Last synced 2 minutes ago. Nothing waiting.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffMyAccount;
