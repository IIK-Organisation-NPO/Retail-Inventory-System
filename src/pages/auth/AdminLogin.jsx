import "../../Style/components/auth.css";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";

import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const AdminLogin = () => {
  const navigate = useNavigate();
  
  // State for form and UI feedback
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Save the token and role to local storage
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("userName", data.user.name);

      alert(`Welcome back, Admin ${data.user.name}!`);
      
      // Redirect to the Admin Dashboard (You will build this next)
      // navigate("/dashboard/admin"); 
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper admin-login-page">
      
      {/* MAIN CONTENT ROW (Left Image + Right Form) */}
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
              
              {/* Error Message Display */}
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input" 
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input" 
                  placeholder="Enter password"
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
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
      
    </div>
  );
};

export default AdminLogin;