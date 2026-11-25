// src/pages/suppliers/Supplier_CompanyProfile.jsx
import { useState } from "react";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import {
  SupplierDepotFormPopup,
  SupplierDeleteDepotPopup,
  SupplierAddAreaPopup,
} from "../../components/Supplier/SupplierDepotPopups";
import "../../Style/components/Supplier/SupplierDashboard.css";
import "../../Style/components/Supplier/Supplier_CompanyProfile.css";

const PRODUCT_CATEGORIES = [
  "Groceries",
  "Drinks",
  "Snacks",
  "Household",
  "Toiletries",
  "Stationery",
  "Agriculture",
  "Hardware",
];

// Mock company. Replace with the signed-in supplier's company from the API.
const CIPC_DETAILS = {
  registrationNumber: "2012/123456/07",
  registeredName: "Tiger Brands Ltd",
};

const INITIAL_PROFILE = {
  companyName: "Tiger Brands Ltd",
  contactPerson: "Nandi Mokoena",
  email: "info@tigerbrands.com",
  mobile: "011 840 4000",
  categories: ["Groceries", "Drinks", "Snacks"],
};

const INITIAL_AREAS = ["Msunduzi", "Mkhambathini", "uMngeni"];

const INITIAL_DEPOTS = [
  {
    id: 1,
    name: "Pietermaritzburg depot",
    address: "1 Depot Road, Pietermaritzburg, 3201",
    municipality: "Msunduzi",
    contact: "082 000 0020",
  },
  {
    id: 2,
    name: "Durban depot",
    address: "5 Harbour Road, Durban, 4001",
    municipality: "eThekwini",
    contact: "082 000 0021",
  },
];

const PROFILE_FIELDS = [
  { key: "companyName", label: "Company name", type: "text", autoComplete: "organization" },
  { key: "contactPerson", label: "Contact person", type: "text", autoComplete: "name" },
  { key: "email", label: "Email address", type: "email", autoComplete: "email" },
  { key: "mobile", label: "Mobile number", type: "tel", autoComplete: "tel", inputMode: "tel" },
];

// "Tiger Brands Ltd" -> "TB"
const getInitials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

const validateProfile = (profile) => {
  const errors = {};
  if (!profile.companyName.trim()) errors.companyName = "Enter your company name.";
  if (!profile.contactPerson.trim()) errors.contactPerson = "Enter a contact person.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) errors.email = "Enter a valid email address.";
  if (!/^0\d{9}$/.test(profile.mobile.replace(/\s+/g, ""))) errors.mobile = "Enter a 10-digit number, like 011 840 4000.";
  if (profile.categories.length === 0) errors.categories = "Choose at least one category.";
  return errors;
};

const sameProfile = (a, b) =>
  a.companyName === b.companyName &&
  a.contactPerson === b.contactPerson &&
  a.email === b.email &&
  a.mobile === b.mobile &&
  a.categories.length === b.categories.length &&
  a.categories.every((category) => b.categories.includes(category));

