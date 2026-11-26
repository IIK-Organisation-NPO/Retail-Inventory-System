import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../../components/Admin/AdminSidebar";
import AdminUserMenu from "../../components/Admin/AdminUserMenu";
import "../../Style/Admin/AdminProfile.css";

const API_URL = "http://localhost:5000/api/admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^0\d{9}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

const errorStyle = { color: "#d32f2f", fontSize: "13px", margin: "4px 0 0" };
const successStyle = { color: "#2e7d32", fontSize: "14px" };

const normaliseMobile = (value) => {
  let m = String(value || "").replace(/[\s\-()]/g, "");
  if (m.startsWith("+27")) m = "0" + m.slice(3);
  return m;
};

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const EMPTY_PASSWORDS = { currentPassword: "", newPassword: "", confirmPassword: "" };

const AdminProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState({ email: "", mobile: "" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [feedback, setFeedback] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordFormError, setPasswordFormError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/profile`, { headers: authHeaders() });
        const data = await res.json();
        if (!res.ok) {
          setLoadError(data.message || "Could not load your profile.");
          return;
        }
        setProfile(data);
        setDraft({ email: data.email, mobile: data.mobile });
      } catch {
        setLoadError("Could not reach the server. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setFormError("");
    setFeedback("");
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    const email = draft.email.trim();
    const mobile = normaliseMobile(draft.mobile);

    const errors = {};
    if (!email) errors.email = "Enter your email address.";
    else if (!EMAIL_REGEX.test(email)) errors.email = "Enter a valid email address.";
    if (!mobile) errors.mobile = "Enter your mobile number.";
    else if (!MOBILE_REGEX.test(mobile)) {
      errors.mobile = "Enter a valid 10-digit mobile number, e.g. 0820000000.";
    }

    setFieldErrors(errors);
    setFormError("");
    setFeedback("");
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ email, mobile }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setFieldErrors(data.errors);
        else setFormError(data.message || "Could not save your profile.");
        return;
      }

      setProfile(data.profile);
      setDraft({ email: data.profile.email, mobile: data.profile.mobile });

      if (data.emailChanged) {
        // Email changed: the admin must verify the new address again.
        // Change "/verify-email" to your real verify-email page route.
        navigate("/verify-email", { state: { email: data.profile.email } });
        return;
      }
      setFeedback("Profile saved.");
    } catch {
      setFormError("Could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const cancelChanges = () => {
    if (!profile) return;
    setDraft({ email: profile.email, mobile: profile.mobile });
    setFieldErrors({});
    setFormError("");
    setFeedback("");
  };

  const openPasswordModal = () => {
    setPasswords(EMPTY_PASSWORDS);
    setPasswordErrors({});
    setPasswordFormError("");
    setPasswordSuccess("");
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswords(EMPTY_PASSWORDS);
    setPasswordErrors({});
    setPasswordFormError("");
  };

  const updatePassword = (field, value) => {
    setPasswords((current) => ({ ...current, [field]: value }));
    setPasswordErrors((current) => ({ ...current, [field]: "" }));
    setPasswordFormError("");
  };

  const submitPassword = async (event) => {
    event.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwords;

    const errors = {};
    if (!currentPassword) errors.currentPassword = "Enter your current password.";
    if (!newPassword) errors.newPassword = "Enter a new password.";
    else if (!PASSWORD_REGEX.test(newPassword)) {
      errors.newPassword =
        "Use at least 8 characters with an uppercase letter, a lowercase letter and a number.";
    } else if (currentPassword && newPassword === currentPassword) {
      errors.newPassword = "The new password must be different from your current password.";
    }
    if (!confirmPassword) errors.confirmPassword = "Confirm your new password.";
    else if (newPassword && confirmPassword !== newPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    setPasswordErrors(errors);
    setPasswordFormError("");
    if (Object.keys(errors).length > 0) return;

    setPasswordSaving(true);
    try {
      const res = await fetch(`${API_URL}/change-password`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(passwords),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setPasswordErrors(data.errors);
        else setPasswordFormError(data.message || "Could not change your password.");
        return;
      }

      closePasswordModal();
      setPasswordSuccess("Password changed successfully.");
    } catch {
      setPasswordFormError("Could not reach the server. Please try again.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const initials = profile
    ? `${(profile.name || "").charAt(0)}${(profile.surname || "").charAt(0)}`.toUpperCase()
    : "";

  return (
    <div className="admin-profile-layout">
      <AdminSidebar />

      <main className="admin-profile-main">
        <header className="admin-profile-header">
          <h1>Profile</h1>
          <AdminUserMenu />
        </header>

        {loading && <p role="status">Loading your profile...</p>}
        {!loading && loadError && <p style={errorStyle} role="alert">{loadError}</p>}

        {!loading && profile && (
          <form className="admin-profile-card" onSubmit={saveProfile} noValidate>
            <div className="admin-profile-identity">
              <span className="admin-profile-initials" aria-hidden="true">{initials}</span>
              <div>
                <h2>{profile.fullName}</h2>
                <p>{profile.role}</p>
              </div>
            </div>

            <div className="admin-profile-fields">
              <label>
                <span>Full name</span>
                <input value={profile.fullName} readOnly />
              </label>
              <label>
                <span>Role</span>
                <input value={profile.role} readOnly />
              </label>
              <label>
                <span>Email address</span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) => updateDraft("email", event.target.value)}
                />
                {fieldErrors.email && <p style={errorStyle} role="alert">{fieldErrors.email}</p>}
              </label>
              <label>
                <span>Mobile number</span>
                <input
                  type="tel"
                  value={draft.mobile}
                  onChange={(event) => updateDraft("mobile", event.target.value)}
                />
                {fieldErrors.mobile && <p style={errorStyle} role="alert">{fieldErrors.mobile}</p>}
              </label>
            </div>

            <div className="admin-profile-password-row">
              <button type="button" className="admin-profile-password-link" onClick={openPasswordModal}>
                Change password
              </button>
            </div>

            {passwordSuccess && <p style={successStyle} role="status">{passwordSuccess}</p>}
            {formError && <p style={errorStyle} role="alert">{formError}</p>}
            {feedback && <p className="admin-profile-feedback" role="status">{feedback}</p>}

            <div className="admin-profile-actions">
              <button type="submit" className="admin-profile-save" disabled={saving}>
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" className="admin-profile-cancel" onClick={cancelChanges}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {showPasswordModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Change password"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <form
              onSubmit={submitPassword}
              noValidate
              style={{
                background: "#fff",
                borderRadius: "12px",
                padding: "24px",
                width: "100%",
                maxWidth: "400px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              }}
            >
              <h2 style={{ margin: 0 }}>Change password</h2>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>Current password</span>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(event) => updatePassword("currentPassword", event.target.value)}
                  autoComplete="current-password"
                />
                {passwordErrors.currentPassword && (
                  <p style={errorStyle} role="alert">{passwordErrors.currentPassword}</p>
                )}
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>New password</span>
                <input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(event) => updatePassword("newPassword", event.target.value)}
                  autoComplete="new-password"
                />
                {passwordErrors.newPassword && (
                  <p style={errorStyle} role="alert">{passwordErrors.newPassword}</p>
                )}
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span>Confirm new password</span>
                <input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(event) => updatePassword("confirmPassword", event.target.value)}
                  autoComplete="new-password"
                />
                {passwordErrors.confirmPassword && (
                  <p style={errorStyle} role="alert">{passwordErrors.confirmPassword}</p>
                )}
              </label>

              {passwordFormError && <p style={errorStyle} role="alert">{passwordFormError}</p>}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" className="admin-profile-cancel" onClick={closePasswordModal}>
                  Cancel
                </button>
                <button type="submit" className="admin-profile-save" disabled={passwordSaving}>
                  {passwordSaving ? "Saving..." : "Change password"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminProfile;