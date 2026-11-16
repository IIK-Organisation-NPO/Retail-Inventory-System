import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const SignupSupplier = () => {
  const navigate = useNavigate();
  const [hasDisability, setHasDisability] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  const handleCreateAccount = (event) => {
    event.preventDefault();
    if (!termsAccepted) {
      setTermsError("You must agree to the Terms and Conditions to create an account.");
      return;
    }
    setTermsError("");
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

            {/* Role Selection Toggle (Store / Supplier) */}
            <div className="role-toggle">
              {/* 'Store' switches to the store owner sign up page */}
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
              {/* Section Title */}
              <h3 className="section-title">Your details</h3>

              {/* Company Name */}
              <div className="input-group">
                <label>Company name</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="form-input" required />
              </div>

              {/* Name & Surname */}
              <div className="form-row">
                <div className="input-group">
                  <label>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
                </div>
                <div className="input-group">
                  <label>Surname</label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              {/* Email */}
              <div className="input-group">
                <label>Email address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
              </div>

              {/* Mobile */}
              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="form-input" required />
              </div>

              {/* Gender & Disability */}
              <div className="form-row">
                <div className="input-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="form-input select-input" required>
                    <option value="" disabled>Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {hasDisability && (
                    <div className="disability-details">
                      <label htmlFor="disability-type">What type of disability?</label>
                      <input
                        id="disability-type"
                        type="text"
                        className="form-input"
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label>Disability</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="disabilityRadio"
                        checked={formData.disability === true}
                        onChange={() => handleDisabilityChange(true)}
                      /> Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="disabilityRadio"
                        checked={formData.disability === false}
                        onChange={() => handleDisabilityChange(false)}
                      /> No
                    </label>
                  </div>
                </div>
              </div>

              {/* Disability Description */}
              {formData.disability && (
                <div className="input-group disability-details" style={{marginBottom: '15px'}}>
                  <label htmlFor="disability-type">What type of disability?</label>
                  <input
                    id="disability-type"
                    type="text"
                    name="disabilityDescription"
                    value={formData.disabilityDescription}
                    onChange={handleChange}
                    className="form-input"
                    required={formData.disability}
                  />
                </div>
              )}

              {/* Passwords */}
              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  className="form-input"
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
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
                  className="form-input"
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
                  required
                />
              </div>

              {/* Terms */}
              <div className="terms-group">
                <input
                  type="checkbox"
                  id="supplier-terms"
                  checked={termsAccepted}
                  onChange={(event) => {
                    setTermsAccepted(event.target.checked);
                    if (event.target.checked) setTermsError("");
                  }}
                  aria-describedby={termsError ? "supplier-terms-error" : undefined}
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

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="auth-footer-text">
              Already registered? <Link to="/login/supplier">Sign in</Link>
            </p>
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
};

export default SignupSupplier;