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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Form state
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  // UI state
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Stop page refresh
    setIsLoading(true);
    setErrorMessage("");

    // Since this page handles both Owner and Staff, we temporarily check the email.
    // If you have a role dropdown, use that instead.
    const roleName = email.toLowerCase().includes("staff") ? "Staff" : "Owner";

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          roleName: roleName,
          rememberMe: rememberMe
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Save token to localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name);

        // Redirect based on role
        if (data.user.role === "Staff") {
          navigate('/staff-dashboard'); // Update if your route is different
        } else {
          navigate('/owner-dashboard'); // Update if your route is different
        }
      } else {
        setErrorMessage(data.message);
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Server is down or CORS is blocking the request.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      
      <div className="login-content">
        
        {/* LEFT SIDE: HERO SECTION */}
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

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="login-right">
          <div className="form-wrapper">
            
            <h2>Sign in</h2>
            <p className="subtitle">Sign in as a store owner or a staff member to continue.</p>

            <div className="role-toggle">
              <button className="role-btn active">Store</button>
              <Link to="/login/supplier" className="role-btn">Supplier</Link>
            </div>

            {/* Main Login Form */}
            <form onSubmit={handleSubmit}>
              
              {/* Error Message Display */}
              {errorMessage && (
                <div style={{ color: '#d32f2f', backgroundColor: '#fde8e8', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
                  {errorMessage}
                </div>
              )}

              <div className="input-group">
                <label>Email or mobile number</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@tuckshop.co.za"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password or user code (for Staff)</label>
                <PasswordInput
                  className="form-input" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
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

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
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
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
      
    </div>
  );
};

export default LoginStoreOwnerStaff;