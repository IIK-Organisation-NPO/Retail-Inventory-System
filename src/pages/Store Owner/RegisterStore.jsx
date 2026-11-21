import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Shared Components
import StoreOwnerSidebar from "../../components/Store Owner/StoreOwnerSidebar";
import StoreOwner_StoreSwitcher from "../../components/Store Owner/StoreOwner_StoreSwitcher";
import StoreOwner_UserMenu from "../../components/Store Owner/StoreOwner_UserMenu";

// Styles
import "../../Style/Store Owner/StoreOwnerRegisterStore.css";

const RegisterStore = () => {
  const navigate = useNavigate();
  const [cipcNumber, setCipcNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle form submit: verify the company with the backend
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    // Check the number on this page first, before calling the backend
    const registrationNumber = cipcNumber.trim();
    if (!registrationNumber) {
      setError("Please provide a CIPC registration number.");
      return;
    }
    if (!/^\d{4}\/\d{6}\/\d{2}$/.test(registrationNumber)) {
      setError("Invalid registration number. Use the format YYYY/NNNNNN/NN, for example 2015/123456/07.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      const response = await fetch("http://localhost:5000/api/stores/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ registrationNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Could not verify this company.");
        return;
      }

      // Save the number and the company details so the next steps can use them
      localStorage.setItem("draftCipc", data.registrationNumber);
      localStorage.setItem(
        "draftCompany",
        JSON.stringify({
          companyName: data.companyName,
          status: data.status,
          registeredAddress: data.registeredAddress,
        })
      );

      // Move to the next step (Company Information)
      navigate("/store-owner/stores/register/company-information");
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <StoreOwnerSidebar />

      <main className="main-content">

        {/* Page Header */}
        <header className="page-header">
          <div>
            <h1 className="page-title">Register a store</h1>
            <p className="page-subtitle">Verify your company before creating a store profile.</p>
          </div>

          {/* Header Actions */}
          <div className="header-actions">
            <StoreOwner_StoreSwitcher />
            <StoreOwner_UserMenu />
          </div>
        </header>

        {/* Progress Stepper */}
        <div className="card stepper-card">
          <div className="stepper">

            {/* Step 1: Active */}
            <div className="step active">
              <div className="step-circle">1</div>
              <span className="step-label">Company check</span>
            </div>

            <div className="step-divider"></div>

            {/* Step 2 */}
            <div className="step">
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

        {/* Main Content Grid */}
        <div className="register-layout-grid">

          {/* Left Side: Verification Form */}
          <div className="card verify-form-card">
            <h2 className="form-title">Verify your business</h2>
            <p className="form-desc">Enter the registration number of an existing company.</p>

            {/* Tag */}
            <div className="verification-tag">Store verification</div>

            <form className="verify-form" onSubmit={handleVerify} noValidate>
              <div className="input-group">
                <label>CIPC registration number *</label>
                <input
                  type="text"
                  className="form-input"
                  value={cipcNumber}
                  onChange={(e) => {
                    setCipcNumber(e.target.value);
                    setError(""); // the message disappears once they start typing
                  }}
                  placeholder="2024/123456/07"
                  required
                />
                <span className="input-hint">Format: YYYY/NNNNNN/NN</span>
                {error && (
                  <span style={{ color: "red", fontSize: "14px" }}>{error}</span>
                )}
              </div>

              <p className="form-note">
                We'll retrieve the company name, status and registered address.<br />
                Company information will be read-only.
              </p>

              <div className="form-actions-row">
                <Link
                  to="/store-owner/stores"
                  className="btn-outline"
                  style={{ textDecoration: "none" }}
                >
                  Back to stores
                </Link>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? "Verifying..." : "Verify business"}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Informational Sidebar */}
          <div className="card info-sidebar-card">
            <h3 className="info-title">Before you begin</h3>
            <ol className="info-list">
              <li>Have your CIPC number ready</li>
              <li>Check the returned company details</li>
              <li>Add your store profile and logo</li>
              <li>Review and submit</li>
            </ol>
          </div>

        </div>

      </main>
    </div>
  );
};

export default RegisterStore;