import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

// Maps raw backend error messages to user-friendly, non-revealing messages.
const mapServerError = (message, expectedRole) => {
  if (!message) return "An unknown error occurred.";
  const msg = message.toLowerCase();

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
  if (msg.includes("role") || msg.includes("not registered as")) {
    return `This account is not registered as a ${expectedRole}.`;
  }

  return "Server is down. Please check your connection.";
};

const LoginStoreOwnerStaff = () => {
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
    const cleanEmail = email.trim(); // trim silently

    // Identifier validation (Email or SA Mobile)
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

    // Password validation (login — no complexity rules)
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

    // Determine role name (existing logic kept)
    const roleName = email.toLowerCase().includes("staff") ? "Store Staff" : "Store Owner";

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: cleanEmail, // trimmed
          password: password,
          roleName: roleName,
          rememberMe: rememberMe
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Pass "Store" as the expectedRole so the error message reads "This account is not registered as a Store."
        const friendlyError = mapServerError(data.message, "Store");
        throw new Error(friendlyError);
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userName", data.user.name);

      // REMOVED the alert() here so the redirect is instant. 
      // If you want a welcome message, you should use a toast notification library later.
      
      if (data.user.role === "Store Staff") {
        // Temporarily pointing to the main dashboard until you build the staff specific one
        navigate("/dashboard"); 
      } else {
        // Matches the path in your AppRoutes.jsx
        navigate("/store-owner/dashboard");
      }
      
    } catch (err) {
      setError(err.message);
      setPassword(""); // clear password on failed attempt
    } finally {
      setLoading(false);
    }
  };

  // Clear field error as the user types
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (validationErrors.email) setValidationErrors({ ...validationErrors, email: "" });
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (validationErrors.password) setValidationErrors({ ...validationErrors, password: "" });
    if (error) setError("");
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-content">
        
        <div className="login-left">
          <div className="hero-background">
            <img src={BackgroundImage} alt="Store background" className="bg-image" />
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
            <p className="subtitle">Sign in as a store owner or a staff member to continue.</p>

            <div className="role-toggle">
              <button type="button" className="role-btn active">Store</button>
              <Link to="/login/supplier" className="role-btn">Supplier</Link>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              
              {error && (
                <div style={{ color: '#d32f2f', backgroundColor: '#fde8e8', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
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
                  placeholder="Enter your email"
                />
                {validationErrors.email && (
                  <span style={{ color: '#d32f2f', fontSize: '12px', marginTop: '5px', display: 'block', fontWeight: '500' }}>
                    {validationErrors.email}
                  </span>
                )}
              </div>

              <div className="input-group">
                <label>Password or user code (for Staff)</label>
                <PasswordInput
                  value={password}
                  onChange={handlePasswordChange}
                  className="form-input" 
                  placeholder="Enter your password"
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
                <button type="button" className="forgot-link" onClick={() => setShowForgotPassword(true)}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="auth-footer-text">
              New store owner? <Link to="/signupstoreowner">Register your store</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      {showForgotPassword && (
        <ForgotPasswordModal 
          roleName={email.toLowerCase().includes("staff") ? "Store Staff" : "Store Owner"} 
          onClose={() => setShowForgotPassword(false)} 
        />
      )}
    
    </div>
  );
};

export default LoginStoreOwnerStaff;