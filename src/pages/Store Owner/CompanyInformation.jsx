import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";
import "../../Style/Store Owner/CompanyInformation.css";

const CompanyInformation = () => {
  const navigate = useNavigate();
  const [cipcNumber, setCipcNumber] = useState("2024/123456/07");

  // 1. Fetch the CIPC number entered in Step 1 (RegisterStore)
  useEffect(() => {
    const savedCipc = localStorage.getItem("draftCipc");
    if (savedCipc) {
      setCipcNumber(savedCipc);
    }
  }, []);

  // 2. Save the mock company data to localStorage and proceed
  const handleContinue = () => {
    const companyData = {
      registrationNumber: cipcNumber,
      registeredName: "Mseleku Trading (Pty) Ltd",
      companyType: "Public Company",
      registrationDate: "12 March 2024",
      status: "In Business",
      registeredAddress: "18 Lagoon Drive, Umhlanga, KwaZulu-Natal, 4319"
    };

    // Save it so the Review page can show it
    localStorage.setItem("draftCompany", JSON.stringify(companyData));
    
    // Move to Step 3
    navigate("/store-owner/stores/register/store-profile");
  };

  return (
    <div className="app-layout">
      <StoreOwnerSidebar />

      <main className="main-content">
        
        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Register a store</h1>
            <p className="page-subtitle">Review the company information returned by the verification service.</p>
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
            
            {/* Step 2: Active */}
            <div className="step active">
              <div className="step-circle">2</div>
              <span className="step-label">Company information</span>
            </div>
            
            <div className="step-divider"></div>
            
            {/* Step 3 */}
            <div className="step">
              <div className="step-circle">3</div>
              <span className="step-label">Store profile</span>
            </div>
            
            <div className="step-divider"></div>
            
            {/* Step 4 */}
            <div className="step">
              <div className="step-circle">4</div>
              <span className="step-label">Review</span>
            </div>
            
          </div>
        </div>

        {/* Company Information Card */}
        <div className="card info-display-card">
          <h2 className="form-title">Company information</h2>
          
          <p className="form-desc">
            Check that this is the correct company. These details cannot be edited as verified facts.
          </p>

          {/* Data List */}
          <div className="company-data-list">
            
            <div className="data-row">
              <span className="data-label">Registration number</span>
              <span className="data-value">{cipcNumber}</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Registered company name</span>
              <span className="data-value">Mseleku Trading (Pty) Ltd</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Company type</span>
              <span className="data-value">Public Company</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Registration date</span>
              <span className="data-value">12 March 2024</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Company status</span>
              <span className="data-value">In Business</span>
            </div>
            
            <div className="data-row">
              <span className="data-label">Registered address</span>
              <span className="data-value">18 Lagoon Drive, Umhlanga, KwaZulu-Natal, 4319</span>
            </div>
            
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="disclaimer-banner">
          Verification confirms company details only. It is not platform approval.
        </div>

        {/* Bottom Actions */}
        <div className="bottom-actions-row">
          <button 
            className="btn-outline" 
            onClick={() => navigate("/store-owner/stores/register")}
          >
            Back
          </button>
          
          <button 
            className="btn-primary" 
            onClick={handleContinue}
          >
            Continue to store profile
          </button>
        </div>

      </main>
    </div>
  );
};

export default CompanyInformation;