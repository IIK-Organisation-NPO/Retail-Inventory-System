import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const SignupSupplier = () => {
  const navigate = useNavigate();
  const [accountCreated, setAccountCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [termsError, setTermsError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    surname: "",
    email: "",
    mobileNumber: "",
    gender: "",
    disabilityDescription: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setApiError("");

    if (!termsAccepted) {
      setTermsError("You must agree to the Terms and Conditions to create an account.");
      return;
    }
    setTermsError("");

    if (formData.password !== formData.confirmPassword) {
      setApiError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: "Supplier", 
          companyName: formData.companyName,
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          gender: formData.gender,
          password: formData.password,
          disability: hasDisability,
          disabilityDescription: hasDisability ? formData.disabilityDescription : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAccountCreated(true);
      } else {
        setApiError(data.message);
      }
    } catch (error) {
      console.error(error);
      setApiError("Server is down. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessContinue = () => {
    setAccountCreated(false);
    navigate('/login/supplier');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-content signup-content">

        {/* LEFT SIDE: HERO SECTION */}
        <div className="login-left">
          <div className="hero-background">
            <img src={BackgroundImage} alt="Store background" className="bg-image" />
            <div className="overlay"></div>
          </div>

          <div className="left-content">
            <div className="logo-top">SpazaNet</div>
            <div className="welcome-text">
              <h1>Become one of us</h1>
              <p>Stock, sales and group buying for rural stores.</p>
            </div>
            <div className="partner-logo">
              <img src={Logo} alt="IIK Organisation Logo" className="partner-logo-img" />
              <span>IIK Organisation</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: SIGN UP FORM */}
        <div className="login-right signup-right">
          <div className="form-wrapper registration-wrapper">
            <h2>Create account</h2>

            <div className="role-toggle">
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate("/signupstoreowner")}
              >
                Store
              </button>
              <button type="button" className="role-btn active">Supplier</button>
            </div>

            <form onSubmit={handleCreateAccount}>
              
              {apiError && (
                <div style={{ color: '#d32f2f', backgroundColor: '#fde8e8', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
                  {apiError}
                </div>
              )}

              <h3 className="section-title">Your details</h3>

              <div className="input-group">
                <label>Company name</label>
                <input type="text" name="companyName" className="form-input" value={formData.companyName} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Name</label>
                  <input type="text" name="name" className="form-input" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="input-group">
                  <label>Surname</label>
                  <input type="text" name="surname" className="form-input" value={formData.surname} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group">
                <label>Email address</label>
                <input type="email" name="email" className="form-input" value={formData.email} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" name="mobileNumber" className="form-input" value={formData.mobileNumber} onChange={handleChange} required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Gender</label>
                  <select name="gender" className="form-input select-input" value={formData.gender} onChange={handleChange} required>
                    <option value="" disabled>Select your gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {hasDisability && (
                    <div className="disability-details">
                      <label htmlFor="disability-type">What type of disability?</label>
                      <input
                        id="disability-type"
                        type="text"
                        name="disabilityDescription"
                        className="form-input"
                        value={formData.disabilityDescription}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label>Disability</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input type="radio" name="disability" value="yes" checked={hasDisability} onChange={() => setHasDisability(true)} /> Yes
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="disability" value="no" checked={!hasDisability} onChange={() => setHasDisability(false)} /> No
                    </label>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  name="password"
                  className="form-input"
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <ul className="password-requirements">
                  <li>At least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li className="special-character-requirement">
                    At least one special character (e.g. ! @ # $ % ^ &amp; *)
                  </li>
                </ul>
              </div>

              <div className="input-group">
                <label>Confirm password</label>
                <PasswordInput
                  name="confirmPassword"
                  className="form-input"
                  minLength={8}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="terms-group">
                <input
                  type="checkbox"
                  id="supplier-terms"
                  checked={termsAccepted}
                  onChange={(event) => {
                    setTermsAccepted(event.target.checked);
                    if (event.target.checked) setTermsError("");
                  }}
                />
                <label htmlFor="supplier-terms">
                  I agree to the <a href="#" className="terms-link">Terms and Conditions</a> (POPIA compliant).
                </label>
              </div>
              {termsError && (
                <p id="supplier-terms-error" className="field-error" role="alert">
                  {termsError}
                </p>
              )}

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="auth-footer-text">
              Already registered? <Link to="/login/supplier">Sign in</Link>
            </p>
          </div>
        </div>

      </div>

      <Footer />

      {/* SUCCESS MODAL */}
      {accountCreated && (
        <div className="modal-overlay">
          <div className="modal-card" role="status" aria-live="polite">
            <div className="modal-header">
              <h2>Account successfully created</h2>
            </div>
            <p className="modal-subtitle">
              Your supplier account is ready. You can now sign in.
            </p>
            <button
              type="button"
              className="modal-submit-btn"
              onClick={handleSuccessContinue}
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignupSupplier;