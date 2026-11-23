// src/components/Store Owner/StoreOwner_ChangePassword_popup.jsx
// "Change password" popup — opened from the Profile page
import { useState } from "react";
import { PopupShell } from "./StoreOwner_StockIn_popup";
import PasswordInput from "../common/PasswordInput";
import PasswordRequirements from "../common/PasswordRequirements";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";
import "../../Style/Store Owner/StoreOwner_ChangePassword_popup.css";

// Same rules as the sign-up page (see PasswordRequirements)
const isStrongPassword = (password) =>
  password.length >= 8 &&
  /[A-Z]/.test(password) &&
  /[a-z]/.test(password) &&
  /\d/.test(password) &&
  /[^A-Za-z0-9]/.test(password);

const StoreOwner_ChangePassword_popup = ({ onSave, onClose }) => {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [fieldErrors, setFieldErrors] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState(""); // general error (e.g. server problem)
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Typing in a field clears that field's error (and the general error)
  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    setFieldErrors((current) => ({ ...current, [field]: "" }));
    setError("");
  };

  // Checks EVERY field and returns all the problems at once
  const validate = () => {
    const errors = { current: "", next: "", confirm: "" };

    if (!form.current) {
      errors.current = "Enter your current password.";
    }

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
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/owner/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.current,
          newPassword: form.next,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      // Success! Notify parent and close
      onSave?.();
      onClose();
    } catch (err) {
      // A wrong current password belongs under the current password field
      if (/current password is incorrect/i.test(err.message)) {
        setFieldErrors((current) => ({ ...current, current: err.message }));
      } else {
        setError(err.message);
      }
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

export default StoreOwner_ChangePassword_popup;