// src/components/Supplier/SupplierDepotPopups.jsx
// Popups for the supplier Company profile page: Add / Edit depot, Delete depot, Add delivery area
import { useState } from "react";
import { PopupShell } from "../Store Owner/StoreOwner_StockIn_popup";
import "../../Style/components/Supplier/SupplierDepotPopups.css";

const EMPTY_DEPOT = { name: "", address: "", municipality: "", contact: "" };

// "082 000 0020" -> true (10 digits starting with 0)
const isValidPhone = (value) => /^0\d{9}$/.test(value.replace(/\s+/g, ""));

const validateDepot = (depot) => {
  const errors = {};
  if (!depot.name.trim()) errors.name = "Enter the depot name.";
  if (!depot.address.trim()) errors.address = "Enter the depot address.";
  if (!depot.municipality.trim()) errors.municipality = "Enter the municipality.";
  if (!depot.contact.trim()) errors.contact = "Enter a contact number.";
  else if (!isValidPhone(depot.contact)) errors.contact = "Enter a 10-digit number, like 082 000 0020.";
  return errors;
};

/* Popup: Add depot (or Edit depot when `depot` is passed in) */
export const SupplierDepotFormPopup = ({ depot, onClose, onSave }) => {
  const isEditing = Boolean(depot);
  const [values, setValues] = useState(depot ?? EMPTY_DEPOT);
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setValues((current) => ({ ...current, [field]: e.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nextErrors = validateDepot(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    onSave({
      ...values,
      name: values.name.trim(),
      address: values.address.trim(),
      municipality: values.municipality.trim(),
      contact: values.contact.trim(),
    });
  };

  const fields = [
    { key: "name", label: "Depot name", placeholder: "e.g. Pietermaritzburg depot", autoFocus: true },
    { key: "address", label: "Address", placeholder: "Street, town, postal code" },
    { key: "municipality", label: "Municipality", placeholder: "e.g. Msunduzi" },
    { key: "contact", label: "Contact number", placeholder: "082 000 0020", type: "tel", inputMode: "tel" },
  ];

  return (
    <PopupShell title={isEditing ? "Edit depot" : "Add depot"} onClose={onClose}>
      <form className="sdp" onSubmit={handleSubmit} noValidate>
        <p className="sdp-intro">Where your goods are sent from. This helps work out delivery distance.</p>

        {fields.map((field) => (
          <div key={field.key} className="sp-field">
            <label htmlFor={`sdp-${field.key}`}>{field.label}</label>
            <input
              id={`sdp-${field.key}`}
              type={field.type ?? "text"}
              inputMode={field.inputMode}
              className={`sp-input${errors[field.key] ? " sdp-input-error" : ""}`}
              placeholder={field.placeholder}
              value={values[field.key]}
              onChange={handleChange(field.key)}
              aria-invalid={Boolean(errors[field.key])}
              aria-describedby={errors[field.key] ? `sdp-${field.key}-error` : undefined}
              autoFocus={field.autoFocus}
            />
            {errors[field.key] && (
              <span id={`sdp-${field.key}-error`} className="sdp-error">{errors[field.key]}</span>
            )}
          </div>
        ))}

        <div className="sdp-actions">
          <button type="submit" className="sdp-button sdp-button-primary">
            {isEditing ? "Save changes" : "Add depot"}
          </button>
          <button type="button" className="sdp-button sdp-button-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </PopupShell>
  );
};

/* Popup: Delete depot */
export const SupplierDeleteDepotPopup = ({ depot, onClose, onDelete }) => (
  <PopupShell title="Delete depot" onClose={onClose}>
    <div className="sdp">
      <p className="sdp-intro">
        Delete <strong>{depot.name}</strong> ({depot.address})? You can add it again later.
      </p>

      <div className="sdp-actions">
        <button type="button" className="sdp-button sdp-button-danger" onClick={onDelete}>
          Delete depot
        </button>
        <button type="button" className="sdp-button sdp-button-outline" onClick={onClose} autoFocus>
          Cancel
        </button>
      </div>
    </div>
  </PopupShell>
);

/* Popup: Add delivery area */
export const SupplierAddAreaPopup = ({ existingAreas, onClose, onAdd }) => {
  const [area, setArea] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = area.trim();
    if (!trimmed) {
      setError("Enter an area or municipality.");
      return;
    }
    if (existingAreas.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setError(`${trimmed} is already one of your delivery areas.`);
      return;
    }
    onAdd(trimmed);
  };

  return (
    <PopupShell title="Add delivery area" onClose={onClose}>
      <form className="sdp" onSubmit={handleSubmit} noValidate>
        <p className="sdp-intro">You see demand requests only in your delivery areas.</p>

        <div className="sp-field">
          <label htmlFor="sdp-area">Area or municipality</label>
          <input
            id="sdp-area"
            type="text"
            className={`sp-input${error ? " sdp-input-error" : ""}`}
            placeholder="e.g. Umngeni"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setError("");
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "sdp-area-error" : undefined}
            autoFocus
          />
          {error && <span id="sdp-area-error" className="sdp-error">{error}</span>}
        </div>

        <div className="sdp-actions">
          <button type="submit" className="sdp-button sdp-button-primary">Add area</button>
          <button type="button" className="sdp-button sdp-button-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </PopupShell>
  );
};
