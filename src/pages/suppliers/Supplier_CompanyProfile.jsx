// src/pages/suppliers/Supplier_CompanyProfile.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import SupplierSidebar from "../../components/Supplier/SupplierSidebar";
import SupplierUserMenu from "../../components/Supplier/SupplierUserMenu";
import {
  SupplierDepotFormPopup,
  SupplierDeleteDepotPopup,
  SupplierAddAreaPopup,
  SupplierRemoveAreaPopup,
} from "../../components/Supplier/SupplierDepotPopups";
import "../../Style/components/Supplier/SupplierDashboard.css";
import "../../Style/components/Supplier/Supplier_CompanyProfile.css";

const API_BASE = "http://localhost:5000";
const OTP_LENGTH = 6;

const PRODUCT_CATEGORIES = [
  "Groceries",
  "Beveragers",
  "Snacks",
  "Household",
  "Toiletries",
  "Stationery",
  "Agriculture",
  "Hardware",
];

const EMPTY_PROFILE = {
  companyName: "",
  contactPerson: "",
  email: "",
  mobile: "",
  categories: [],
};

const PROFILE_FIELDS = [
  {
    key: "companyName",
    label: "Company name",
    type: "text",
    autoComplete: "organization",
    readOnly: false,
    hint: "",
  },
  {
    key: "contactPerson",
    label: "Full name",
    type: "text",
    autoComplete: "name",
    readOnly: true,
    hint: "Set at registration. Contact support to change.",
  },
  {
    key: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
    readOnly: false,
    hint: "Changing this will require verifying your new email.",
  },
  {
    key: "mobile",
    label: "Mobile number",
    type: "tel",
    autoComplete: "tel",
    inputMode: "tel",
    readOnly: false,
    hint: "South African format only. E.g., 0821234567. Must be unique.",
  },
];

const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "??";

const toProfile = (supplier) => ({
  companyName: supplier?.companyName || "",
  contactPerson: supplier?.contactName || "",
  email: supplier?.email || "",
  mobile: supplier?.mobileNumber || "",
  categories: [],
});

const sameProfile = (a, b) =>
  a.companyName === b.companyName &&
  a.email === b.email &&
  a.mobile === b.mobile &&
  a.categories.length === b.categories.length &&
  a.categories.every((c) => b.categories.includes(c));

const getAuthToken = () =>
  localStorage.getItem("supplierToken") || localStorage.getItem("token");

// Validate SA phone number (Starts with 0, followed by 9 digits)
const isValidSAPhone = (phone) => {
  const cleaned = phone.replace(/\s/g, "");
  return /^0\d{9}$/.test(cleaned);
};

