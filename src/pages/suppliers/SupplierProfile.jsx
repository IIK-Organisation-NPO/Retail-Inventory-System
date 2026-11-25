// src/pages/suppliers/SupplierProfile.jsx
// Supplier profile: real data from GET /api/supplier/profile.
// Name + role are read-only. Email + mobile editable (uniqueness enforced server-side).
// Changing email requires re-verification via VerifyEmailModal (auth route handles SUPPLIER).
// "Change password" opens an inline popup that mirrors the store owner popup.
// Session policy: NO expiry anywhere. Never clear or redirect on 401/403 — always
// show the server's message inline and keep the page usable.
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordRequirements from "../../components/common/PasswordRequirements";
import VerifyEmailModal from "../../components/common/VerifyEmailModal";
import { PopupShell } from "../../components/Store Owner/StoreOwner_StockIn_popup";
import "../../Style/components/Supplier/SupplierDashboard.css";
import "../../Style/components/Supplier/SupplierProfile.css";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";
import "../../Style/Store Owner/StoreOwner_ChangePassword_popup.css";

// FIX: Point directly to the backend on port 5000
const API_URL = "http://localhost:5000/api/supplier";
const TOAST_MS = 3000;

// Accept either token key so the page works regardless of which one login saved.
const getToken = () =>
  localStorage.getItem("supplierToken") || localStorage.getItem("token") || "";

const digitsOnly = (value = "") => String(value).replace(/\D/g, "");

const normaliseMobile = (value = "") => {
  let digits = digitsOnly(value);
  if (digits.length === 11 && digits.startsWith("27")) digits = `0${digits.slice(2)}`;
  return digits;
};

const formatMobile = (value) => {
  const clean = normaliseMobile(value);
  if (!clean) return "";
  return `${clean.slice(0, 3)} ${clean.slice(3, 6)} ${clean.slice(6)}`.trim();
};

const getInitials = (name = "", surname = "") =>
  `${String(name).trim()[0] || ""}${String(surname).trim()[0] || ""}`.toUpperCase() || "??";

const isStrongPassword = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

