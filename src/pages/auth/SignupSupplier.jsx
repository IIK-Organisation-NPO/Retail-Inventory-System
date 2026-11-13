import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const SignupSupplier = () => {
  const navigate = useNavigate();
  const [hasDisability, setHasDisability] = useState(false);

  return (
    // Main page wrapper using CSS Grid to keep footer at the bottom
    <div className="login-page-wrapper">

      {/* Main content area split into left (image) and right (form) panels */}
      <div className="login-content signup-content">

        {/* =========================================
            LEFT SIDE: HERO SECTION
            ========================================= */}
        <div className="login-left">

          {/* Background image with a dark overlay */}
          <div className="hero-background">
            <img src={BackgroundImage} alt="Store background" className="bg-image" />
            <div className="overlay"></div>
          </div>

          {/* Content layered on top of the background image */}
          <div className="left-content">
            <div className="logo-top">SpazaNet</div>

            <div className="welcome-text">
              <h1>Become one of us</h1>
              <p>Stock, sales and group buying for rural stores.</p>
            </div>

            {/* Bottom Partner Logo */}
            <div className="partner-logo">
              <img src={Logo} alt="IIK Organisation Logo" className="partner-logo-img" />
              <span>IIK Organisation</span>
            </div>
          </div>
        </div>

        {/* =========================================
            RIGHT SIDE: SIGN UP FORM
            ========================================= */}
        <div className="login-right signup-right">
          <div className="form-wrapper registration-wrapper">

            {/* Form Header */}
            <h2>Create account</h2>

            {/* Role Selection Toggle (Supplier / Store) */}
            <div className="role-toggle">
              <button type="button" className="role-btn active">Supplier</button>
              {/* 'Store' switches to the store owner sign up page */}
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate("/signupstoreowner")}
              >
                Store
              </button>
            </div>

            <form>
              {/* Section Title */}
              <h3 className="section-title">Your details</h3>

              {/* Company Name Input */}
              <div className="input-group">
                <label>Company name</label>
                <input type="text" className="form-input" />
              </div>

              {/* Name & Surname Row */}
              <div className="form-row">
                <div className="input-group">
                  <label>Name</label>
                  <input type="text" className="form-input" />
                </div>
                <div className="input-group">
                  <label>Surname</label>
                  <input type="text" className="form-input" />
                </div>
              </div>

              {/* Email Input */}
              <div className="input-group">
                <label>Email address</label>
                <input type="email" className="form-input" />
              </div>

              {/* Mobile Number Input */}
              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" className="form-input" />
              </div>

              {/* Gender & Disability Row */}
              <div className="form-row">
                <div className="input-group">
                  <label>Gender</label>
                  <select className="form-input select-input" defaultValue="">
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
                        name="disability"
                        value="yes"
                        checked={hasDisability}
                        onChange={() => setHasDisability(true)}
                      /> Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="disability"
                        value="no"
                        checked={!hasDisability}
                        onChange={() => setHasDisability(false)}
                      /> No
                    </label>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label>Password</label>
                <input type="password" className="form-input" />
              </div>

              {/* Confirm Password Input */}
              <div className="input-group">
                <label>Confirm password</label>
                <input type="password" className="form-input" />
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="terms-group">
                <input type="checkbox" id="terms" />
                <label htmlFor="terms">
                  I agree to the <a href="#" className="terms-link">Terms and Conditions</a> (POPIA compliant).
                </label>
              </div>

              {/* Form Submit Button */}
              <button type="submit" className="submit-btn">
                Create account
              </button>
            </form>

            {/* Login Redirect Link */}
            <p className="auth-footer-text">
              Already registered? <Link to="/login/supplier">Sign in</Link>
            </p>
          </div>
        </div>

      </div>

      {/* Global Footer Component */}
      <Footer />

    </div>
  );
};

export default SignupSupplier;
