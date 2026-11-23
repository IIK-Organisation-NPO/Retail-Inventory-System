// src/pages/Store Owner/StoreOwner_Profile.jsx
// The signed-in store owner's personal details (opened from the avatar menu → Profile)
// Name and surname are read-only. Mobile number and email can be changed.
// Changing the email requires the new address to be verified again.
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../Style/Store Owner/StoreOwnerInventory.css";
import "../../Style/Store Owner/StoreOwner_Profile.css";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import StoreOwner_ChangePassword_popup from "../../components/Store Owner/StoreOwner_ChangePassword_popup";
import VerifyEmailModal from "../../components/common/VerifyEmailModal";

const API_URL = "http://localhost:5000/api/owner";
const LOGIN_ROUTE = "/login/store-owner-staff";
const TOAST_MS = 3000;

const digitsOnly = (value = "") => String(value).replace(/\D/g, "");

// "+27820000001" -> "0820000001" (safety net in case the server sends the +27 form)
const normaliseMobile = (value = "") => {
  let digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith("27")) digits = `0${digits.slice(2)}`;
  return digits;
};

// "0820000001" -> "082 000 0001"
const formatMobile = (value) => {
  const clean = normaliseMobile(value);
  if (!clean) return "";
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`.trim();
};

// "Sipho", "Dlamini" -> "SD"
const getInitials = (name = "", surname = "") => {
  return `${name.trim()[0] || ""}${surname.trim()[0] || ""}`.toUpperCase();
};

const StoreOwner_Profile = () => {
  const navigate = useNavigate();

  // State
  const [owner, setOwner] = useState({
    name: "", surname: "", email: "", mobile: "", emailVerified: true, role: "Store Owner",
  });
  // Only email and mobile can be edited
  const [form, setForm] = useState({ email: "", mobile: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState("");
  const [toast, setToast] = useState("");

  // Token expired / invalid: clear the saved login and send the person back to login
  const forceLogin = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userName");
    localStorage.removeItem("userSurname");
    navigate(LOGIN_ROUTE);
  }, [navigate]);

  // --- 1. FETCH PROFILE ON PAGE LOAD ---
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate(LOGIN_ROUTE);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.status === 401 || response.status === 403) {
          forceLogin();
          return;
        }

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load profile");

        const fetchedOwner = {
          name: data.Name || "",
          surname: data.Surname || "",
          email: data.Email || "",
          mobile: normaliseMobile(data.MobileNumber),
          emailVerified: data.IsEmailVerified !== false,
          role: "Store Owner",
        };

        setOwner(fetchedOwner);
        setForm({
          email: fetchedOwner.email,
          mobile: formatMobile(fetchedOwner.mobile),
        });

        // Keep the name shown in the header menu on every page in sync with the database
        localStorage.setItem("userName", fetchedOwner.name);
        localStorage.setItem("userSurname", fetchedOwner.surname);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [navigate, forceLogin]);

  // Only allow Save / Cancel once the email or mobile number has changed
  const isDirty =
    form.email.trim() !== owner.email ||
    digitsOnly(form.mobile) !== owner.mobile;

  // Hide the success message after a few seconds
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const closePasswordPopup = useCallback(() => setShowPasswordPopup(false), []);
  const closeVerifyPopup = useCallback(() => setShowVerifyPopup(false), []);

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.email.trim()) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (!form.mobile.trim()) return "Enter your mobile number.";
    if (!/^0\d{9}$/.test(digitsOnly(form.mobile))) return "Enter a valid 10-digit mobile number, e.g. 082 000 0000.";
    return "";
  };

  // --- 2. SAVE PROFILE CHANGES (email + mobile only) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setIsSaving(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: form.email.trim(),
          mobile: digitsOnly(form.mobile),
        }),
      });

      if (response.status === 401 || response.status === 403) {
        forceLogin();
        return;
      }

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to update profile");

      // Update local state to reflect saved changes
      const saved = {
        ...owner,
        email: form.email.trim(),
        mobile: digitsOnly(form.mobile),
        // A changed email is unverified until the owner enters the code
        emailVerified: data.emailChanged ? false : owner.emailVerified,
      };

      setOwner(saved);
      setForm({
        email: saved.email,
        mobile: formatMobile(saved.mobile),
      });

      if (data.emailChanged) {
        // Take the owner to verifying the new email
        setVerifyNotice(
          data.emailSent
            ? ""
            : "Your details were saved, but we couldn't send the code. Click \"Resend code\" to try again."
        );
        setShowVerifyPopup(true);
      } else {
        setToast("Your profile was updated successfully.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      email: owner.email,
      mobile: formatMobile(owner.mobile),
    });
    setError("");
  };

  // --- 3. EMAIL VERIFICATION ---
  // Asks the server for a fresh code (used by "Resend code" in the modal and by "Verify now")
  const requestNewCode = useCallback(async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_URL}/resend-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      forceLogin();
      throw new Error("Your session has expired. Please sign in again.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not send the code");
  }, [forceLogin]);

  // "Verify now" in the banner: send a fresh code, then open the modal
  const handleVerifyNow = async () => {
    setError("");
    try {
      await requestNewCode();
      setVerifyNotice("");
      setShowVerifyPopup(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEmailVerified = useCallback(() => {
    setOwner((current) => ({ ...current, emailVerified: true }));
    setToast("Your email address was verified successfully.");
  }, []);

  // --- 4. CHANGE PASSWORD ---
  // The popup calls the API itself (PUT /api/owner/change-password), shows its own errors,
  // and closes itself. It only calls onSave after the password was changed successfully.
  const handlePasswordChanged = useCallback(() => {
    setToast("Your password was changed successfully.");
  }, []);

  if (isLoading) {
    return (
      <div className="so-layout">
        <StoreOwnerSidebar />
        <main
          className="so-main"
          style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}
        >
          <p>Loading your profile...</p>
        </main>
      </div>
    );
  }

  const fullName = `${owner.name} ${owner.surname}`.trim();

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

          {/* Shown while the current email has not been verified */}
          {!owner.emailVerified && (
            <div className="pf-verify-banner" role="status">
              <span>Your email address is not verified.</span>
              <button type="button" className="so-link-btn" onClick={handleVerifyNow}>
                Verify now
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="pf-grid">
              {/* Name and surname are read-only */}
              <div className="pf-field">
                <label htmlFor="pf-first-name">Name</label>
                <input
                  id="pf-first-name"
                  type="text"
                  className="pf-input"
                  value={owner.name}
                  readOnly
                  disabled
                />
              </div>

              <div className="pf-field">
                <label htmlFor="pf-surname">Surname</label>
                <input
                  id="pf-surname"
                  type="text"
                  className="pf-input"
                  value={owner.surname}
                  readOnly
                  disabled
                />
              </div>

              <div className="pf-field">
                <label htmlFor="pf-email">Email address</label>
                <input
                  id="pf-email"
                  type="email"
                  className="pf-input"
                  maxLength={50}
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

            <p className="pf-hint">
              Your name and surname cannot be changed here. If you change your email address,
              you will need to verify the new address.
            </p>

            {/* Change password */}
            <div className="pf-password-row">
              <button type="button" className="so-link-btn" onClick={() => setShowPasswordPopup(true)}>
                Change password
              </button>
            </div>

            {error && <p className="pf-error" role="alert">{error}</p>}

            <div className="pf-actions">
              <button type="submit" className="pf-btn pf-btn-primary" disabled={!isDirty || isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="pf-btn pf-btn-outline"
                onClick={handleCancel}
                disabled={!isDirty || isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>

      {/* =========================================
          POPUPS
          ========================================= */}
      {showPasswordPopup && (
        <StoreOwner_ChangePassword_popup
          onSave={handlePasswordChanged}
          onClose={closePasswordPopup}
        />
      )}

      {showVerifyPopup && (
        <VerifyEmailModal
          email={owner.email}
          role="OWNER"
          notice={verifyNotice}
          closeLabel="Verify later"
          onVerified={handleEmailVerified}
          onResend={requestNewCode}
          onClose={closeVerifyPopup}
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