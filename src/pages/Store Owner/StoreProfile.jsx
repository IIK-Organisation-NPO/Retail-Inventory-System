import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Shared Components
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import OperatingHoursField from "../../components/Store Owner/OperatingHoursField";

// Styles
import "../../Style/Store Owner/StoreProfile.css";

const SOUTH_AFRICAN_PROVINCES = [
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
];
const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];
const MAX_ADDRESS_LENGTH = 50; // the STORES.Address column holds 50 characters

// Small red message shown under a field
const FieldError = ({ message }) =>
  message ? <span className="upload-error" role="alert">{message}</span> : null;

// Checks every field and returns { fieldName: "message" } for each problem
const formatOperatingHours = ({ fromDay, toDay, openTime, closeTime }) => {
  const dayLabels = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  if (!fromDay || !toDay || !openTime || !closeTime) return "";
  return `${dayLabels[fromDay]}-${dayLabels[toDay]} ${openTime}-${closeTime}`;
};

const validateStoreForm = (formData, address, hours, operatingHoursObj) => {
  const get = (name) => (formData.get(name) || "").toString().trim();
  const errors = {};

  if (!get("storeName")) errors.storeName = "Enter the store / trading name.";
  if (!get("storeCategory")) errors.storeCategory = "Select a store category.";
  if (!get("storeDescription")) errors.storeDescription = "Enter a store description.";
  if (!get("contactPerson")) errors.contactPerson = "Enter the contact person's name.";

  if (!get("contactNumber")) {
    errors.contactNumber = "Enter the store contact number.";
  } else if (!/^[0-9+\s()-]{7,20}$/.test(get("contactNumber"))) {
    errors.contactNumber = "Enter a valid contact number, for example 031 123 4567.";
  }

  if (!get("email")) {
    errors.email = "Enter the store email address.";
  } else if (!/^\S+@\S+\.\S+$/.test(get("email"))) {
    errors.email = "Enter a valid email address, for example shop@example.com.";
  }

  if (!address.trim()) {
    errors.address = "Enter the physical store address.";
  } else if (address.trim().length > MAX_ADDRESS_LENGTH) {
    errors.address = `The address must be ${MAX_ADDRESS_LENGTH} characters or fewer.`;
  }

  if (!get("storeLocation")) errors.storeLocation = "Enter the store location / area.";
  if (!get("province")) errors.province = "Select a province.";
  
  // Operating Hours Validation
  if (!hours) {
    errors.operatingHours = "Choose operating days and opening and closing times.";
  } else if (operatingHoursObj.fromDay === operatingHoursObj.toDay) {
    errors.operatingHours = "Can not approve same days";
  } else if (hours.length < 5) {
    errors.operatingHours = "Enter valid operating hours, for example Mon-Fri 08:00-17:00.";
  } else if (!/\d/.test(hours)) {
    errors.operatingHours = "Include the opening and closing times, for example 08:00-17:00.";
  } else if (hours.length > 100) {
    errors.operatingHours = "Operating hours must be 100 characters or fewer.";
  }

  return errors;
};

