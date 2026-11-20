// src/pages/Store Owner/StoreOwner_Profile.jsx
// The signed-in store owner's personal details (opened from the avatar menu → Profile)
import { useCallback, useEffect, useState } from "react";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Profile.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_ChangePassword_popup from "../../components/Store Owner/StoreOwner_ChangePassword_popup";

// Mock data — replace with the signed-in user from the API
const OWNER = {
  name: "Sipho",
  surname: "Dlamini",
  email: "sipho@gmail.com",
  mobile: "0820000001",
  role: "Store Owner",
};

const TOAST_MS = 3000;

const digitsOnly = (value) => value.replace(/\D/g, "");

// "0820000001" -> "082 000 0001"
const formatMobile = (digits) => `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`.trim();

// "Sipho", "Dlamini" -> "SD"
const getInitials = (name, surname) => `${name.trim()[0] ?? ""}${surname.trim()[0] ?? ""}`.toUpperCase();

// Saved details -> what the form fields show
const toForm = (owner) => ({
  name: owner.name,
  surname: owner.surname,
  email: owner.email,
  mobile: formatMobile(owner.mobile),
});

const StoreOwner_Profile = () => {
  const [owner, setOwner] = useState(OWNER);
  const [form, setForm] = useState(() => toForm(OWNER));
  const [error, setError] = useState("");
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [toast, setToast] = useState("");

  // Only allow Save / Cancel once something has changed
  const isDirty =
    form.name.trim() !== owner.name ||
    form.surname.trim() !== owner.surname ||
    form.email.trim() !== owner.email ||
    digitsOnly(form.mobile) !== owner.mobile;

  // Hide the success message after a few seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const closePasswordPopup = useCallback(() => setShowPasswordPopup(false), []);

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Enter your name.";
    if (!form.surname.trim()) return "Enter your surname.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (!/^0\d{9}$/.test(digitsOnly(form.mobile))) return "Enter a valid 10-digit mobile number, e.g. 082 000 0000.";
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const saved = {
      ...owner,
      name: form.name.trim(),
      surname: form.surname.trim(),
      email: form.email.trim(),
      mobile: digitsOnly(form.mobile),
    };
    // TODO: save the owner's details with the API
    setOwner(saved);
    setForm(toForm(saved));
    setToast("Your profile was updated.");
  };

  const handleCancel = () => {
    setForm(toForm(owner));
    setError("");
  };

  const fullName = `${owner.name} ${owner.surname}`;

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
          <h1 className="so-page-title">Profile</h1>

          <div className="so-header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu name={fullName} role={owner.role} />
          </div>
        </header>

        {/* Profile details card */}
        <section className="pf-card" aria-labelledby="pf-name">
          {/* Who is signed in */}
          <div className="pf-identity">
            <span className="so-avatar pf-avatar" aria-hidden="true">
              {getInitials(owner.name, owner.surname)}
            </span>
            <div>
              <h2 id="pf-name" className="pf-name">{fullName}</h2>
              <p className="pf-role">{owner.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="pf-grid">
              <div className="pf-field">
                <label htmlFor="pf-first-name">Name</label>
                <input
                  id="pf-first-name"
                  type="text"
                  className="pf-input"
                  value={form.name}
                  onChange={update("name")}
                  autoComplete="given-name"
                />
              </div>

              <div className="pf-field">
                <label htmlFor="pf-surname">Surname</label>
                <input
                  id="pf-surname"
                  type="text"
                  className="pf-input"
                  value={form.surname}
                  onChange={update("surname")}
                  autoComplete="family-name"
                />
              </div>

              <div className="pf-field">
                <label htmlFor="pf-email">Email address</label>
                <input
                  id="pf-email"
                  type="email"
                  className="pf-input"
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                />
              </div>

              <div className="pf-field">
                <label htmlFor="pf-mobile">Mobile number</label>
                <input
                  id="pf-mobile"
                  type="tel"
                  inputMode="tel"
                  className="pf-input"
                  placeholder="082 000 0000"
                  value={form.mobile}
                  onChange={update("mobile")}
                  autoComplete="tel"
                />
              </div>
            </div>

            {/* Change password */}
            <div className="pf-password-row">
              <button type="button" className="so-link-btn" onClick={() => setShowPasswordPopup(true)}>
                Change password
              </button>
            </div>

            {error && <p className="pf-error" role="alert">{error}</p>}

            <div className="pf-actions">
              <button type="submit" className="pf-btn pf-btn-primary" disabled={!isDirty}>
                Save
              </button>
              <button type="button" className="pf-btn pf-btn-outline" onClick={handleCancel} disabled={!isDirty}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* =========================================
          CHANGE PASSWORD POPUP
          ========================================= */}
      {showPasswordPopup && (
        <StoreOwner_ChangePassword_popup
          onSave={() => setToast("Your password was changed.")}
          onClose={closePasswordPopup}
        />
      )}

      {/* Success message */}
      {toast && (
        <div className="pf-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};

export default StoreOwner_Profile;
