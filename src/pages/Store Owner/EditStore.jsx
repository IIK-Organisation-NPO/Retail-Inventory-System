import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Shared Components
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import OperatingHoursField from "../../components/Store Owner/OperatingHoursField";

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
  const [operatingHours, setOperatingHours] = useState({
    fromDay: "Monday",
    toDay: "Friday",
    openTime: "08:00",
    closeTime: "17:00",
  });
  const [operatingHoursError, setOperatingHoursError] = useState("");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const logoPreviewUrl = useRef("");

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

  const handleSaveChanges = (event) => {
    event.preventDefault();
    if (!operatingHours.fromDay || !operatingHours.toDay) {
      setOperatingHoursError("Choose both the first and last open day.");
      return;
    }
    setShowSaveConfirmation(true);
  };

  const confirmSaveChanges = () => {
    setShowSaveConfirmation(false);
    setShowSaveSuccess(true);
  };

  const closeSaveSuccess = () => {
    navigate("/store-owner/stores");
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

              <form id="edit-store-form" className="store-details-form" onSubmit={handleSaveChanges}>
                {/* Row 1 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store / trading name *</label>
                    <input type="text" className="form-input" defaultValue="Mseleku Tuckshop" required />
                  </div>
                  <div className="input-group">
                    <label>Store category *</label>
                    <select className="form-input select-input" defaultValue="Grocery & essentials" required>
                      <option>Grocery & essentials</option>
                      <option>General dealer</option>
                      <option>Spaza shop</option>
                    </select>
                  </div>
                </div>

                {/* Store Description */}
                <div className="input-group">
                  <label>Store description *</label>
                  <textarea className="form-input" rows="2" defaultValue="Everyday groceries and household essentials." required></textarea>
                </div>

                {/* Row 2 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Contact person *</label>
                    <input type="text" className="form-input" defaultValue="Sipho Dlamini" required />
                  </div>
                  <div className="input-group">
                    <label>Store contact number *</label>
                    <input type="tel" className="form-input" defaultValue="082 000 0001" required />
                  </div>
                </div>

                {/* Row 3 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Store email address *</label>
                    <input type="email" className="form-input" defaultValue="sipho@example.co.za" required />
                  </div>
                  <div className="input-group">
                    <label>Website (optional)</label>
                    <input type="text" className="form-input" defaultValue="Not provided" />
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
                    <input type="text" className="form-input" defaultValue="Pietermaritzburg" />
                  </div>
                  <div className="input-group">
                    <label>Store location / area *</label>
                    <input type="text" className="form-input" defaultValue="Pietermaritzburg" required />
                  </div>
                </div>

                {/* Row 5 */}
                <div className="form-row">
                  <div className="input-group">
                    <label>Province *</label>
                    <select className="form-input select-input" defaultValue="KwaZulu-Natal" required>
                      {SOUTH_AFRICAN_PROVINCES.map((province) => (
                        <option key={province}>{province}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="input-group operating-hours-input-group">
                  <OperatingHoursField
                    value={operatingHours}
                    onChange={(hours) => {
                      setOperatingHours(hours);
                      if (hours.fromDay && hours.toDay) setOperatingHoursError("");
                    }}
                    error={operatingHoursError}
                  />
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
                <input type="text" className="form-input" defaultValue="Msunduzi Local Municipality" />
              </div>
              
              <div className="input-group">
                <label>GPS coordinates</label>
                <input type="text" className="form-input" defaultValue="-29.6008, 30.3794" />
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
            onClick={() => navigate("/store-owner/stores")}
          >
            Cancel
          </button>
          
          <button 
            type="submit"
            form="edit-store-form"
            className="btn-primary"
          >
            Save changes
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
                    Close
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