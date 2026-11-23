import { useState } from "react";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminProfile.css";

const INITIAL_PROFILE = {
  name: "IIK Administrator",
  role: "Administrator",
  email: "admin@iik.co.za",
  mobile: "082 000 0000",
};

const AdminProfile = () => {
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [draft, setDraft] = useState(INITIAL_PROFILE);
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState(false);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFeedback("");
    setFormError("");
  };

  const saveProfile = (event) => {
    event.preventDefault();
    const updatedProfile = {
      ...draft,
      name: draft.name.trim(),
      email: draft.email.trim(),
      mobile: draft.mobile.trim(),
    };
    if (!updatedProfile.name || !updatedProfile.email || !updatedProfile.mobile) {
      setFormError("Enter a name, valid email address and mobile number.");
      return;
    }

    setProfile(updatedProfile);
    setDraft(updatedProfile);
    setFormError("");
    setFeedback("Profile saved for this session.");
  };

  const cancelChanges = () => {
    setDraft(profile);
    setFeedback("");
    setFormError("");
  };

  return (
    <div className="admin-profile-layout">
      <AdminSidebar />

      <main className="admin-profile-main">
        <header className="admin-profile-header">
          <h1>Profile</h1>
          <AdminUserMenu />
        </header>

        <form className="admin-profile-card" onSubmit={saveProfile}>
          <div className="admin-profile-identity">
            <span className="admin-profile-initials" aria-hidden="true">IA</span>
            <div>
              <h2>{profile.name}</h2>
              <p>{profile.role}</p>
            </div>
          </div>

          <div className="admin-profile-fields">
            <label>
              <span>Full name</span>
              <input
                required
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
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
                value={draft.email}
                onChange={(event) => updateDraft("email", event.target.value)}
              />
            </label>
            <label>
              <span>Mobile number</span>
              <input
                required
                type="tel"
                value={draft.mobile}
                onChange={(event) => updateDraft("mobile", event.target.value)}
              />
            </label>
          </div>

          <div className="admin-profile-password-row">
            <button type="button" className="admin-profile-password-link" onClick={() => setPasswordNotice(true)}>
              Change password
            </button>
          </div>

          {passwordNotice && (
            <p className="admin-profile-password-note" role="status">
              Password changes are not connected to authentication yet.
            </p>
          )}
          {formError && <p className="admin-profile-error" role="alert">{formError}</p>}
          {feedback && <p className="admin-profile-feedback" role="status">{feedback}</p>}

          <div className="admin-profile-actions">
            <button type="submit" className="admin-profile-save">Save changes</button>
            <button type="button" className="admin-profile-cancel" onClick={cancelChanges}>Cancel</button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AdminProfile;
