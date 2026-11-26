// src/components/Store Owner/StoreOwner_AddStaff_popup.jsx
import { useState } from "react";
import { PopupShell } from "./StoreOwner_StockIn_popup";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";
import "../../Style/Store Owner/StoreOwner_AddStaff_popup.css";

const STAFF_ROLES = ["Cashier", "Stock clerk", "Manager"];
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const CODE_LENGTH = 6;

const digitsOnly = (value) => value.replace(/\D/g, "");

// Helper for 6-digit code validation
const isSequentialOrRepeating = (code) => {
  if (/^(\d)\1{5}$/.test(code)) return true; // 111111
  if ("0123456789".includes(code)) return true; // 012345, 123456
  if ("9876543210".includes(code)) return true; // 987654, 876543
  return false;
};

const StoreOwner_AddStaff_popup = ({ stores, defaultStoreId, staffMember, isMobileTaken, onSave, onClose }) => {
  const isEdit = Boolean(staffMember);

  const [form, setForm] = useState(() => ({
    name: staffMember?.name ?? "",
    surname: staffMember?.surname ?? "",
    email: staffMember?.email ?? "",
    mobile: staffMember?.mobile ?? "",
    gender: staffMember?.gender ?? "",
    hasDisability: staffMember?.hasDisability ?? false,
    disabilityType: staffMember?.disabilityType ?? "",
    role: staffMember?.role ?? STAFF_ROLES[0],
    // REMOVED stores[0]?.id so it forces the user to select a store
    storeId: staffMember?.storeId ?? defaultStoreId ?? "", 
    code: "",
    confirmCode: "",
  }));
  
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field) => (e) => {
    const value = field === "code" || field === "confirmCode"
      ? digitsOnly(e.target.value).slice(0, CODE_LENGTH)
      : e.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    
    // Clear the specific error as the user types
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const setDisability = (hasDisability) => {
    setForm((current) => ({ ...current, hasDisability }));
    if (validationErrors.disabilityType) {
      setValidationErrors((prev) => ({ ...prev, disabilityType: "" }));
    }
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Please enter a name";
    }
    
    if (!form.surname.trim()) {
      errors.surname = "Please enter a surname";
    }
    
    if (!form.email.trim() && !isEdit) {
      errors.email = "Please enter an email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      if (form.email.trim()) {
        errors.email = "Enter a valid email address.";
      }
    }

    const mobile = digitsOnly(form.mobile);
    if (!mobile) {
      errors.mobile = "Please enter a mobile number";
    } else if (!/^(?:\+27|0)[6-8][0-9]{8}$/.test(mobile)) {
      errors.mobile = "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)";
    } else if (isMobileTaken?.(mobile, staffMember?.id)) {
      errors.mobile = "Another staff member already uses this mobile number.";
    }

    if (!form.gender) {
      errors.gender = "Enter a gender";
    }

    if (form.hasDisability && !form.disabilityType.trim()) {
      errors.disabilityType = "Enter type of disability";
    }

    // NEW: Validate that a store is selected
    if (!form.storeId) {
      errors.storeId = "Select a store";
    }

    // When editing, the user code only changes if a new one is entered
    const codeRequired = !isEdit || form.code || form.confirmCode;
    if (codeRequired) {
      if (form.code.length !== CODE_LENGTH) {
        errors.code = "The user code must be exactly 6 digits.";
      } else if (isSequentialOrRepeating(form.code)) {
        errors.code = "Can not proceed ascending/descending order or (e.g. 6 same number (111111)";
      }
      
      if (!form.confirmCode) {
        errors.confirmCode = "Please confirm a user code";
      } else if (form.code !== form.confirmCode) {
        errors.confirmCode = "The user codes do not match.";
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsSubmitting(true);

    try {
      // Wait for the parent component to finish the API call
      await onSave({
        ...(staffMember ?? {}),
        name: form.name.trim(),
        surname: form.surname.trim(),
        email: form.email.trim(),
        mobile: digitsOnly(form.mobile),
        gender: form.gender,
        hasDisability: form.hasDisability,
        disabilityType: form.hasDisability ? form.disabilityType.trim() : "",
        role: form.role,
        storeId: form.storeId,
        code: form.code,
      });
      
      onClose(); // Close the modal only if the API call was successful
    } catch (err) {
      // Catch backend errors and place them under the correct field
      if (err.field === "email") {
        setValidationErrors({ email: err.message });
      } else if (err.field === "mobile") {
        setValidationErrors({ mobile: err.message });
      } else if (err.field === "code") {
        setValidationErrors({ code: err.message });
      } else if (err.field === "storeId") {
        setValidationErrors({ storeId: err.message });
      } else {
        setValidationErrors({ general: err.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PopupShell title={isEdit ? "Edit staff member" : "Add staff member"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        
        {/* General Error Banner */}
        {validationErrors.general && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>
            {validationErrors.general}
          </div>
        )}

        {/* Name & Surname */}
        <div className="sp-row">
          <div className="sp-field">
            <label htmlFor="staff-name">Name</label>
            <input id="staff-name" type="text" className="sp-input" value={form.name} onChange={update("name")} autoComplete="off" autoFocus />
            {validationErrors.name && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.name}</span>}
          </div>
          <div className="sp-field">
            <label htmlFor="staff-surname">Surname</label>
            <input id="staff-surname" type="text" className="sp-input" value={form.surname} onChange={update("surname")} autoComplete="off" />
            {validationErrors.surname && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.surname}</span>}
          </div>
        </div>

        {/* Email */}
        <div className="sp-field">
          <label htmlFor="staff-email">Email address{isEdit ? "" : " *"}</label>
          <input
            id="staff-email"
            type="email"
            className="sp-input"
            value={form.email}
            onChange={update("email")}
            autoComplete="email"
            required={!isEdit}
          />
          {validationErrors.email && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.email}</span>}
        </div>

        {/* Mobile */}
        <div className="sp-field">
          <label htmlFor="staff-mobile">Mobile number</label>
          <input
            id="staff-mobile"
            type="tel"
            inputMode="tel"
            className="sp-input"
            placeholder="082 000 0000"
            value={form.mobile}
            onChange={update("mobile")}
            autoComplete="off"
          />
          {validationErrors.mobile && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.mobile}</span>}
        </div>

        {/* Gender & Disability */}
        <div className="sp-row">
          <div className="sp-field">
            <label htmlFor="staff-gender">Gender</label>
            <select
              id="staff-gender"
              className={`sp-input sp-select${form.gender ? "" : " as-placeholder"}`}
              value={form.gender}
              onChange={update("gender")}
            >
              <option value="" disabled>Select your gender</option>
              {GENDERS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
            {validationErrors.gender && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.gender}</span>}
          </div>
          <fieldset className="sp-field as-fieldset">
            <legend>Disability</legend>
            <div className="as-radios">
              <label className="as-radio">
                <input type="radio" name="staff-disability" checked={form.hasDisability} onChange={() => setDisability(true)} />
                Yes
              </label>
              <label className="as-radio">
                <input type="radio" name="staff-disability" checked={!form.hasDisability} onChange={() => setDisability(false)} />
                No
              </label>
            </div>
          </fieldset>
        </div>

        {form.hasDisability && (
          <div className="sp-field">
            <label htmlFor="staff-disability-type">What type of disability?</label>
            <input id="staff-disability-type" type="text" className="sp-input" value={form.disabilityType} onChange={update("disabilityType")} />
            {validationErrors.disabilityType && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.disabilityType}</span>}
          </div>
        )}

        {/* Role & Store */}
        <div className="sp-row">
          <div className="sp-field">
            <label htmlFor="staff-role">Role</label>
            <select id="staff-role" className="sp-input sp-select" value={form.role} onChange={update("role")}>
              {STAFF_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="sp-field">
            <label htmlFor="staff-store">Store</label>
            <select id="staff-store" className="sp-input sp-select" value={form.storeId} onChange={update("storeId")}>
              {/* ADDED A DISABLED PLACEHOLDER OPTION */}
              <option value="" disabled>Select a store</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {validationErrors.storeId && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.storeId}</span>}
          </div>
        </div>

        {/* User code */}
        <div className="sp-field">
          <label htmlFor="staff-code">{isEdit ? "New 6-digit user code (optional)" : "6-digit user code"}</label>
          <input
            id="staff-code"
            type="password"
            inputMode="numeric"
            className="sp-input"
            placeholder={isEdit ? "Leave empty to keep the current code" : "You use this to sign in"}
            value={form.code}
            onChange={update("code")}
            autoComplete="new-password"
          />
          {validationErrors.code && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.code}</span>}
        </div>
        
        <div className="sp-field">
          <label htmlFor="staff-confirm-code">Confirm user code</label>
          <input
            id="staff-confirm-code"
            type="password"
            inputMode="numeric"
            className="sp-input"
            placeholder={isEdit ? "Leave empty to keep the current code" : "You use this to sign in"}
            value={form.confirmCode}
            onChange={update("confirmCode")}
            autoComplete="new-password"
          />
          {validationErrors.confirmCode && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.confirmCode}</span>}
        </div>

        <div className="sp-actions">
          <button type="submit" className="sp-btn sp-btn-primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create account"}
          </button>
          <button type="button" className="sp-btn sp-btn-outline" onClick={onClose} disabled={isSubmitting}>Cancel</button>
        </div>
      </form>
    </PopupShell>
  );
};

export default StoreOwner_AddStaff_popup;