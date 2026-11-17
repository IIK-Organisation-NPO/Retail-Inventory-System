import "../../Style/components/auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const AdminLogin = () => {
  const navigate = useNavigate();
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  
  // UI State
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    // DEBUG LOG - This will print in the browser console
    console.log("SENDING TO BACKEND:", { email, password, rememberMe });

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          roleName: "Admin", // Hardcoded for this page
          rememberMe: rememberMe
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name);

        // Redirect to Admin Dashboard
        navigate('/admin-dashboard'); 
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

            <form onSubmit={handleSubmit}>
              
              {/* Error Message */}
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
                  placeholder="admin@iik.co.za"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input
                  type="password"
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
                {isLoading ? "Signing in..." : "Sign in as Admin"}
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
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
      
    </div>
  );
};

export default AdminLogin;