import "../../Style/components/auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import PasswordInput from "../../components/common/PasswordInput";

import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const AdminLogin = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(""); // For network errors (backend offline)
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // State for field-specific validation errors
  const [validationErrors, setValidationErrors] = useState({});

  // Clear specific field error as the user types
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (validationErrors.email) {
      setValidationErrors({ ...validationErrors, email: "" });
    }
    setError(""); // Clear network error if they start typing
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (validationErrors.password) {
      setValidationErrors({ ...validationErrors, password: "" });
    }
    setError(""); 
  };

  const validateForm = () => {
    const errors = {};
    const input = email.trim();

    // 1. Validate Email or Mobile Number format
    if (!input) {
      errors.email = "Please enter a valid email address";
    } else {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      const isPhone = /^(?:\+27|0)[6-8][0-9]{8}$/.test(input.replace(/\s/g, ''));

      if (!isEmail && !isPhone) {
        errors.email = "Please enter a valid email address or mobile number";
      }
    }

    // 2. Validate Password is not empty
    if (!password) {
      errors.password = "Invalid password or passcode";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear network errors

    // Run custom frontend validations (format checks)
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return; // Stop submission
    }

    setValidationErrors({});
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          role: "ADMIN" // <--- This tells the backend to check the Admin table
        })
      });

      const data = await response.json();

      // Handle specific errors based on backend status codes
      if (!response.ok) {
        if (response.status === 404) {
          setValidationErrors({ email: data.message });
          setLoading(false);
          return;
        }
        
        if (response.status === 401) {
          setValidationErrors({ password: data.message });
          setLoading(false);
          return;
        }

        throw new Error(data.message || "Login failed");
      }

      // Success! Save the token and role to local storage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userName", data.user.name);

      alert(`Welcome back, Admin ${data.user.name}!`);
      
      // Redirect to the Admin Dashboard
      // Make sure this route exists in your AppRoutes.jsx!
      navigate("/admin/dashboard"); 
      
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setError("Cannot connect to the server. Please ensure the backend is running.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper admin-login-page">
      
      <div className="login-content">
        
        {/* LEFT SIDE - HERO SECTION */}
        <div className="login-left">
          <div className="hero-background">
            <img src={BackgroundImage} alt="" className="bg-image" />
            <div className="overlay"></div>
          </div>

          <div className="left-content">
            <div className="logo-top">SpazaNet</div>
            <div className="welcome-text">
              <h1>Welcome back</h1>
              <p>Stock, sales and group buying for rural stores.</p>
            </div>
            <div className="partner-logo">
              <img src={Logo} alt="IIK Organisation Logo" className="partner-logo-img" />
              <span>IIK Organisation</span>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="login-right">
          <div className="form-wrapper">
            <h2>Sign in</h2>
            <p className="subtitle">Admin is selected by default. Choose your role to continue.</p>

            <div className="role-toggle">
              <Link to="/login/store-owner-staff" className="role-btn">Store</Link>
              <Link to="/login/supplier" className="role-btn">Supplier</Link>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              
              {/* Network Error Banner (Only shows if backend is offline) */}
              {error && (
                <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

              <div className="input-group">
                <label>Email or mobile number</label>
                <input 
                  type="text" 
                  value={email}
                  onChange={handleEmailChange}
                  className="form-input" 
                  placeholder="Enter admin email"
                />
                {validationErrors.email && (
                  <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    {validationErrors.email}
                  </span>
                )}
              </div>

              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  className="form-input" 
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                {validationErrors.password && (
                  <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                    {validationErrors.password}
                  </span>
                )}
              </div>

              <div className="form-actions">
                <div className="checkbox-group">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <button type="button" className="forgot-link" onClick={() => setShowForgotPassword(true)}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign in as Admin"}
              </button>
            </form>

            <div className="info-box">
              <p>Admin accounts are created by IIK. There is no self-registration</p>
            </div>
          </div>
        </div>

      </div>

      <Footer />

      {showForgotPassword && (
        <ForgotPasswordModal role="ADMIN" onClose={() => setShowForgotPassword(false)} />
      )}
      
    </div>
  );
};

export default AdminLogin;