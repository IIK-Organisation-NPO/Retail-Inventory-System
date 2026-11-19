import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Shared Components
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Styles
import "../../Style/Store Owner/StoreProfile.css";

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

const StoreProfile = () => {
  const navigate = useNavigate();
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [logoError, setLogoError] = useState("");
  const [sameAsRegisteredAddress, setSameAsRegisteredAddress] = useState(true);
  const [physicalAddress, setPhysicalAddress] = useState(REGISTERED_COMPANY_ADDRESS);
  const logoPreviewUrl = useRef("");

  // Load existing draft data (if the user hit "Back" from the review page)
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

  // --- SAVE FORM DATA TO LOCALSTORAGE ---
  const handleSubmit = (event) => {
    event.preventDefault();

    // Extract all inputs from the form
    const formData = new FormData(event.target);
    
    // Build the draft object (merging with any existing draft from earlier steps if needed)
    const existingDraft = JSON.parse(localStorage.getItem("draftStore")) || {};
    
    const updatedDraft = {
      ...existingDraft,
      storeName: formData.get("storeName"),
      category: formData.get("storeCategory"),
      description: formData.get("storeDescription"),
      contactPerson: formData.get("contactPerson"),
      contactNumber: formData.get("contactNumber"),
      email: formData.get("email"),
      website: formData.get("website") || "Not provided",
      address: physicalAddress,
      postalAddress: formData.get("postalAddress"),
      storeLocation: formData.get("storeLocation"),
      province: formData.get("province"),
      operatingHours: formData.get("operatingHours"),
      // Note: We aren't uploading the logo to the DB yet, just keeping it in UI for now
    };

    // Save to localStorage so ReviewStore can read it
    localStorage.setItem("draftStore", JSON.stringify(updatedDraft));

    // Move to the final review step
    navigate("/store-owner/stores/register/review");
  };

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

              <form id="store-profile-form" className="store-details-form" onSubmit={handleSubmit}>
                {/* Row 1 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store / trading name *</label>
                    <input type="text" name="storeName" className="form-input" required />
                  </div>
                  <div className="input-group">
                    <label>Store category *</label>
                    <select name="storeCategory" className="form-input select-input" defaultValue="" required>
                      <option value="" disabled>Select a store category</option>
                      <option>Grocery & essentials</option>
                      <option>General dealer</option>
                      <option>Spaza shop</option>
                    </select>
                  </div>
                </div>

                {/* Store Description */}
                <div className="input-group">
                  <label>Store description *</label>
                  <textarea name="storeDescription" className="form-input" rows="2" required></textarea>
                </div>

                {/* Row 2 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Contact person *</label>
                    <input type="text" name="contactPerson" className="form-input" required />
                  </div>
                  <div className="input-group">
                    <label>Store contact number *</label>
                    <input type="tel" name="contactNumber" className="form-input" required />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store email address *</label>
                    <input type="email" name="email" className="form-input" required />
                  </div>
                  <div className="input-group">
                    <label>Website (optional)</label>
                    <input type="text" name="website" className="form-input" />
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
                    onChange={(event) => setPhysicalAddress(event.target.value)}
                    required
                    readOnly={sameAsRegisteredAddress}
                  />
                </div>

                {/* Row 4 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Postal address</label>
                    <input type="text" name="postalAddress" className="form-input" />
                  </div>
                  <div className="input-group">
                    <label>Store location / area *</label>
                    <input type="text" name="storeLocation" className="form-input" required />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Province *</label>
                    <select name="province" className="form-input select-input" defaultValue="" required>
                      <option value="" disabled>Select a province</option>
                      {SOUTH_AFRICAN_PROVINCES.map((province) => (
                        <option key={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Operating hours *</label>
                    <input type="text" name="operatingHours" className="form-input" required />
                  </div>
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
              
              <h4 className="company-name-small">Mseleku Trading (Pty) Ltd</h4>
              
              <div className="company-meta">
                <span className="meta-label">Registration number</span>
                <span className="meta-value">2024/123456/07</span>
              </div>
              
              <div className="company-meta">
                <span className="meta-label">Company status</span>
                <span className="meta-value">In Business</span>
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