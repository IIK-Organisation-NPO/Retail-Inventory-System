import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const LoginStoreOwnerStaff = () => {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (validationErrors.email) {
      setValidationErrors({ ...validationErrors, email: "" });
    }
    setError("");
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

    if (!input) {
      errors.email = "Please enter your email or mobile number";
    } else {
      const isPhone = /^(?:\+27|0)[6-8][0-9]{8}$/.test(input.replace(/\s/g, ''));
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      if (!isPhone && !isEmail) {
        errors.email = "Please enter a valid email or mobile number";
      }
    }

    if (!password) {
      errors.password = "Please enter your password";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
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
          role: "STORE", // Tells backend to check Owner AND Staff tables
          rememberMe: rememberMe
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save token, role and the signed-in person's name (shown in the header menu)
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userName", data.user.name);
      localStorage.setItem("userSurname", data.user.surname || "");

      alert(`Welcome back, ${data.user.name}!`);
      
      // Route based on whether they are an Owner or Staff
      if (data.role === "STAFF") {
        navigate("/staff/dashboard"); // Make sure this route exists for staff
      } else {
        navigate("/store-owner/dashboard");
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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
                  placeholder="Enter your email or phone"
                />
                {validationErrors.email && (
                  <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>
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
              New store owner? <Link to="/signupstoreowner">Register your store</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      {showForgotPassword && (
        <ForgotPasswordModal role="OWNER" onClose={() => setShowForgotPassword(false)} />
      )}
    
    </div>
  );
};

export default LoginStoreOwnerStaff;