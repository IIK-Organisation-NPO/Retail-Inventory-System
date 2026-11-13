import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const LoginSupplier = () => {
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  return (
    // Main page wrapper using CSS Grid to keep footer at the bottom
    <div className="login-page-wrapper">

      {/* Main content area split into left (image) and right (form) panels */}
      <div className="login-content">

        {/* =========================================
            LEFT SIDE: HERO SECTION
            ========================================= */}
        <div className="login-left">

          {/* Background image with a dark overlay for text readability */}
          <div className="hero-background">
            <img src={BackgroundImage} alt="Store background" className="bg-image" />
            <div className="overlay"></div>
          </div>

          {/* Content layered on top of the background image */}
          <div className="left-content">
            {/* Top Brand Logo */}
            <div className="logo-top">SpazaNet</div>

            {/* Main Welcome Message */}
            <div className="welcome-text">
              <h1>Welcome back</h1>
              <p>Stock, sales and group buying for rural stores.</p>
            </div>

            {/* Bottom Partner Logo (IIK Organisation) */}
            <div className="partner-logo">
              <img src={Logo} alt="IIK Organisation Logo" className="partner-logo-img" />
              <span>IIK Organisation</span>
            </div>
          </div>
        </div>

        {/* =========================================
            RIGHT SIDE: LOGIN FORM
            ========================================= */}
        <div className="login-right">
          <div className="form-wrapper">

            {/* Form Header */}
            <h2>Sign in</h2>
            <p className="subtitle">Sign in as a supplier to continue.</p>

            {/* Role Selection Toggle (Store / Supplier) */}
            <div className="role-toggle">
              {/* 'Store' switches to the store owner & staff login page */}
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate("/login/store-owner-staff")}
              >
                Store
              </button>
              <button type="button" className="role-btn active">Supplier</button>
            </div>

            {/* Main Login Form */}
            <form>
              {/* Email/Phone Input Field */}
              <div className="input-group">
                <label>Email or mobile number</label>
                <input
                  type="text"
                  defaultValue="sales@supplier.co.za"
                  className="form-input"
                />
              </div>

              {/* Password Input Field */}
              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  defaultValue="••••••••"
                  className="form-input"
                />
              </div>

              {/* Remember Me & Forgot Password Links */}
              <div className="form-actions">
                <div className="checkbox-group">
                  <input type="checkbox" id="remember" defaultChecked />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <button type="button" className="forgot-link" onClick={() => setShowForgotPassword(true)}>
                  Forgot password?
                </button>
              </div>

              {/* Form Submit Button */}
              <button type="submit" className="submit-btn">
                Sign in
              </button>
            </form>

            {/* Registration Call-to-Action for New Suppliers */}
            <p className="auth-footer-text">
              New Supplier? <Link to="/signupsupplier">Register your company</Link>
            </p>
          </div>
        </div>

      </div>

      {/* Global Footer Component */}
      <Footer />

      {/* Forgot Password Popup */}
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}

    </div>
  );
};

export default LoginSupplier;
