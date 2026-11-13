// Import the CSS from the styles folder (filename is auth.css)
import "../../Style/components/auth.css";
import { useState } from "react";
import { Link } from "react-router-dom";

// Import the Footer and Forgot Password popup components from the common folder
import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";

// Import images from assets/images
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const AdminLogin = () => {
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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

            {/* Bottom Logo (Using the imported Logo from assets) */}
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
              <button className="role-btn">Supplier</button>
            </div>

            <form>
              <div className="input-group">
                <label>Email or mobile number</label>
                <input 
                  type="text" 
                  defaultValue="admin@iik.co.za" 
                  className="form-input" 
                />
              </div>

              <div className="input-group">
                <label>Password</label>
                <input 
                  type="password" 
                  defaultValue="••••••••" 
                  className="form-input" 
                />
              </div>

              <div className="form-actions">
                <div className="checkbox-group">
                  <input type="checkbox" id="remember" defaultChecked />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <button type="button" className="forgot-link" onClick={() => setShowForgotPassword(true)}>
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="submit-btn">
                Sign in as Admin
              </button>
            </form>

            <div className="info-box">
              <p>Admin accounts are created by IIK. There is no self-registration</p>
            </div>
          </div>
        </div>

      </div>

      {/* FOOTER COMPONENT */}
      <Footer />

      {/* FORGOT PASSWORD POPUP */}
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
      
    </div>
  );
};

export default AdminLogin;