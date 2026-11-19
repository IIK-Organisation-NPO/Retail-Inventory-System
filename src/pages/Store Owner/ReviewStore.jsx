import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Shared Components
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Styles
import "../../Style/Store Owner/ReviewStore.css";

const ReviewStore = () => {
  const navigate = useNavigate();
  const [showSubmittedMessage, setShowSubmittedMessage] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowSubmittedMessage(true);
  };

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
            
            {/* Step 1: Completed */}
            <div className="step completed">
              <div className="step-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="step-label">Company check</span>
            </div>
            
            <div className="step-divider"></div>
            
            {/* Step 2: Completed */}
            <div className="step completed">
              <div className="step-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="step-label">Company information</span>
            </div>
            
            <div className="step-divider"></div>
            
            {/* Step 3: Completed */}
            <div className="step completed">
              <div className="step-circle">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <span className="step-label">Store profile</span>
            </div>
            
            <div className="step-divider"></div>
            
            {/* Step 4: Active */}
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
                <span className="review-value">2024/123456/07</span>
              </div>
              <div className="review-row">
                <span className="review-label">Registered name</span>
                <span className="review-value">Mseleku Trading (Pty) Ltd</span>
              </div>
              <div className="review-row">
                <span className="review-label">Company type</span>
                <span className="review-value">Private Company</span>
              </div>
              <div className="review-row">
                <span className="review-label">Registered on</span>
                <span className="review-value">12 March 2024</span>
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
                <span className="review-value">Umhlanga Coast Store</span>
              </div>
              <div className="review-row">
                <span className="review-label">Category</span>
                <span className="review-value">Grocery & essentials</span>
              </div>
              <div className="review-row">
                <span className="review-label">Description</span>
                <span className="review-value">Everyday groceries and household essentials.</span>
              </div>
              <div className="review-row">
                <span className="review-label">Operating hours</span>
                <span className="review-value">Mon–Fri, 08:00–17:00</span>
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
                <span className="review-value">Sipho Dlamini</span>
              </div>
              <div className="review-row">
                <span className="review-label">Telephone</span>
                <span className="review-value">082 000 0004</span>
              </div>
              <div className="review-row">
                <span className="review-label">Email</span>
                <span className="review-value">hello@umhlangacoast.co.za</span>
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
                <span className="review-value">18 Lagoon Drive, Umhlanga, KwaZulu-Natal, 4319</span>
              </div>
              <div className="review-row">
                <span className="review-label">Store address</span>
                <span className="review-value">Same as registered address</span>
              </div>
              <div className="review-row">
                <span className="review-label">Location / area</span>
                <span className="review-value">Umhlanga</span>
              </div>
            </div>
          </div>

        </div>

        {/* Additional Details */}
        <div className="card additional-details-card">
          <h3 className="review-title">Additional details</h3>
          <div className="additional-info">
            <span>Company status: In Business</span>
            <span className="bullet-separator">•</span>
            <span>Postal address: 4319</span>
            <span className="bullet-separator">•</span>
            <span>Website: Not provided</span>
          </div>
          <p className="logo-note">Store logo: Not uploaded — you can add a logo after registration.</p>
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

        <form className="application-submit-form" onSubmit={handleSubmit}>
          {/* Checkboxes */}
          <div className="confirmation-checkboxes">
            <div className="checkbox-item">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">I accept the platform's application terms for this prototype.</label>
            </div>
            <div className="checkbox-item">
              <input type="checkbox" id="accuracy" required />
              <label htmlFor="accuracy">I confirm the details are accurate and I am authorised to apply for this business.</label>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="bottom-actions-row">
            <button
              type="button"
              className="btn-outline"
              onClick={() => navigate("/store-owner/stores/register/store-profile")}
            >
              Back
            </button>
            <button type="submit" className="btn-primary">
              Submit application
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
                Your application has been submitted. If your store has been approved, it will appear on the Stores page.
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