// ---------- Inline change-password popup (mirrors store owner popup) ----------
const SupplierChangePasswordPopup = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setError("");
  };

  const validate = () => {
    const errors = { current: "", next: "", confirm: "" };
    if (!form.current) errors.current = "Enter your current password.";
    if (!form.next) {
      errors.next = "Enter a new password.";
    } else if (!isStrongPassword(form.next)) {
      errors.next = "Your new password doesn't meet all the requirements.";
    } else if (form.next === form.current) {
      errors.next = "Your new password must be different from your current one.";
    }
    if (!form.confirm) {
      errors.confirm = "Confirm your new password.";
    } else if (form.next && form.next !== form.confirm) {
      errors.confirm = "The new passwords do not match.";
    }
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    if (errors.current || errors.next || errors.confirm) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setFieldErrors({ current: "", next: "", confirm: "" });

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/change-password`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          currentPassword: form.current,
          newPassword: form.next,
        }),
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const currentErr =
          (data.errors && data.errors.currentPassword) ||
          (response.status === 401 ? data.message : "");
        if (currentErr) {
          setFieldErrors((cur) => ({ ...cur, current: currentErr }));
          return;
        }
        setError(data.message || "Failed to change password.");
        return;
      }

      onSave?.();
      onClose?.();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PopupShell title="Change password" onClose={isSubmitting ? undefined : onClose}>
      <form className="cp-form" onSubmit={handleSubmit} noValidate>
        <div className="sp-field">
          <label htmlFor="cp-current">Current password</label>
          <PasswordInput
            id="cp-current"
            className={`sp-input${fieldErrors.current ? " cp-input-invalid" : ""}`}
            value={form.current}
            onChange={update("current")}
            autoComplete="current-password"
            autoFocus
            disabled={isSubmitting}
          />
          {fieldErrors.current && (
            <p className="cp-field-error" role="alert">{fieldErrors.current}</p>
          )}
        </div>

        <div className="sp-field">
          <label htmlFor="cp-new">New password</label>
          <PasswordInput
            id="cp-new"
            className={`sp-input${fieldErrors.next ? " cp-input-invalid" : ""}`}
            value={form.next}
            onChange={update("next")}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          {fieldErrors.next && (
            <p className="cp-field-error" role="alert">{fieldErrors.next}</p>
          )}
          <PasswordRequirements password={form.next} />
        </div>

        <div className="sp-field">
          <label htmlFor="cp-confirm">Confirm new password</label>
          <PasswordInput
            id="cp-confirm"
            className={`sp-input${fieldErrors.confirm ? " cp-input-invalid" : ""}`}
            value={form.confirm}
            onChange={update("confirm")}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          {fieldErrors.confirm && (
            <p className="cp-field-error" role="alert">{fieldErrors.confirm}</p>
          )}
        </div>

        {error && <p className="sp-error" role="alert">{error}</p>}

        <div className="sp-actions">
          <button type="submit" className="sp-btn sp-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Change password"}
          </button>
          <button type="button" className="sp-btn sp-btn-outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
        </div>
      </form>
    </PopupShell>
  );
};

// ---------- Main page ----------
const SupplierProfile = () => {
  const [supplier, setSupplier] = useState({
    name: "",
    surname: "",
    email: "",
    mobile: "",
    isEmailVerified: true,
    role: "Supplier",
  });
  const [form, setForm] = useState({ email: "", mobile: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);
  const [showVerifyPopup, setShowVerifyPopup] = useState(false);
  const [verifyNotice, setVerifyNotice] = useState("");
  const [toast, setToast] = useState("");

  const closePasswordPopup = useCallback(() => setShowPasswordPopup(false), []);
  const closeVerifyPopup = useCallback(() => setShowVerifyPopup(false), []);

  // --- 1. FETCH PROFILE ON LOAD ---
  useEffect(() => {
    const fetchProfile = async () => {
      const token = getToken();

      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(data.message || "Could not load profile right now.");
          return;
        }

        const fetched = {
          name: data.Name || "",
          surname: data.Surname || "",
          email: data.Email || "",
          mobile: normaliseMobile(data.MobileNumber),
          isEmailVerified: data.IsEmailVerified !== false,
          role: "Supplier",
        };

        setSupplier(fetched);
        setForm({ email: fetched.email, mobile: formatMobile(fetched.mobile) });

        localStorage.setItem("userName", fetched.name);
        localStorage.setItem("userSurname", fetched.surname);
        localStorage.setItem("role", "SUPPLIER");
        if (fetched.email) localStorage.setItem("userEmail", fetched.email);
      } catch {
        setError("Network error. Please check your connection and try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const isDirty =
    form.email.trim() !== supplier.email ||
    digitsOnly(form.mobile) !== supplier.mobile;

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.email.trim()) return "Enter your email address.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
    if (!form.mobile.trim()) return "Enter your mobile number.";
    if (!/^0\d{9}$/.test(digitsOnly(form.mobile))) {
      return "Enter a valid 10-digit mobile number, e.g. 082 000 0000.";
    }
    return "";
  };

  // --- 2. SAVE PROFILE (email + mobile only) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setError("");
    setIsSaving(true);
    const token = getToken();

    try {
      const response = await fetch(`${API_URL}/profile`, {
        method: "PUT",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          companyName: localStorage.getItem("companyName") || "Supplier",
          email: form.email.trim(),
          mobile: digitsOnly(form.mobile),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (data.errors && (data.errors.email || data.errors.mobile)) {
          setError(data.errors.email || data.errors.mobile);
        } else {
          setError(data.message || "Failed to update profile.");
        }
        return;
      }

      const saved = {
        ...supplier,
        email: form.email.trim(),
        mobile: digitsOnly(form.mobile),
        isEmailVerified: data.requiresVerification ? false : supplier.isEmailVerified,
      };

      setSupplier(saved);
      setForm({ email: saved.email, mobile: formatMobile(saved.mobile) });
      localStorage.setItem("userEmail", saved.email);

      if (data.requiresVerification) {
        setVerifyNotice("");
        setShowVerifyPopup(true);
      } else {
        setToast("Your profile was updated successfully.");
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({
      email: supplier.email,
      mobile: formatMobile(supplier.mobile),
    });
    setError("");
  };

  // --- 3. EMAIL VERIFICATION ---
  const requestNewCode = useCallback(async () => {
    const token = getToken();
    const response = await fetch(`${API_URL}/resend-email-otp`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Could not send the code.");
  }, []);

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
    setSupplier((current) => ({ ...current, isEmailVerified: true }));
    setToast("Your email address was verified successfully.");
  }, []);

  // --- 4. CHANGE PASSWORD ---
  const handlePasswordChanged = useCallback(() => {
    setToast("Your password was changed successfully.");
  }, []);

  if (isLoading) {
    return (
      <div className="supplier-dashboard-layout">
        <SupplierSidebar />
        <main
          className="supplier-dashboard-main supplier-profile-main"
          style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}
        >
          <p>Loading your profile...</p>
        </main>
      </div>
    );
  }

  const fullName = `${supplier.name} ${supplier.surname}`.trim() || "Supplier";

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
              aria-label="Company profile"
            >
              <span className="supplier-company-initials" aria-hidden="true">TB</span>
              <span>{localStorage.getItem("companyName") || "Company"}</span>
            </Link>
            <SupplierUserMenu name={fullName} role={supplier.role} />
          </div>
        </header>

        <section className="supplier-profile-card" aria-labelledby="sp-name">
          <div className="supplier-profile-identity">
            <span className="supplier-profile-initials" aria-hidden="true">
              {getInitials(supplier.name, supplier.surname)}
            </span>
            <div>
              <h2 id="sp-name">{fullName}</h2>
              <p>{supplier.role}</p>
            </div>
          </div>

          {!supplier.isEmailVerified && (
            <div className="supplier-profile-verify-banner" role="status">
              <span>Your email address is not verified.</span>
              <button
                type="button"
                className="supplier-profile-inline-link"
                onClick={handleVerifyNow}
              >
                Verify now
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="supplier-profile-fields">
              <label>
                <span>Name</span>
                <input type="text" value={supplier.name} readOnly disabled />
              </label>

              <label>
                <span>Surname</span>
                <input type="text" value={supplier.surname} readOnly disabled />
              </label>

              <label>
                <span>Email address</span>
                <input
                  type="email"
                  maxLength={50}
                  value={form.email}
                  onChange={update("email")}
                  autoComplete="email"
                />
              </label>

              <label>
                <span>Mobile number</span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="082 000 0000"
                  value={form.mobile}
                  onChange={update("mobile")}
                  autoComplete="tel"
                />
              </label>
            </div>

            <p className="supplier-profile-hint">
              Your name cannot be changed here. If you change your email address, you will
              need to verify the new address.
            </p>

            <div className="supplier-profile-password-row">
              <button
                type="button"
                className="supplier-profile-password-link"
                onClick={() => setShowPasswordPopup(true)}
              >
                Change password
              </button>
            </div>

            {error && <p className="supplier-profile-error" role="alert">{error}</p>}

            <div className="supplier-profile-actions">
              <button
                type="submit"
                className="supplier-profile-save"
                disabled={!isDirty || isSaving}
              >
                {isSaving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                className="supplier-profile-cancel"
                onClick={handleCancel}
                disabled={!isDirty || isSaving}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </main>

      {showPasswordPopup && (
        <SupplierChangePasswordPopup
          onSave={handlePasswordChanged}
          onClose={closePasswordPopup}
        />
      )}

      {showVerifyPopup && (
        <VerifyEmailModal
          email={supplier.email}
          role="SUPPLIER"
          notice={verifyNotice}
          closeLabel="Verify later"
          onVerified={handleEmailVerified}
          onResend={requestNewCode}
          onClose={closeVerifyPopup}
        />
      )}

      {toast && (
        <div className="supplier-profile-toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
};

export default SupplierProfile;