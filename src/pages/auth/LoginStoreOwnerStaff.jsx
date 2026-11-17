import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const LoginStoreOwnerStaff = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/dashboard");
  };

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
            <p className="subtitle">Sign in as a store owner or a staff member to continue.</p>

            {/* Role Selection Toggle (Store / Supplier) */}
            <div className="role-toggle">
              {/* 'active' class highlights the currently selected role */}
              <button className="role-btn active">Store</button>
              <Link to="/login/supplier" className="role-btn">Supplier</Link>
            </div>

            {/* Main Login Form */}
            <form onSubmit={handleSubmit}>
              {/* Email/Phone Input Field */}
              <div className="input-group">
                <label>Email or mobile number</label>
                <input 
                  type="text" 
                  defaultValue="owner@tuckshop.co.za" 
                  className="form-input" 
                />
              </div>

              {/* Password Input Field */}
              <div className="input-group">
                <label>Password or user code( for Staff)</label>
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

            {/* Registration Call-to-Action for New Users */}
            <p className="auth-footer-text">
              New store owner? <Link to="/signupstoreowner">Register your store</Link>
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

export default LoginStoreOwnerStaff;
