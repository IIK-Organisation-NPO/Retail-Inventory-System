import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Shared Components
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Styles
import "../../Style/Store Owner/EditStore.css";

const REGISTERED_COMPANY_ADDRESS = "18 Lagoon Drive, Umhlanga, KwaZulu-Natal, 4319";
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

const EditStore = () => {
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");
  const [sameAsRegisteredAddress, setSameAsRegisteredAddress] = useState(false);
  const [physicalAddress, setPhysicalAddress] = useState("Pietermaritzburg, KwaZulu-Natal");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  
  // State for validation errors
  const [validationErrors, setValidationErrors] = useState({});
  
  const logoPreviewUrl = useRef("");

  // Load any previously saved draft data on mount (in case they hit "Back")
  useEffect(() => {
    const savedDraft = localStorage.getItem("draftStore");
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      if (parsed.address) setPhysicalAddress(parsed.address);
    }
  }, []);

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
    setLogoError("");
  };

  const handleRemoveLogo = () => {
    if (logoPreviewUrl.current) URL.revokeObjectURL(logoPreviewUrl.current);
    logoPreviewUrl.current = "";
    setLogoPreview("");
    setLogoFile(null);
    setLogoError("");
  };

  // Clear specific field error as the user types
  const clearError = (field) => {
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (formData) => {
    const errors = {};
    const storeName = formData.get("storeName")?.trim();
    const storeDescription = formData.get("storeDescription")?.trim();
    const contactPerson = formData.get("contactPerson")?.trim();
    const contactNumber = formData.get("contactNumber")?.trim();
    const email = formData.get("email")?.trim();
    const postalAddress = formData.get("postalAddress")?.trim();
    const storeLocation = formData.get("storeLocation")?.trim();
    
    // 1. Store Name
    if (!storeName) {
      errors.storeName = "Enter required name";
    }

    // 2. Store Description
    if (!storeDescription) {
      errors.storeDescription = "Please enter a description";
    }

    // 3. Contact Person
    if (!contactPerson) {
      errors.contactPerson = "Please enter contact name";
    }

    // 4. Contact Number
    if (!contactNumber) {
      errors.contactNumber = "Please enter contact number";
    } else {
      const mobileRegex = /^(?:\+27|0)[6-8][0-9]{8}$/;
      if (!mobileRegex.test(contactNumber.replace(/\s/g, ''))) {
        errors.contactNumber = "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)";
      }
    }

    // 5. Email Address
    if (!email) {
      errors.email = "Enter a required email address";
    }

    // 6. Physical Store Address
    if (!physicalAddress.trim()) {
      errors.address = "Enter a required physical address";
    }

    // 7. Postal Address
    if (!postalAddress) {
      errors.postalAddress = "Enter a required postal address";
    }

    // 8. Store Location
    if (!storeLocation) {
      errors.storeLocation = "Enter a required store location";
    }

    return errors;
  };

  const handleSaveChanges = (event) => {
    event.preventDefault();
    
    // 1. Gather all form data
    const formData = new FormData(event.target);
    
    // 2. Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to the first error
      const firstErrorField = Object.keys(errors)[0];
      document.getElementsByName(firstErrorField)[0]?.focus();
      return; // Stop submission
    }

    // Clear errors if valid
    setValidationErrors({});

    // 3. Build the draft object
    const draftStore = {
      storeName: formData.get("storeName"),
      registrationNumber: "2024/123456/07", 
      contactNumber: formData.get("contactNumber"),
      email: formData.get("email"),
      province: formData.get("province"),
      municipality: formData.get("municipality"),
      address: physicalAddress,
      category: formData.get("storeCategory"),
      description: formData.get("storeDescription"),
      contactPerson: formData.get("contactPerson"),
      postalAddress: formData.get("postalAddress"),
      storeLocation: formData.get("storeLocation"),
      operatingHours: formData.get("operatingHours"),
      gpsCoordinates: formData.get("gpsCoordinates"),
    };

    // 4. Save to localStorage for the Review page
    localStorage.setItem("draftStore", JSON.stringify(draftStore));
    
    setShowSaveConfirmation(true);
  };

  const confirmSaveChanges = () => {
    setShowSaveConfirmation(false);
    setShowSaveSuccess(true);
  };

  const closeSaveSuccess = () => {
    navigate("/store-owner/stores/register/review");
  };

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={3} />

      <main className="main-content">
        
        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Edit store</h1>
            <p className="page-subtitle">Update your store profile, contact details and logo.</p>
          </div>
          
          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="store-profile-grid">
          
          {/* LEFT COLUMN (Form) */}
          <div className="profile-form-column">
            
            {/* Store Logo Card */}
            <div className="card logo-upload-card">
              <h2 className="form-title">Store logo</h2>
              <div className="logo-upload-row">
                {logoPreview ? (
                  <img src={logoPreview} alt="Store logo preview" className="avatar-large-initials logo-preview" />
                ) : (
                  <div className="avatar-large-initials">MT</div>
                )}
                <div className="upload-actions">
                  <label className="btn-outline choose-logo-btn">
                    Upload logo
                    <input
                      type="file"
                      className="logo-file-input"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={handleLogoChange}
                      aria-label="Upload store logo"
                    />
                  </label>
                  <span className="upload-hint">
                    PNG, JPG or SVG • Maximum 2 MB
                  </span>
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

              <form id="edit-store-form" className="store-details-form" onSubmit={handleSaveChanges} noValidate>
                {/* Row 1 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store / trading name *</label>
                    <input 
                      type="text" 
                      name="storeName" 
                      className="form-input" 
                      defaultValue="Mseleku Tuckshop" 
                      onChange={() => clearError("storeName")}
                    />
                    {validationErrors.storeName && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.storeName}</span>}
                  </div>
                  <div className="input-group">
                    <label>Store category *</label>
                    <select name="storeCategory" className="form-input select-input" defaultValue="Grocery & essentials">
                      <option>Grocery & essentials</option>
                      <option>General dealer</option>
                      <option>Spaza shop</option>
                    </select>
                  </div>
                </div>

                {/* Store Description */}
                <div className="input-group">
                  <label>Store description *</label>
                  <textarea 
                    name="storeDescription" 
                    className="form-input" 
                    rows="2" 
                    defaultValue="Everyday groceries and household essentials." 
                    onChange={() => clearError("storeDescription")}
                  />
                  {validationErrors.storeDescription && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.storeDescription}</span>}
                </div>

                {/* Row 2 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Contact person *</label>
                    <input 
                      type="text" 
                      name="contactPerson" 
                      className="form-input" 
                      defaultValue="Sipho Dlamini" 
                      onChange={() => clearError("contactPerson")}
                    />
                    {validationErrors.contactPerson && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.contactPerson}</span>}
                  </div>
                  <div className="input-group">
                    <label>Store contact number *</label>
                    <input 
                      type="tel" 
                      name="contactNumber" 
                      className="form-input" 
                      defaultValue="082 000 0001" 
                      onChange={() => clearError("contactNumber")}
                    />
                    {validationErrors.contactNumber && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.contactNumber}</span>}
                  </div>
                </div>

                {/* Row 3 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store email address *</label>
                    <input 
                      type="email" 
                      name="email" 
                      className="form-input" 
                      defaultValue="sipho@example.co.za" 
                      onChange={() => clearError("email")}
                    />
                    {validationErrors.email && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.email}</span>}
                  </div>
                  <div className="input-group">
                    <label>Website (optional)</label>
                    <input type="text" name="website" className="form-input" defaultValue="Not provided" />
                  </div>
                </div>

                {/* Address Section */}
                <h3 className="section-subtitle">Store address</h3>
                
                <div className="checkbox-group mb-4">
                  <input
                    type="checkbox"
                    id="sameAddress"
                    checked={sameAsRegisteredAddress}
                    onChange={(event) => {
                      const isChecked = event.target.checked;
                      setSameAsRegisteredAddress(isChecked);
                      setPhysicalAddress(isChecked ? REGISTERED_COMPANY_ADDRESS : "");
                      clearError("address");
                    }}
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
                    onChange={(event) => {
                      setPhysicalAddress(event.target.value);
                      clearError("address");
                    }}
                    readOnly={sameAsRegisteredAddress}
                  />
                  {validationErrors.address && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.address}</span>}
                </div>

                {/* Row 4 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Postal address *</label>
                    <input 
                      type="text" 
                      name="postalAddress" 
                      className="form-input" 
                      defaultValue="Pietermaritzburg" 
                      onChange={() => clearError("postalAddress")}
                    />
                    {validationErrors.postalAddress && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.postalAddress}</span>}
                  </div>
                  <div className="input-group">
                    <label>Store location / area *</label>
                    <input 
                      type="text" 
                      name="storeLocation" 
                      className="form-input" 
                      defaultValue="Pietermaritzburg" 
                      onChange={() => clearError("storeLocation")}
                    />
                    {validationErrors.storeLocation && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.storeLocation}</span>}
                  </div>
                </div>

                {/* Row 5 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Province *</label>
                    <select name="province" className="form-input select-input" defaultValue="KwaZulu-Natal">
                      {SOUTH_AFRICAN_PROVINCES.map((province) => (
                        <option key={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Operating hours *</label>
                    <input type="text" name="operatingHours" className="form-input" defaultValue="Mon–Fri, 08:00–17:00" />
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN (Sidebars) */}
          <div className="profile-sidebar-column">
            
            {/* Registration Details */}
            <div className="card company-summary-card">
              <h3 className="info-title">Registration details</h3>
              <a href="#" className="cipc-link">Existing store</a>
              
              <h4 className="company-name-small">Mseleku Tuckshop</h4>
              
              <div className="company-meta">
                <span className="meta-label">Registration number</span>
                <span className="meta-value">2024/123456/07</span>
              </div>
              
              <div className="company-meta">
                <span className="meta-label">Store status</span>
                <span className="meta-value">Active</span>
              </div>
              
              <p className="company-disclaimer">
                Changes apply to this store only.
              </p>
            </div>

            {/* Your store, up to date */}
            <div className="card info-help-card">
              <h3 className="info-title">Your store, up to date</h3>
              <p className="info-help-text">
                Update contact information and your store address whenever they change.
              </p>
              <p className="info-help-text">
                Staff assignments are managed separately in the Staff tab.
              </p>
            </div>

            {/* Location Information */}
            <div className="card location-info-card">
              <h3 className="info-title">Location information</h3>
              
              <div className="input-group mt-4">
                <label>Municipality</label>
                <input type="text" name="municipality" className="form-input" defaultValue="Msunduzi Local Municipality" />
              </div>
              
              <div className="input-group">
                <label>GPS coordinates</label>
                <input type="text" name="gpsCoordinates" className="form-input" defaultValue="-29.6008, 30.3794" />
              </div>
              
              <button className="btn-outline w-full">Use my location</button>
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
            form="edit-store-form"
            className="btn-primary"
          >
            Save and Continue
          </button>
        </div>

        {(showSaveConfirmation || showSaveSuccess) && (
          <div className="edit-popup-backdrop">
            <section
              className="edit-popup"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="edit-popup-title"
              aria-describedby="edit-popup-message"
            >
              <h2 id="edit-popup-title">
                {showSaveConfirmation ? "Confirm changes" : "Changes saved"}
              </h2>
              <p id="edit-popup-message">
                {showSaveConfirmation
                  ? "Are you sure you want to save these changes?"
                  : "Changes saved successfully."}
              </p>
              <div className="edit-popup-actions">
                {showSaveConfirmation ? (
                  <>
                    <button
                      type="button"
                      className="btn-outline"
                      onClick={() => setShowSaveConfirmation(false)}
                    >
                      Cancel
                    </button>
                    <button type="button" className="btn-primary" autoFocus onClick={confirmSaveChanges}>
                      Yes, save changes
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-primary" autoFocus onClick={closeSaveSuccess}>
                    Continue to Review
                  </button>
                )}
              </div>
            </section>
          </div>
        )}

      </main>
    </div>
  );
};

export default EditStore;