const StoreProfile = () => {
  const navigate = useNavigate();

  // Company details saved by the earlier steps (CIPC lookup)
  const cipcNumber = localStorage.getItem("draftCipc") || "";
  const [company] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("draftCompany"));
    } catch {
      return null;
    }
  });
  const registeredAddress = company?.registeredAddress || "";
  const registeredFits = registeredAddress.length <= MAX_ADDRESS_LENGTH;

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoBase64, setLogoBase64] = useState(""); // Added for DB storage
  const [logoError, setLogoError] = useState("");
  
  // Draft saved earlier (if the user hit "Back" from the review page)
  const [savedDraft] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("draftStore")) || {};
    } catch {
      return {};
    }
  });
  const savedAddress = savedDraft.address;

  const [sameAsRegisteredAddress, setSameAsRegisteredAddress] = useState(
    savedAddress ? savedAddress === registeredAddress : registeredFits
  );
  const [physicalAddress, setPhysicalAddress] = useState(
    savedAddress || (registeredFits ? registeredAddress : "")
  );
  const [addressError, setAddressError] = useState("");
  const [errors, setErrors] = useState({});
  const [operatingHours, setOperatingHours] = useState(() => savedDraft.operatingHoursDetails || {
    fromDay: "",
    toDay: "",
    openTime: "",
    closeTime: "",
  });
  const [operatingHoursError, setOperatingHoursError] = useState("");
  const logoPreviewUrl = useRef("");

  // If someone lands here without doing the company check, send them back to step 1
  useEffect(() => {
    if (!cipcNumber || !company) {
      navigate("/store-owner/stores/register", { replace: true });
    }
  }, [cipcNumber, company, navigate]);

  useEffect(
    () => () => {
      if (logoPreviewUrl.current) URL.revokeObjectURL(logoPreviewUrl.current);
    },
    []
  );

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setLogoError("Choose a PNG, JPG, or SVG image.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_SIZE) {
      setLogoError("The image must be 2 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (logoPreviewUrl.current) URL.revokeObjectURL(logoPreviewUrl.current);
    const previewUrl = URL.createObjectURL(file);
    logoPreviewUrl.current = previewUrl;
    setLogoPreview(previewUrl);
    setLogoFile(file);
    
    // Convert to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoBase64(reader.result);
    };
    reader.readAsDataURL(file);
    
    setLogoError("");
  };

  const handleRemoveLogo = () => {
    if (logoPreviewUrl.current) URL.revokeObjectURL(logoPreviewUrl.current);
    logoPreviewUrl.current = "";
    setLogoPreview("");
    setLogoFile(null);
    setLogoBase64(""); // Clear Base64
    setLogoError("");
  };

  const handleSameAddressChange = (event) => {
    const isChecked = event.target.checked;

    // The database only holds 50 characters, so a long registered address can't be copied
    if (isChecked && !registeredFits) {
      setAddressError(
        `The registered address is longer than ${MAX_ADDRESS_LENGTH} characters. Please type a shorter version.`
      );
      return;
    }

    setAddressError("");
    setSameAsRegisteredAddress(isChecked);
    setPhysicalAddress(isChecked ? registeredAddress : "");
  };

  // --- SAVE FORM DATA TO LOCALSTORAGE ---
  const handleSubmit = (event) => {
    event.preventDefault();

    // Extract all inputs from the form
    const formData = new FormData(event.target);
    const formattedHours = formatOperatingHours(operatingHours);

    // Check all fields first, and stop with a message under each problem field
    const foundErrors = validateStoreForm(formData, physicalAddress, formattedHours, operatingHours);
    
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      setOperatingHoursError(foundErrors.operatingHours || "");
      const firstField = Object.keys(foundErrors)[0];
      if (firstField !== "operatingHours") {
        event.target.elements[firstField]?.focus(); // jumps to the first problem
      }
      return;
    }
    
    setErrors({});
    setOperatingHoursError("");

    // Build the draft object (merging with any existing draft from earlier steps if needed)
    const existingDraft = JSON.parse(localStorage.getItem("draftStore")) || {};

    const updatedDraft = {
      ...existingDraft,
      registrationNumber: cipcNumber, // the backend needs this to re-check the company
      storeName: formData.get("storeName"),
      category: formData.get("storeCategory"),
      description: formData.get("storeDescription"),
      contactPerson: formData.get("contactPerson"),
      contactNumber: formData.get("contactNumber"),
      email: formData.get("email"),
      website: formData.get("website") || "Not provided",
      address: physicalAddress.trim(),
      postalAddress: formData.get("postalAddress"),
      storeLocation: formData.get("storeLocation"),
      municipality: formData.get("storeLocation"), // saved in the Municipality column
      province: formData.get("province"),
      operatingHours: formattedHours,
      operatingHoursDetails: operatingHours,
      
      // NEW LOGO DATA FOR BACKEND
      hasLogo: !!logoFile,
      logoName: logoFile ? logoFile.name : null,
      logoType: logoFile ? logoFile.type : null,
      logoBase64: logoBase64
    };

    // Save to localStorage so ReviewStore can read it
    localStorage.setItem("draftStore", JSON.stringify(updatedDraft));

    // Move to the final review step
    navigate("/store-owner/stores/register/review");
  };

  if (!cipcNumber || !company) return null;

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={3} />

      <main className="main-content">

        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Register a store</h1>
            <p className="page-subtitle">Add the details customers and suppliers will see.</p>
          </div>

          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Progress Stepper */}
        <div className="card stepper-card">
          <div className="stepper">

            <div className="step completed">
              <div className="step-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="step-label">Company check</span>
            </div>

            <div className="step-divider"></div>

            <div className="step completed">
              <div className="step-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="step-label">Company information</span>
            </div>

            <div className="step-divider"></div>

            <div className="step active">
              <div className="step-circle">3</div>
              <span className="step-label">Store profile</span>
            </div>

            <div className="step-divider"></div>

            <div className="step">
              <div className="step-circle">4</div>
              <span className="step-label">Review</span>
            </div>

          </div>
        </div>

        {/* Main Content Grid */}
        <div className="store-profile-grid">

          {/* LEFT COLUMN (Form) */}
          <div className="profile-form-column">

            {/* Store Logo Card */}
            <div className="card logo-upload-card">
              <h2 className="form-title">Store logo</h2>
              <div className="logo-upload-row">
                <div className="upload-placeholder">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Store logo preview" className="logo-preview" />
                  ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  )}
                </div>
                <div className="upload-actions">
                  <label className="btn-outline choose-logo-btn">
                    Choose logo
                    <input
                      type="file"
                      className="logo-file-input"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoChange}
                      aria-label="Choose a store logo"
                    />
                  </label>
                  <span className="upload-hint">Optional — you can add this later.<br/>PNG, JPG or SVG • Maximum 2 MB</span>
                  {logoFile && (
                    <div className="logo-file-details">
                      <span className="upload-hint">{logoFile.name}</span>
                      <button type="button" className="logo-remove-btn" onClick={handleRemoveLogo}>
                        Remove logo
                      </button>
                    </div>
                  )}
                  {logoError && <span className="upload-error" role="alert">{logoError}</span>}
                </div>
              </div>
            </div>

            {/* Store Details Card */}
            <div className="card store-details-card">
              <h2 className="form-title">Store details</h2>
              <p className="form-desc-small">Fields marked * are required.</p>

              <form
                id="store-profile-form"
                className="store-details-form"
                onSubmit={handleSubmit}
                noValidate
                onChange={(event) => {
                  const field = event.target.name;
                  if (field) setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
                }}
              >
                {/* Row 1 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store / trading name *</label>
                    <input type="text" name="storeName" className="form-input" maxLength={50} defaultValue={savedDraft.storeName} required />
                    <FieldError message={errors.storeName} />
                  </div>
                  <div className="input-group">
                    <label>Store category *</label>
                    <select name="storeCategory" className="form-input select-input" defaultValue={savedDraft.category || ""} required>
                      <option value="" disabled>Select a store category</option>
                      <option>Grocery & essentials</option>
                      <option>General dealer</option>
                      <option>Spaza shop</option>
                    </select>
                    <FieldError message={errors.storeCategory} />
                  </div>
                </div>

                {/* Store Description */}
                <div className="input-group">
                  <label>Store description *</label>
                  <textarea name="storeDescription" className="form-input" rows="2" defaultValue={savedDraft.description} required></textarea>
                  <FieldError message={errors.storeDescription} />
                </div>

                {/* Row 2 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Contact person *</label>
                    <input type="text" name="contactPerson" className="form-input" defaultValue={savedDraft.contactPerson} required />
                    <FieldError message={errors.contactPerson} />
                  </div>
                  <div className="input-group">
                    <label>Store contact number *</label>
                    <input type="tel" name="contactNumber" className="form-input" maxLength={20} defaultValue={savedDraft.contactNumber} required />
                    <FieldError message={errors.contactNumber} />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store email address *</label>
                    <input type="email" name="email" className="form-input" maxLength={50} defaultValue={savedDraft.email} required />
                    <FieldError message={errors.email} />
                  </div>
                  <div className="input-group">
                    <label>Website (optional)</label>
                    <input type="text" name="website" className="form-input" defaultValue={savedDraft.website === "Not provided" ? "" : savedDraft.website} />
                  </div>
                </div>

                {/* Address Section */}
                <h3 className="section-subtitle">Store address</h3>

                <div className="checkbox-group mb-4">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={sameAsRegisteredAddress}
                    onChange={handleSameAddressChange}
                  />
                  <label htmlFor="sameAddress">Same as the company's registered address</label>
                </div>

                <div className="input-group">
                  <label>Physical store address *</label>
                  <input
                    type="text"
                    name="address"
                    className="form-input"
                    value={physicalAddress}
                    onChange={(event) => setPhysicalAddress(event.target.value)}
                    maxLength={sameAsRegisteredAddress ? undefined : MAX_ADDRESS_LENGTH}
                    required
                    readOnly={sameAsRegisteredAddress}
                  />
                  {!sameAsRegisteredAddress && (
                    <span className="upload-hint">Maximum {MAX_ADDRESS_LENGTH} characters</span>
                  )}
                  {addressError && <span className="upload-error" role="alert">{addressError}</span>}
                  <FieldError message={errors.address} />
                </div>

                {/* Row 4 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Postal address</label>
                    <input type="text" name="postalAddress" className="form-input" defaultValue={savedDraft.postalAddress} />
                  </div>
                  <div className="input-group">
                    <label>Store location / area *</label>
                    <input type="text" name="storeLocation" className="form-input" maxLength={50} defaultValue={savedDraft.storeLocation} required />
                    <FieldError message={errors.storeLocation} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label>Province *</label>
                    <select name="province" className="form-input select-input" defaultValue={savedDraft.province || ""} required>
                      <option value="" disabled>Select a province</option>
                      {SOUTH_AFRICAN_PROVINCES.map((province) => (
                        <option key={province}>{province}</option>
                      ))}
                    </select>
                    <FieldError message={errors.province} />
                  </div>
                </div>
                
                {/* Operating Hours Component */}
                <div className="input-group operating-hours-input-group">
                  <OperatingHoursField
                    value={operatingHours}
                    onChange={(hours) => {
                      setOperatingHours(hours);
                      // Immediate validation for same days
                      if (hours.fromDay && hours.toDay) {
                        if (hours.fromDay === hours.toDay) {
                           setOperatingHoursError("Can not approve same days");
                        } else {
                           setOperatingHoursError("");
                        }
                      }
                    }}
                    error={operatingHoursError}
                  />
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (Sidebars) */}
          <div className="profile-sidebar-column">

            {/* Company Info Summary */}
            <div className="card company-summary-card">
              <h3 className="info-title">Company information</h3>
              <a href="#" className="cipc-link">CIPC · Read-only</a>

              <h4 className="company-name-small">{company.companyName}</h4>

              <div className="company-meta">
                <span className="meta-label">Registration number</span>
                <span className="meta-value">{cipcNumber}</span>
              </div>

              <div className="company-meta">
                <span className="meta-label">Company status</span>
                <span className="meta-value">{company.status}</span>
              </div>

              <p className="company-disclaimer">
                These company details cannot be edited.<br/>
                Go back to check a different number.
              </p>
            </div>

            {/* Help/Info Card */}
            <div className="card info-help-card">
              <h3 className="info-title">Make your store recognisable</h3>
              <p className="info-help-text">
                Use your trading name and the address where your store operates.
              </p>
              <p className="info-help-text">
                Your profile information is separate from the read-only CIPC response.
              </p>
            </div>

          </div>
        </div>

        {/* Bottom Action Row */}
        <div className="bottom-actions-row">
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate("/store-owner/stores/register/company-information")}
          >
            Back
          </button>

          <button
            type="submit"
            form="store-profile-form"
            className="btn-primary"
          >
            Review application
          </button>
        </div>

      </main>
    </div>
  );
};

export default StoreProfile;