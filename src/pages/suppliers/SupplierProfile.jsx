import { useState } from "react";
import { Link } from "react-router-dom";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import StoreOwner_ChangePassword_popup from "../../components/Store Owner/StoreOwner_ChangePassword_popup";
import "../../Style/components/Supplier/SupplierDashboard.css";
import "../../Style/components/Supplier/SupplierProfile.css";

const INITIAL_PROFILE = {
  name: "Nandi Mokoena",
  role: "Supplier",
  email: "nandi@tigerbrands.example",
  mobile: "082 000 0030",
};

const SupplierProfile = () => {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [draft, setDraft] = useState(INITIAL_PROFILE);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const [isPasswordPopupOpen, setIsPasswordPopupOpen] = useState(false);

  const updateField = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFeedback("");
    setError("");
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const updatedProfile = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      mobile: draft.mobile.trim(),
    };

    if (!updatedProfile.name) {
      setError("Enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedProfile.email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!/^0\d{9}$/.test(updatedProfile.mobile.replace(/\s+/g, ""))) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setProfile(updatedProfile);
    setDraft(updatedProfile);
    setError("");
    setFeedback("Your changes have been saved for this session.");
  };

  const cancelChanges = () => {
    setDraft(profile);
    setError("");
    setFeedback("");
  };

  return (
    <div className="supplier-dashboard-layout">
      <SupplierSidebar />

      <main className="supplier-dashboard-main supplier-profile-main">
        <header className="supplier-dashboard-header">
          <h1>Profile</h1>
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

        <form className="supplier-profile-card" onSubmit={saveProfile}>
          <div className="supplier-profile-identity">
            <span className="supplier-profile-initials" aria-hidden="true">
              {profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("")}
            </span>
            <div>
              <h2>{profile.name}</h2>
              <p>{profile.role}</p>
            </div>
          </div>

          <div className="supplier-profile-fields">
            <label>
              <span>Full name</span>
              <input
                required
                autoComplete="name"
                value={draft.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
            <label>
              <span>Role</span>
              <input value={draft.role} readOnly />
            </label>
            <label>
              <span>Email address</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={draft.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>
            <label>
              <span>Mobile number</span>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={draft.mobile}
                onChange={(event) => updateField("mobile", event.target.value)}
              />
            </label>
          </div>

          <div className="supplier-profile-password-row">
            <button
              type="button"
              className="supplier-profile-password-link"
              onClick={() => setIsPasswordPopupOpen(true)}
            >
              Change password
            </button>
          </div>

          {error && <p className="supplier-profile-error" role="alert">{error}</p>}
          {feedback && <p className="supplier-profile-feedback" role="status">{feedback}</p>}

          <div className="supplier-profile-actions">
            <button type="submit" className="supplier-profile-save">Save changes</button>
            <button type="button" className="supplier-profile-cancel" onClick={cancelChanges}>Cancel</button>
          </div>
        </form>
      </main>

      {isPasswordPopupOpen && (
        <StoreOwner_ChangePassword_popup
          onSave={() => setFeedback("Password changes are not connected in this demo.")}
          onClose={() => setIsPasswordPopupOpen(false)}
        />
      )}
    </div>
  );
};

export default SupplierProfile;
