import "../../Style/components/auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import PasswordInput from "../../components/common/PasswordInput";

import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

// Helper for mapping server errors to user-friendly messages
const mapServerError = (message, expectedRole) => {
  if (!message) return "An unknown error occurred.";
  const msg = message.toLowerCase();

  // Generic credentials error (covers wrong password & account not found)
  if (msg.includes("incorrect") || msg.includes("not found") || msg.includes("invalid") || msg.includes("failed")) {
    return "Incorrect email or password.";
  }
  if (msg.includes("verify")) {
    return "Please verify your email before signing in.";
  }
  if (msg.includes("deactivated") || msg.includes("suspended")) {
    return "Your account has been deactivated. Contact support.";
  }
  if (msg.includes("too many")) {
    return "Too many attempts. Try again in 15 minutes.";
  }
  // Role mismatch handling
  if (msg.includes("role") || msg.includes("not registered as")) {
     return `This account is not registered as a ${expectedRole}.`;
  }

  return "Server is down. Please check your connection.";
};

const AdminLogin = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // --- START VALIDATION ---
    const errors = {};
    
    // Silently trim the identifier
    const cleanEmail = email.trim();
    
    // Identifier Validation (Email or Mobile)
    if (!cleanEmail) {
      errors.email = "Email is required.";
    } else if (cleanEmail.length > 254) {
      errors.email = "Email is too long.";
    } else {
      const isEmail = cleanEmail.includes("@");
      const isPhone = /^[0-9+]+$/.test(cleanEmail);

      if (isEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(cleanEmail)) {
          errors.email = "Enter a valid email address.";
        }
      } else if (isPhone) {
        const saPhoneRegex = /^(?:\+27|0)[6-8][0-9]{8}$/;
        if (!saPhoneRegex.test(cleanEmail)) {
          errors.email = "Enter a valid SA mobile number.";
        }
      } else {
        errors.email = "Enter a valid email address or mobile number.";
      }
    }

    // Password Validation
    if (!password || password.trim() === "") {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    // --- END VALIDATION ---

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail, // Send the trimmed value
          password: password,
          roleName: "Admin",
          rememberMe: rememberMe
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Map the error using our helper
        const friendlyError = mapServerError(data.message, "Admin");
        throw new Error(friendlyError);
      }

      const userName = data?.user?.name ?? "Admin";
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("role", data.user.role);
      storage.setItem("userName", userName);

      navigate("/dashboard/admin");
    } catch (err) {
      setError(err.message);
      // Clear password on failed attempt as requested
      setPassword(""); 
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Clear error as soon as user types
    if (validationErrors.email) setValidationErrors({...validationErrors, email: ""});
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    // Clear error as soon as user types
    if (validationErrors.password) setValidationErrors({...validationErrors, password: ""});
    if (error) setError("");
  };

  return (
    <div className="login-page-wrapper admin-login-page">
      <div className="login-content">
        
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

        <div className="login-right">
          <div className="form-wrapper">
            <h2>Sign in</h2>
            <p className="subtitle">
              Admin is selected by default. Choose your role to continue.
            </p>

            <div className="role-toggle">
              <Link to="/login/store-owner-staff" className="role-btn">
                Store
              </Link>
              <Link to="/login/supplier" className="role-btn">
                Supplier
              </Link>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {error && (
                <div
                  style={{
                    color: "#d32f2f",
                    backgroundColor: "#fde8e8",
                    padding: "10px",
                    borderRadius: "5px",
                    marginBottom: "15px",
                    fontSize: "14px",
                    fontWeight: "bold"
                  }}
                >
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
                  <span style={{ color: '#d32f2f', fontSize: '12px', marginTop: '5px', display: 'block', fontWeight: '500' }}>
                    {validationErrors.email}
                  </span>
                )}
              </div>

              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  name="password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
                {validationErrors.password && (
                  <span style={{ color: '#d32f2f', fontSize: '12px', marginTop: '5px', display: 'block', fontWeight: '500' }}>
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
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign in as Admin"}
              </button>
            </form>

            <div className="info-box">
              <p>Admin accounts are created by IIK. There is no self-registration.</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {showForgotPassword && (
        <ForgotPasswordModal
          roleName="Admin"
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </div>
  );
};

export default AdminLogin;