const Supplier_CompanyProfile = () => {
  const navigate = useNavigate();
  const [savedProfile, setSavedProfile] = useState(EMPTY_PROFILE);
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [errors, setErrors] = useState({});
  const [savedMessage, setSavedMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");

  // Persistence state — saved* = last server snapshot, unsaved = current UI
  const [areas, setAreas] = useState([]);
  const [savedAreas, setSavedAreas] = useState([]);
  const [depots, setDepots] = useState([]);
  const [savedDepots, setSavedDepots] = useState([]);
  const [savedCategories, setSavedCategories] = useState([]);
  const [savingAreas, setSavingAreas] = useState(false);
  const [savingDepots, setSavingDepots] = useState(false);
  const [depotsSavedMsg, setDepotsSavedMsg] = useState("");

  // Which popup is open
  const [popup, setPopup] = useState(null);

  const [otpModal, setOtpModal] = useState(null);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const otpRefs = useRef([]);

  const hasChanges = !sameProfile(profile, savedProfile);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      await Promise.resolve();
      if (cancelled) return;
      try {
        const token = getAuthToken();
        if (!token) throw new Error("No token. Please log in again.");

        const res = await fetch(
          `${API_BASE}/api/supplier/dashboard?cb=${Date.now()}`,
          { cache: "no-store", headers: { Authorization: `Bearer ${token}` } }
        );
        const body = await res.json();
        if (!res.ok) throw new Error(body.message || "Failed to load profile.");
        if (cancelled) return;

        const mapped = toProfile(body.supplier);
        setSavedProfile(mapped);
        setProfile(mapped);

        const cpRes = await fetch(
          `${API_BASE}/api/supplier/company-profile?cb=${Date.now()}`,
          { cache: "no-store", headers: { Authorization: `Bearer ${token}` } }
        );
        if (cpRes.ok) {
          const cp = await cpRes.json();
          const cats = Array.isArray(cp.categories) ? cp.categories : [];
          const ars = Array.isArray(cp.deliveryAreas) ? cp.deliveryAreas : [];
          const dps = Array.isArray(cp.depots) ? cp.depots : [];
          setSavedCategories(cats);
          setSavedAreas(ars);
          setSavedDepots(dps);
          setProfile((cur) => ({ ...cur, categories: cats }));
          setSavedProfile((cur) => ({ ...cur, categories: cats }));
          setAreas(ars);
          setDepots(dps);
        }
      } catch (err) {
        if (!cancelled) setLoadError(err.message || "Failed to load profile.");
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleFieldChange = (field) => (e) => {
    setProfile((cur) => ({ ...cur, [field]: e.target.value }));
    setErrors((cur) => ({ ...cur, [field]: undefined }));
    setSavedMessage("");
  };

  const toggleCategory = (category) => {
    setProfile((cur) => ({
      ...cur,
      categories: cur.categories.includes(category)
        ? cur.categories.filter((item) => item !== category)
        : [...cur.categories, category],
    }));
    setErrors((cur) => ({ ...cur, categories: undefined }));
    setSavedMessage("");
  };

  const persistCompanyProfile = async ({
    categories,
    deliveryAreas,
    depots: depotsPayload,
  }) => {
    const token = getAuthToken();
    if (!token) throw new Error("No token. Please log in again.");

    const res = await fetch(`${API_BASE}/api/supplier/company-profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        categories,
        deliveryAreas,
        depots: depotsPayload,
      }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.message || "Failed to save.");
    return body;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrors({});
    setSavedMessage("");

    // 1. Frontend Validation: SA Phone Format
    if (!isValidSAPhone(profile.mobile.trim())) {
      setErrors((cur) => ({
        ...cur,
        mobile: "Please enter a valid SA mobile number (e.g., 0821234567).",
      }));
      return;
    }

    setSaving(true);

    try {
      const token = getAuthToken();
      if (!token) throw new Error("No token. Please log in again.");

      const payload = {
        companyName: profile.companyName.trim(),
        email: profile.email.trim(),
        mobile: profile.mobile.trim(),
      };

      const res = await fetch(`${API_BASE}/api/supplier/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const body = await res.json();

      // 2. Backend Validation: Duplicate phone/email checks
      if (res.status === 400 || res.status === 409) {
        setErrors(body.errors || {});
        return;
      }
      if (!res.ok) {
        const msg = body.debug
          ? `${body.message} (${body.debug})`
          : body.message || "Failed to save profile.";
        throw new Error(msg);
      }

      const nextCategories = profile.categories;
      if (
        nextCategories.length !== savedCategories.length ||
        nextCategories.some((c) => !savedCategories.includes(c))
      ) {
        const cp = await persistCompanyProfile({
          categories: nextCategories,
          deliveryAreas: savedAreas,
          depots: savedDepots,
        });
        setSavedCategories(cp.categories);
        setSavedAreas(cp.deliveryAreas);
        setSavedDepots(cp.depots);
      }

      if (body.requiresVerification) {
        setOtp(Array(OTP_LENGTH).fill(""));
        setOtpError("");
        setOtpModal({ email: body.email });
        setSavedProfile((cur) => ({
          ...cur,
          companyName: payload.companyName,
          mobile: payload.mobile,
          categories: nextCategories,
        }));
        setProfile((cur) => ({
          ...cur,
          companyName: payload.companyName,
          mobile: payload.mobile,
          categories: nextCategories,
        }));
        return;
      }

      const mapped = toProfile(body.supplier);
      mapped.categories = nextCategories;
      setSavedProfile(mapped);
      setProfile(mapped);

      if (body.supplier?.companyName) {
        localStorage.setItem("companyName", body.supplier.companyName);
      }
      if (body.supplier?.contactName) {
        const parts = body.supplier.contactName.split(/\s+/);
        localStorage.setItem("userName", parts[0] || "");
        localStorage.setItem("userSurname", parts.slice(1).join(" ") || "");
      }

      setSavedMessage("Your changes have been saved.");
    } catch (err) {
      setErrors({ general: err.message || "Failed to save profile." });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(savedProfile);
    setErrors({});
    setSavedMessage("");
  };

  const closePopup = () => setPopup(null);

  const handleSaveDepot = async (depotData) => {
    setSavingDepots(true);
    try {
      let nextDepots;
      if (popup.depot) {
        nextDepots = depots.map((d) =>
          d.id === popup.depot.id ? { ...d, ...depotData } : d
        );
      } else {
        nextDepots = [...depots, { ...depotData, id: Date.now() }];
      }

      const cp = await persistCompanyProfile({
        categories: savedCategories,
        deliveryAreas: savedAreas,
        depots: nextDepots,
      });

      setDepots(cp.depots);
      setSavedDepots(cp.depots);
      setDepotsSavedMsg("Depots updated.");
      closePopup();
    } catch (err) {
      alert(err.message || "Failed to save depot.");
    } finally {
      setSavingDepots(false);
    }
  };

  const handleDeleteDepot = async () => {
    setSavingDepots(true);
    try {
      const nextDepots = depots.filter((d) => d.id !== popup.depot.id);
      const cp = await persistCompanyProfile({
        categories: savedCategories,
        deliveryAreas: savedAreas,
        depots: nextDepots,
      });

      setDepots(cp.depots);
      setSavedDepots(cp.depots);
      setDepotsSavedMsg("Depot deleted.");
      closePopup();
    } catch (err) {
      alert(err.message || "Failed to delete depot.");
    } finally {
      setSavingDepots(false);
    }
  };

  const handleAddArea = async (newArea) => {
    setSavingAreas(true);
    try {
      const nextAreas = [...areas, newArea];
      const cp = await persistCompanyProfile({
        categories: savedCategories,
        deliveryAreas: nextAreas,
        depots: savedDepots,
      });

      setAreas(cp.deliveryAreas);
      setSavedAreas(cp.deliveryAreas);
      closePopup();
    } catch (err) {
      alert(err.message || "Failed to add area.");
    } finally {
      setSavingAreas(false);
    }
  };

  const handleRemoveArea = async () => {
    setSavingAreas(true);
    try {
      const nextAreas = areas.filter((item) => item !== popup.area);
      const cp = await persistCompanyProfile({
        categories: savedCategories,
        deliveryAreas: nextAreas,
        depots: savedDepots,
      });

      setAreas(cp.deliveryAreas);
      setSavedAreas(cp.deliveryAreas);
      closePopup();
    } catch (err) {
      alert(err.message || "Failed to remove area.");
    } finally {
      setSavingAreas(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH - index);
    setOtpError("");
    if (!digits) {
      setOtp((cur) => cur.map((d, i) => (i === index ? "" : d)));
      return;
    }
    setOtp((cur) => {
      const next = [...cur];
      digits.split("").forEach((d, off) => {
        next[index + off] = d;
      });
      return next;
    });
    const nextIndex = index + digits.length;
    otpRefs.current[Math.min(nextIndex, OTP_LENGTH - 1)]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.some((d) => !d)) {
      setOtpError("Enter all six digits.");
      return;
    }
    setVerifying(true);
    setOtpError("");
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpModal.email,
          otp: otp.join(""),
          role: "SUPPLIER",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Verification failed.");

      localStorage.removeItem("token");
      localStorage.removeItem("supplierToken");
      localStorage.removeItem("role");
      localStorage.removeItem("userName");
      sessionStorage.removeItem("supplierApplicationApproved");
      navigate("/login/supplier");
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="supplier-dashboard-layout">
      <SupplierSidebar />

      <main className="supplier-dashboard-main scp">
        <header className="supplier-dashboard-header">
          <h1>Company profile</h1>
          <div className="supplier-dashboard-account">
            <div className="supplier-company-pill">
              <span className="supplier-company-initials">
                {getInitials(savedProfile.companyName)}
              </span>
              <span>{savedProfile.companyName || "Supplier"}</span>
            </div>
            <SupplierUserMenu />
          </div>
        </header>

        {loadError && (
          <div className="scp-error" role="alert" style={{ marginBottom: 16 }}>
            {loadError}
          </div>
        )}

        <section className="scp-card" aria-labelledby="scp-company-title">
          <div className="scp-identity">
            <span className="scp-avatar" aria-hidden="true">
              {getInitials(savedProfile.companyName)}
            </span>
            <div>
              <h2 id="scp-company-title" className="scp-identity-name">
                {savedProfile.companyName}
              </h2>
              <p className="scp-identity-role">Supplier</p>
            </div>
          </div>

          <div className="scp-cipc">
            <span className="scp-chip">Verified with CIPC · read-only</span>
            <dl>
              <div>
                <dt>Registered company name</dt>
                <dd>{savedProfile.companyName || "—"}</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={handleSave} noValidate>
            {errors.general && (
              <p className="scp-error" role="alert">
                {errors.general}
              </p>
            )}

            <div className="scp-fields">
              {PROFILE_FIELDS.map((field) => (
                <div key={field.key} className="scp-field">
                  <label htmlFor={`scp-${field.key}`}>{field.label}</label>
                  <input
                    id={`scp-${field.key}`}
                    type={field.type}
                    inputMode={field.inputMode}
                    autoComplete={field.autoComplete}
                    className={`${errors[field.key] ? "error" : ""}${
                      field.readOnly ? " readonly" : ""
                    }`}
                    value={profile[field.key] || ""}
                    onChange={
                      field.readOnly ? undefined : handleFieldChange(field.key)
                    }
                    readOnly={field.readOnly}
                    aria-invalid={Boolean(errors[field.key])}
                    aria-describedby={
                      errors[field.key] ? `scp-${field.key}-error` : undefined
                    }
                    style={
                      field.readOnly
                        ? { background: "#f5f5f5", cursor: "not-allowed" }
                        : undefined
                    }
                  />
                  {errors[field.key] && (
                    <span id={`scp-${field.key}-error`} className="scp-error">
                      {errors[field.key]}
                    </span>
                  )}
                  {!errors[field.key] && field.hint && (
                    <span className="scp-hint">{field.hint}</span>
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
                <p className="scp-hint">
                  You see demand requests for the categories you choose.
                </p>
              )}
            </fieldset>

            <div className="scp-form-actions">
              <button
                type="submit"
                className="scp-button scp-button-primary"
                disabled={!hasChanges || saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                type="button"
                className="scp-button scp-button-outline"
                onClick={handleCancel}
                disabled={!hasChanges || saving}
              >
                Cancel
              </button>
              {savedMessage && (
                <span className="scp-saved" role="status">
                  {savedMessage}
                </span>
              )}
            </div>
          </form>
        </section>

        <section className="scp-card" aria-labelledby="scp-areas-title">
          <h2 id="scp-areas-title" className="scp-card-title">
            Delivery areas
          </h2>
          <div className="scp-chips">
            {areas.map((area) => (
              <button
                key={area}
                type="button"
                className="scp-area"
                onClick={() => setPopup({ type: "removeArea", area })}
                aria-label={`Remove ${area}`}
              >
                {area}
                <span className="scp-area-remove" aria-hidden="true">×</span>
              </button>
            ))}
            <button
              type="button"
              className="scp-category"
              onClick={() => setPopup({ type: "addArea" })}
              disabled={savingAreas}
            >
              {savingAreas ? "Saving…" : "Add area"}
            </button>
          </div>
          <p className="scp-hint">
            {areas.length === 0
              ? "No delivery areas yet. Add an area to start seeing demand requests."
              : "You see demand requests only in these areas. Select an area to remove it."}
          </p>
        </section>

        <section
          className="scp-card scp-depots"
          aria-labelledby="scp-depots-title"
        >
          <div className="scp-card-header">
            <h2 id="scp-depots-title" className="scp-card-title">
              Depots and branches
            </h2>
            <button
              type="button"
              className="scp-button scp-button-outline"
              onClick={() => setPopup({ type: "addDepot" })}
              disabled={savingDepots}
            >
              {savingDepots ? "Saving…" : "Add depot"}
            </button>
          </div>

          {depots.length === 0 ? (
            <p className="scp-empty">
              No depots yet. Add the places your goods are sent from.
            </p>
          ) : (
            <div className="supplier-dashboard-table-wrap">
              <table className="supplier-dashboard-table">
                <thead>
                  <tr>
                    <th scope="col">Depot</th>
                    <th scope="col">Address</th>
                    <th scope="col">Municipality</th>
                    <th scope="col">Contact</th>
                    <th scope="col">
                      <span className="supplier-visually-hidden">Actions</span>
                    </th>
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
                          disabled={savingDepots}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="scp-link scp-link-danger"
                          onClick={() =>
                            setPopup({ type: "deleteDepot", depot })
                          }
                          disabled={savingDepots}
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

          {depotsSavedMsg ? (
            <p className="scp-hint" role="status">
              {depotsSavedMsg}
            </p>
          ) : (
            <p className="scp-hint">Where your goods are sent from.</p>
          )}
        </section>
      </main>

      {(popup?.type === "addDepot" || popup?.type === "editDepot") && (
        <SupplierDepotFormPopup
          depot={popup.depot}
          onClose={closePopup}
          onSave={handleSaveDepot}
        />
      )}
      {popup?.type === "deleteDepot" && (
        <SupplierDeleteDepotPopup
          depot={popup.depot}
          onClose={closePopup}
          onDelete={handleDeleteDepot}
        />
      )}
      {popup?.type === "addArea" && (
        <SupplierAddAreaPopup
          existingAreas={areas}
          onClose={closePopup}
          onAdd={handleAddArea}
        />
      )}

      {otpModal && (
        <div className="supplier-modal-overlay" role="dialog" aria-modal="true">
          <div
            className="supplier-verification-modal"
            style={{ maxWidth: 480 }}
          >
            <header className="supplier-verification-header">
              <h2>Verify your new email</h2>
              <button
                type="button"
                className="supplier-verification-close"
                onClick={() => setOtpModal(null)}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <p className="supplier-verification-description">
              We sent a 6-digit code to <strong>{otpModal.email}</strong>. Enter
              it to finish updating your email.
            </p>

            <div className="otp-input-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  className="otp-box"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                  onPaste={(e) => {
                    e.preventDefault();
                    handleOtpChange(index, e.clipboardData.getData("text"));
                  }}
                  aria-label={`Verification digit ${index + 1}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {otpError && (
              <p className="supplier-verification-error" role="alert">
                {otpError}
              </p>
            )}

            <div className="supplier-verification-actions">
              <button
                type="button"
                className="supplier-verify-button"
                onClick={handleVerifyOtp}
                disabled={verifying}
              >
                {verifying ? "Verifying…" : "Verify email"}
              </button>
              <button
                type="button"
                className="supplier-cancel-button"
                onClick={() => setOtpModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {popup?.type === "removeArea" && (
        <SupplierRemoveAreaPopup area={popup.area} onClose={closePopup} onRemove={handleRemoveArea} />
      )}
    </div>
  );
};

export default Supplier_CompanyProfile;