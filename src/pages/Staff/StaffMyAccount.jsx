// src/pages/Staff/StaffMyAccount.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Staff_Sidebar from "../../components/Staff/Staff_Sidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Staff/StaffMyAccount.css";

const StaffMyAccount = () => {
  const navigate = useNavigate();
  
  // Data State
  const [profile, setProfile] = useState({ name: "", surname: "", mobile: "", role: "Cashier" });
  const [storeName, setStoreName] = useState("My Store");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  // Local UI state for notifications (Not yet connected to DB)
  const [notifications, setNotifications] = useState({
    lowStock: true,
    announcements: true,
  });

  const storeId = localStorage.getItem("activeStoreId") || 1;
  const token = localStorage.getItem("token");

  // --- 1. FETCH PROFILE AND STORE DETAILS ON LOAD ---
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        navigate("/login/store-owner-staff");
        return;
      }

      try {
        const headers = { "Authorization": `Bearer ${token}` };

        // Fetch Staff Profile
        const res = await fetch("http://localhost:5000/api/staff/profile", { headers });
        const data = await res.json();
        
        if (res.ok) {
          setProfile({
            name: data.Name,
            surname: data.Surname,
            mobile: data.MobileNumber,
            role: data.Role
          });
        }

        // Fetch Store Name (to display in the UI)
        const storeRes = await fetch("http://localhost:5000/api/stores/my-stores", { headers });
        const storeData = await storeRes.json();
        if (storeRes.ok && storeData.length > 0) {
          const currentStore = storeData.find(s => s.StoreID === Number(storeId));
          if (currentStore) setStoreName(currentStore.StoreName);
        }

      } catch (err) {
        setError("Failed to load profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, token, navigate]);

  const updateProfile = (field) => (event) => {
    setProfile((current) => ({ ...current, [field]: event.target.value }));
    setSaved(false);
  };

  const toggleNotification = (setting) => {
    setNotifications((current) => ({ ...current, [setting]: !current[setting] }));
  };

  // --- 2. SAVE PROFILE TO BACKEND ---
  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);

    try {
      const response = await fetch("http://localhost:5000/api/staff/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          surname: profile.surname,
          mobile: profile.mobile
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update profile");

      setSaved(true);
      // Update local storage so the header name changes immediately
      localStorage.setItem("userName", `${profile.name} ${profile.surname}`);

    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- 3. HANDLE SIGN OUT ---
  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("activeStoreId");
    navigate("/login/store-owner-staff", { replace: true });
  };

  if (loading) return <div style={{ padding: '50px' }}>Loading account...</div>;

  return (
    <div className="app-layout staff-account-layout">
      <Staff_Sidebar alertCount={3} />

      <main className="staff-account-main">
        <header className="staff-account-header">
          <h1>My account</h1>
          <div className="staff-account-header-actions">
            <span className="sync-status">Synced just now</span>
            <button
              type="button"
              className="staff-account-signout"
              onClick={handleSignOut}
            >
              Sign out
            </button>
            {/* Pass readOnly so they can't switch stores */}
            <StoreOwner_StoreSwitcher readOnly />
            <StoreOwner_UserMenu
              name={`${profile.name} ${profile.surname}`.trim()}
              role={profile.role}
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
                <p>{profile.role}</p>
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

            <form className="staff-account-form" onSubmit={handleSave}>
              <h3>Personal details</h3>
              
              {error && <p style={{ color: 'red', marginBottom: '10px' }}>{error}</p>}

              <div className="staff-account-name-fields">
                <label>
                  Name
                  <input value={profile.name} onChange={updateProfile("name")} required />
                </label>
                <label>
                  Surname
                  <input value={profile.surname} onChange={updateProfile("surname")} required />
                </label>
              </div>
              <label className="staff-account-mobile">
                Mobile number
                <input
                  type="tel"
                  value={profile.mobile}
                  onChange={updateProfile("mobile")}
                  required
                />
              </label>
              <div className="staff-account-detail-row">
                <span>Role</span>
                <strong>{profile.role}</strong>
              </div>
              <div className="staff-account-detail-row">
                <span>Store</span>
                <strong>{storeName}</strong>
              </div>
              <div className="staff-account-save-row">
                <span>{saved ? "Your details have been saved." : "Update your name or mobile number."}</span>
                <button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </button>
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
              <p>Last synced just now. Nothing waiting.</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffMyAccount;