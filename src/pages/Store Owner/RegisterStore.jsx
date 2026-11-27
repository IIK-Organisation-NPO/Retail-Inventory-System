import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Shared Components
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Styles
import "../../Style/Store Owner/ReviewStore.css";

// Reads a saved JSON value from localStorage (returns null if missing or broken)
const readDraft = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};

const ReviewStore = () => {
  const navigate = useNavigate();

  // Drafts saved by the earlier steps, read once when the page first loads
  const [draftStore] = useState(() => readDraft("draftStore"));
  const [company] = useState(() => readDraft("draftCompany"));

  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState({ terms: false, accuracy: false });
  const [checkErrors, setCheckErrors] = useState({});

  // If someone lands here directly without finishing the earlier steps, send them back
  useEffect(() => {
    if (!draftStore) {
      navigate("/store-owner/stores/register/store-profile", { replace: true });
    } else if (!company) {
      navigate("/store-owner/stores/register", { replace: true });
    }
  }, [draftStore, company, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    // Both confirmations must be ticked before we send anything
    const missing = {};
    if (!accepted.terms) {
      missing.terms = "Please accept the application terms to continue.";
    }
    if (!accepted.accuracy) {
      missing.accuracy = "Please confirm that your details are accurate and that you are authorised to apply.";
    }
    if (Object.keys(missing).length > 0) {
      setCheckErrors(missing);
      return;
    }
    setCheckErrors({});

    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login/store-owner-staff");
      return;
    }

    try {
      // Send the draft data to the backend API
      const response = await fetch("http://localhost:5000/api/stores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...draftStore,
          registrationNumber: draftStore.registrationNumber || localStorage.getItem("draftCipc"),
        })
      });

      // --- FIX: Handle HTML errors gracefully ---
      const contentType = response.headers.get("content-type");
      let data = {};
      
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        // If the backend returns an HTML error page (like PayloadTooLargeError)
        throw new Error(response.status === 413 
          ? "The uploaded logo is too large for the server to process." 
          : "A server error occurred. Please check the backend console.");
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit store application");
      }

      // Success! Clear all the drafts from localStorage
      localStorage.removeItem("draftStore");
      localStorage.removeItem("draftCompany");
      localStorage.removeItem("draftCipc");
      
      // Also update the active store ID if the backend returns the new store ID
      if (data.storeId) {
        localStorage.setItem("activeStoreId", data.storeId);
      }

      setShowSubmittedMessage(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // While redirecting, show a blank screen
  if (!draftStore || !company) return null;

  const registrationNumber = draftStore.registrationNumber || localStorage.getItem("draftCipc");

  return (
    <div className="app-layout">
      <StoreOwnerSidebar notificationCount={3} />

      <main className="main-content">

        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Review your store</h1>
            <p className="page-subtitle">Check your details before submitting your application.</p>
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
            <div className="step completed">
              <div className="step-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="step-label">Store profile</span>
            </div>
            <div className="step-divider"></div>
            <div className="step active">
              <div className="step-circle">4</div>
              <span className="step-label">Review</span>
            </div>
          </div>
        </div>

        {/* Status Tag */}
        <div className="status-tag-wrapper">
          <span className="status-tag">Ready to submit</span>
        </div>

        {error && (
          <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '15px', borderRadius: '5px', marginBottom: '20px', fontWeight: 'bold' }}>
            {error}
          </div>
        )}

        {/* Review Grid */}
        <div className="review-grid">

          {/* Business Registration */}
          <div className="card review-card">
            <div className="review-card-header">
              <h3 className="review-title">Business registration</h3>
              <p className="review-subtitle">Read-only mock CIPC information</p>
            </div>
            <div className="review-list">
              <div className="review-row">
                <span className="review-label">Registration number</span>
                <span className="review-value">{registrationNumber}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Registered name</span>
                <span className="review-value">{company.registeredName || "Not provided"}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Company status</span>
                <span className="review-value">{company.status}</span>
              </div>
            </div>
          </div>

          {/* Store Profile */}
          <div className="card review-card">
            <div className="review-card-header">
              <h3 className="review-title">Store profile</h3>
              <p className="review-subtitle">Provided by you</p>
            </div>
            <div className="review-list">
              <div className="review-row">
                <span className="review-label">Trading name</span>
                <span className="review-value">{draftStore.storeName}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Category</span>
                <span className="review-value">{draftStore.category || "Not provided"}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Description</span>
                <span className="review-value">{draftStore.description || "Not provided"}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Operating hours</span>
                <span className="review-value">{draftStore.operatingHours || "Not provided"}</span>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="card review-card">
            <div className="review-card-header">
              <h3 className="review-title">Contact information</h3>
              <p className="review-subtitle">Provided by you</p>
            </div>
            <div className="review-list">
              <div className="review-row">
                <span className="review-label">Contact person</span>
                <span className="review-value">{draftStore.contactPerson}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Telephone</span>
                <span className="review-value">{draftStore.contactNumber}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Email</span>
                <span className="review-value">{draftStore.email}</span>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="card review-card">
            <div className="review-card-header">
              <h3 className="review-title">Address information</h3>
              <p className="review-subtitle">Registered address from mock CIPC</p>
            </div>
            <div className="review-list">
              <div className="review-row">
                <span className="review-label">Registered address</span>
                <span className="review-value">{company.registeredAddress}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Store address</span>
                <span className="review-value">{draftStore.address}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Location / area</span>
                <span className="review-value">{draftStore.storeLocation}</span>
              </div>
              <div className="review-row">
                <span className="review-label">Province</span>
                <span className="review-value">{draftStore.province}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Additional Details */}
        <div className="card additional-details-card">
          <h3 className="review-title">Additional details</h3>
          <div className="additional-info">
            <span>Company status: {company.status}</span>
            <span className="bullet-separator">•</span>
            <span>Postal address: {draftStore.postalAddress || "Not provided"}</span>
            <span className="bullet-separator">•</span>
            <span>Website: {draftStore.website || "Not provided"}</span>
          </div>
          <p className="logo-note">
            Store logo: {draftStore.hasLogo 
              ? `${draftStore.logoName} (Uploaded)` 
              : "Not uploaded — you can add a logo after registration."}
          </p>
        </div>

        {/* Edit Profile Button */}
        <div className="edit-action-wrapper">
          <button
            className="btn-outline"
            onClick={() => navigate("/store-owner/stores/register/store-profile")}
          >
            Edit profile information
          </button>
        </div>

        <form className="application-submit-form" onSubmit={handleSubmit} noValidate>
          {/* Checkboxes */}
          <div className="confirmation-checkboxes">
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="terms"
                checked={accepted.terms}
                onChange={(e) => {
                  setAccepted((prev) => ({ ...prev, terms: e.target.checked }));
                  setCheckErrors((prev) => ({ ...prev, terms: "" }));
                }}
              />
              <label htmlFor="terms">I accept the platform's application terms for this prototype.</label>
            </div>
            {checkErrors.terms && (
              <span role="alert" style={{ color: "red", fontSize: "14px" }}>{checkErrors.terms}</span>
            )}
            <div className="checkbox-item">
              <input
                type="checkbox"
                id="accuracy"
                checked={accepted.accuracy}
                onChange={(e) => {
                  setAccepted((prev) => ({ ...prev, accuracy: e.target.checked }));
                  setCheckErrors((prev) => ({ ...prev, accuracy: "" }));
                }}
              />
              <label htmlFor="accuracy">I confirm the details are accurate and I am authorised to apply for this business.</label>
            </div>
            {checkErrors.accuracy && (
              <span role="alert" style={{ color: "red", fontSize: "14px" }}>{checkErrors.accuracy}</span>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="bottom-actions-row">
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/store-owner/stores/register/store-profile")}
              disabled={loading}
            >
              Back
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Submitting..." : "Submit application"}
            </button>
          </div>
        </form>

        {showSubmittedMessage && (
          <div className="submission-message-backdrop">
            <section
              className="submission-message"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="submission-message-title"
              aria-describedby="submission-message-description"
            >
              <h2 id="submission-message-title">Application submitted</h2>
              <p id="submission-message-description">
                Your application has been submitted successfully. If your store has been approved, it will appear on the Stores page.
              </p>
              <button
                type="button"
                className="btn-primary"
                autoFocus
                onClick={() => navigate("/store-owner/stores")}
              >
                Close
              </button>
            </section>
          </div>
        )}

      </main>
    </div>
  );
};

export default ReviewStore;