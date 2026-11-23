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
      errors.email = "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567) or Email address is required";
    } else {
      const isPhone = /^(?:\+27|0)[6-8][0-9]{8}$/.test(input.replace(/\s/g, ''));
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);

      if (!isPhone && !isEmail) {
        errors.email = "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567) or Email address is required";
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
          role: "SUPPLIER" // <-- Important: Role is SUPPLIER here
        })
      });

      const data = await response.json();

      // Handle specific errors based on backend status codes
      if (!response.ok) {
        if (response.status === 404) {
          // Email not found in database
          setValidationErrors({ email: data.message });
          setLoading(false);
          return;
        }
        
        if (response.status === 401) {
          // Password incorrect
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

      alert(`Welcome back, ${data.user.name}!`);
      
      // Redirect to the Supplier Dashboard
      navigate("/supplier/dashboard"); 
      
    } catch (err) {
      // This ONLY catches network errors (e.g., if backend is not running)
      if (err.message === "Failed to fetch") {
        setError("Cannot connect to the server. Please ensure the backend is running.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = (event) => {
    event.preventDefault();
    navigate("/supplier/dashboard");
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
            <p className="subtitle">Sign in as a supplier to continue.</p>

            <div className="role-toggle">
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate("/login/store-owner-staff")}
              >
                Store
              </button>
              <button type="button" className="role-btn active">Supplier</button>
            </div>

<<<<<<< HEAD
            {/* Added noValidate to prevent browser default popups */}
            <form onSubmit={handleSubmit} noValidate>
              
              {/* Network Error Banner (Only shows if backend is offline) */}
              {error && (
                <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px' }}>
                  {error}
                </div>
              )}

=======
            {/* Main Login Form */}
            <form onSubmit={handleSignIn}>
              {/* Email/Phone Input Field */}
>>>>>>> origin/kgotso
              <div className="input-group">
                <label>Email or mobile number</label>
                <input
                  type="text"
                  value={email}
                  onChange={handleEmailChange}
                  className="form-input"
                  placeholder="Enter your email or phone"
                />
                {/* Email/Phone Validation Error */}
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
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                {/* Password Validation Error */}
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
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="auth-footer-text">
              New Supplier? <Link to="/signupsupplier">Register your company</Link>
            </p>
          </div>
        </div>

      </div>

      <Footer />

      {showForgotPassword && (
        <ForgotPasswordModal role="SUPPLIER" onClose={() => setShowForgotPassword(false)} />
      )}

    </div>
  );
};

export default LoginSupplier;