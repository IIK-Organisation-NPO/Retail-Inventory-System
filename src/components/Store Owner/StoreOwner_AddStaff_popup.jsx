// src/components/Store Owner/StoreOwner_AddStaff_popup.jsx
// "Add staff member" popup — also used to edit an existing staff member
import { useState } from "react";
import { PopupShell } from "./StoreOwner_StockIn_popup";
import "../../Style/Store Owner/StoreOwner_StockIn_popup.css";
import "../../Style/Store Owner/StoreOwner_AddStaff_popup.css";

const STAFF_ROLES =["Cashier", "Stock clerk", "Manager"];
const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];
const CODE_LENGTH = 6;

const digitsOnly = (value) => value.replace(/\D/g, "");

/**
 * stores:        [{ id, name }]
 * defaultStoreId the store selected in the header
 * staffMember:   pass an existing staff member to edit them (optional)
 * isMobileTaken: (mobileDigits, staffId) => true if another staff member uses it
 * onSave:        called with the staff member's details
 */
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
    storeId: staffMember?.storeId ?? defaultStoreId ?? stores[0]?.id ?? "",
    code: "",
    confirmCode: "",
  }));
  const [error, setError] = useState("");

  const update = (field) => (e) => {
    const value = field === "code" || field === "confirmCode"
      ? digitsOnly(e.target.value).slice(0, CODE_LENGTH)
      : e.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  };

  const setDisability = (hasDisability) => {
    setForm((current) => ({ ...current, hasDisability }));
    setError("");
  };

  const validate = () => {
    if (!form.name.trim()) return "Enter the staff member's name.";
    if (!form.surname.trim()) return "Enter the staff member's surname.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "Enter a valid email address, or leave it empty.";
    }
    const mobile = digitsOnly(form.mobile);
    if (!/^0\d{9}$/.test(mobile)) return "Enter a valid 10-digit mobile number, e.g. 082 000 0000.";
    if (isMobileTaken?.(mobile, staffMember?.id)) return "Another staff member already uses this mobile number.";
    if (!form.gender) return "Select a gender.";
    if (form.hasDisability && !form.disabilityType.trim()) return "Enter the type of disability.";

    // When editing, the user code only changes if a new one is entered
    const codeRequired = !isEdit || form.code || form.confirmCode;
    if (codeRequired) {
      if (form.code.length !== CODE_LENGTH) return "The user code must be exactly 6 digits.";
      if (form.code !== form.confirmCode) return "The user codes do not match.";
    }
    return "";
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    // TODO: save with the API. Never keep the user code in the browser —
    // send it to the server, which stores it securely (hashed).
    onSave({
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
    });
    onClose();
  };

  return (
    <PopupShell title={isEdit ? "Edit staff member" : "Add staff member"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        {/* Name & Surname */}
        <div className="sp-row">
          <div className="sp-field">
            <label htmlFor="staff-name">Name</label>
            <input id="staff-name" type="text" className="sp-input" value={form.name} onChange={update("name")} autoComplete="off" autoFocus />
          </div>
          <div className="sp-field">
            <label htmlFor="staff-surname">Surname</label>
            <input id="staff-surname" type="text" className="sp-input" value={form.surname} onChange={update("surname")} autoComplete="off" />
          </div>
        </div>

        {/* Email */}
        <div className="sp-field">
          <label htmlFor="staff-email">Email (optional)</label>
          <input id="staff-email" type="email" className="sp-input" value={form.email} onChange={update("email")} autoComplete="off" />
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
              {stores.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
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
        </div>

        {error && <p className="sp-error" role="alert">{error}</p>}

        <div className="sp-actions">
          <button type="submit" className="sp-btn sp-btn-primary">
            {isEdit ? "Save changes" : "Create account"}
          </button>
          <button type="button" className="sp-btn sp-btn-outline" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </PopupShell>
  );
};

export default StoreOwner_AddStaff_popup;
