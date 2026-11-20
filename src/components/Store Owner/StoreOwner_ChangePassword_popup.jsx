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
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
    setError("");
  };

  const validate = () => {
    if (!form.current) return "Enter your current password.";
    if (!isStrongPassword(form.next)) return "Your new password doesn't meet all the requirements.";
    if (form.next === form.current) return "Your new password must be different from your current one.";
    if (form.next !== form.confirm) return "The new passwords do not match.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/owner/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ 
          currentPassword: form.current, 
          newPassword: form.next 
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      // Success! Notify parent and close
      onSave?.();
      onClose();

    } catch (err) {
      setError(err.message);
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
            className="sp-input"
            value={form.current}
            onChange={update("current")}
            autoComplete="current-password"
            autoFocus
            disabled={isSubmitting}
          />
        </div>

        <div className="sp-field">
          <label htmlFor="cp-new">New password</label>
          <PasswordInput
            id="cp-new"
            className="sp-input"
            value={form.next}
            onChange={update("next")}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
          <PasswordRequirements password={form.next} />
        </div>

        <div className="sp-field">
          <label htmlFor="cp-confirm">Confirm new password</label>
          <PasswordInput
            id="cp-confirm"
            className="sp-input"
            value={form.confirm}
            onChange={update("confirm")}
            autoComplete="new-password"
            disabled={isSubmitting}
          />
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