const Supplier_CompanyProfile = () => {
  const [savedProfile, setSavedProfile] = useState(INITIAL_PROFILE);
  const [profile, setProfile] = useState(INITIAL_PROFILE);
  const [errors, setErrors] = useState({});
  const [savedMessage, setSavedMessage] = useState("");

  const [areas, setAreas] = useState(INITIAL_AREAS);
  const [depots, setDepots] = useState(INITIAL_DEPOTS);
  // Which popup is open: { type: "addDepot" | "editDepot" | "deleteDepot" | "addArea", depot? }
  const [popup, setPopup] = useState(null);

  const hasChanges = !sameProfile(profile, savedProfile);

  const handleFieldChange = (field) => (e) => {
    setProfile((current) => ({ ...current, [field]: e.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSavedMessage("");
  };

  const toggleCategory = (category) => {
    setProfile((current) => ({
      ...current,
      categories: current.categories.includes(category)
        ? current.categories.filter((item) => item !== category)
        : [...current.categories, category],
    }));
    setErrors((current) => ({ ...current, categories: undefined }));
    setSavedMessage("");
  };

  const handleSave = (e) => {
    e.preventDefault();
    const nextErrors = validateProfile(profile);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // TODO: save the company details to the API
    const cleaned = {
      ...profile,
      companyName: profile.companyName.trim(),
      contactPerson: profile.contactPerson.trim(),
      email: profile.email.trim(),
      mobile: profile.mobile.trim(),
    };
    setProfile(cleaned);
    setSavedProfile(cleaned);
    setSavedMessage("Your changes have been saved.");
  };

  const handleCancel = () => {
    setProfile(savedProfile);
    setErrors({});
    setSavedMessage("");
  };

  const closePopup = () => setPopup(null);

  const handleSaveDepot = (depot) => {
    // TODO: save the depot to the API
    if (popup.type === "editDepot") {
      setDepots((items) => items.map((item) => (item.id === depot.id ? depot : item)));
    } else {
      setDepots((items) => [...items, { ...depot, id: Date.now() }]);
    }
    closePopup();
  };

  const handleDeleteDepot = () => {
    // TODO: delete the depot in the API
    setDepots((items) => items.filter((item) => item.id !== popup.depot.id));
    closePopup();
  };

  const handleAddArea = (area) => {
    // TODO: save the delivery area to the API
    setAreas((items) => [...items, area]);
    closePopup();
  };

  return (
    <div className="supplier-dashboard-layout">
      <SupplierSidebar />

      <main className="supplier-dashboard-main scp">
        <header className="supplier-dashboard-header">
          <h1>Company profile</h1>
          <div className="supplier-dashboard-account">
            <div className="supplier-company-pill">
              <span className="supplier-company-initials">{getInitials(savedProfile.companyName)}</span>
              <span>{savedProfile.companyName}</span>
            </div>
            <SupplierUserMenu />
          </div>
        </header>

        {/* Company details */}
        <section className="scp-card" aria-labelledby="scp-company-title">
          <div className="scp-identity">
            <span className="scp-avatar" aria-hidden="true">{getInitials(savedProfile.companyName)}</span>
            <div>
              <h2 id="scp-company-title" className="scp-identity-name">{savedProfile.companyName}</h2>
              <p className="scp-identity-role">Supplier</p>
            </div>
          </div>

          <div className="scp-cipc">
            <span className="scp-chip">Verified with CIPC · read-only</span>
            <dl>
              <div>
                <dt>Company registration number</dt>
                <dd>{CIPC_DETAILS.registrationNumber}</dd>
              </div>
              <div>
                <dt>Registered company name</dt>
                <dd>{CIPC_DETAILS.registeredName}</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={handleSave} noValidate>
            <div className="scp-fields">
              {PROFILE_FIELDS.map((field) => (
                <div key={field.key} className="scp-field">
                  <label htmlFor={`scp-${field.key}`}>{field.label}</label>
                  <input
                    id={`scp-${field.key}`}
                    type={field.type}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    className={errors[field.key] ? "error" : ""}
                    value={profile[field.key]}
                    onChange={handleFieldChange(field.key)}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={errors[field.key] ? `scp-${field.key}-error` : undefined}
                  />
                  {errors[field.key] && (
                    <span id={`scp-${field.key}-error`} className="scp-error">{errors[field.key]}</span>
                  )}
                </div>
              ))}
            </div>

            <fieldset className="scp-categories">
              <legend>Product categories</legend>
              <div className="scp-chips">
                {PRODUCT_CATEGORIES.map((category) => {
                  const selected = profile.categories.includes(category);
                  return (
                    <button
                      key={category}
                      type="button"
                      className={`scp-category${selected ? " selected" : ""}`}
                      aria-pressed={selected}
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
              {errors.categories ? (
                <p className="scp-error">{errors.categories}</p>
              ) : (
                <p className="scp-hint">You see demand requests for the categories you choose.</p>
              )}
            </fieldset>

            <div className="scp-form-actions">
              <button type="submit" className="scp-button scp-button-primary" disabled={!hasChanges}>
                Save changes
              </button>
              <button
                type="button"
                className="scp-button scp-button-outline"
                onClick={handleCancel}
                disabled={!hasChanges}
              >
                Cancel
              </button>
              {savedMessage && <span className="scp-saved" role="status">{savedMessage}</span>}
            </div>
          </form>
        </section>

        {/* Delivery areas */}
        <section className="scp-card" aria-labelledby="scp-areas-title">
          <h2 id="scp-areas-title" className="scp-card-title">Delivery areas</h2>
          <div className="scp-chips">
            {areas.map((area) => (
              <span key={area} className="scp-area">{area}</span>
            ))}
            <button
              type="button"
              className="scp-category"
              onClick={() => setPopup({ type: "addArea" })}
            >
              Add area
            </button>
          </div>
          <p className="scp-hint">You see demand requests only in these areas.</p>
        </section>

        {/* Depots and branches */}
        <section className="scp-card scp-depots" aria-labelledby="scp-depots-title">
          <div className="scp-card-header">
            <h2 id="scp-depots-title" className="scp-card-title">Depots and branches</h2>
            <button
              type="button"
              className="scp-button scp-button-outline"
              onClick={() => setPopup({ type: "addDepot" })}
            >
              Add depot
            </button>
          </div>

          {depots.length === 0 ? (
            <p className="scp-empty">No depots yet. Add the places your goods are sent from.</p>
          ) : (
            <div className="supplier-dashboard-table-wrap">
              <table className="supplier-dashboard-table">
                <thead>
                  <tr>
                    <th scope="col">Depot</th>
                    <th scope="col">Address</th>
                    <th scope="col">Municipality</th>
                    <th scope="col">Contact</th>
                    <th scope="col"><span className="supplier-visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {depots.map((depot) => (
                    <tr key={depot.id}>
                      <td>{depot.name}</td>
                      <td>{depot.address}</td>
                      <td>{depot.municipality}</td>
                      <td>{depot.contact}</td>
                      <td className="scp-row-actions">
                        <button
                          type="button"
                          className="scp-link"
                          onClick={() => setPopup({ type: "editDepot", depot })}
                          aria-label={`Edit ${depot.name}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="scp-link scp-link-danger"
                          onClick={() => setPopup({ type: "deleteDepot", depot })}
                          aria-label={`Delete ${depot.name}`}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="scp-hint">
            Where your goods are sent from. This helps work out delivery distance. Depot details are sample data.
          </p>
        </section>
      </main>

      {(popup?.type === "addDepot" || popup?.type === "editDepot") && (
        <SupplierDepotFormPopup depot={popup.depot} onClose={closePopup} onSave={handleSaveDepot} />
      )}

      {popup?.type === "deleteDepot" && (
        <SupplierDeleteDepotPopup depot={popup.depot} onClose={closePopup} onDelete={handleDeleteDepot} />
      )}

      {popup?.type === "addArea" && (
        <SupplierAddAreaPopup existingAreas={areas} onClose={closePopup} onAdd={handleAddArea} />
      )}
    </div>
  );
};

export default Supplier_CompanyProfile;
