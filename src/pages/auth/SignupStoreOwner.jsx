import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordRequirements from "../../components/common/PasswordRequirements";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const OTP_LENGTH = 6;

const SignupStoreOwner = () => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "", surname: "", email: "", mobileNumber: "", 
    gender: "", disability: false, disabilityDescription: "", 
    password: "", confirmPassword: "", acceptTerms: false
  });

  // Validation Errors State
  const [errors, setErrors] = useState({});

  // OTP State
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef([]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ 
      ...formData, 
      [name]: type === "checkbox" || type === "radio" ? checked : value 
    });
    
    // Clear error for this specific field when the user starts typing again
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    // Clear general API error if present
    if (errors.api) {
      setErrors((prev) => ({ ...prev, api: "" }));
    }
  };

  const handleDisabilityChange = (isDisabled) => {
    setFormData({
      ...formData,
      disability: isDisabled,
      disabilityDescription: isDisabled ? formData.disabilityDescription : ""
    });
  };

  // STEP 1: Send the OTP
  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setErrors({}); // Reset all errors before validating

    // --- CLIENT-SIDE VALIDATION ---
    const nameRegex = /^[A-Za-z\s\-']+$/;
    const mobileRegex = /^(?:\+27|0)[6-8][0-9]{8}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    
    let newErrors = {};

    if (!formData.name.trim() || !nameRegex.test(formData.name)) {
      newErrors.name = "Please enter a valid Name (letters only).";
    }
    if (!formData.surname.trim() || !nameRegex.test(formData.surname)) {
      newErrors.surname = "Please enter a valid Surname (letters only).";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      newErrors.email = "Please enter a valid Email address.";
    }
    if (!formData.mobileNumber.trim() || !mobileRegex.test(formData.mobileNumber.replace(/\s/g, ""))) {
      newErrors.mobileNumber = "Please enter a valid SA Mobile number (e.g., 0821234567).";
    }
    if (!formData.gender) {
      newErrors.gender = "Please select a Gender.";
    }
    if (!passwordRegex.test(formData.password)) {
      newErrors.password = "Password does not meet the requirements below.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must agree to the Terms and Conditions.";
    }

    // If validation fails, stop here and show errors
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    // ------------------------------

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: "Store Owner",
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          gender: formData.gender,
          password: formData.password,
          disability: formData.disability,
          disabilityDescription: formData.disability ? formData.disabilityDescription : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowPopup(true); 
      } else {
        // Check if the backend explicitly says the email exists
        if (data.message && data.message.toLowerCase().includes("already exists")) {
          setErrors({ email: "This email is already registered. Please sign in." });
        } else if (data.message && data.message.toLowerCase().includes("mobile")) {
          // Catch mobile number duplicate error
          setErrors({ mobileNumber: data.message });
        } else {
          // General API error banner
          setErrors({ api: data.message || "An error occurred during signup." });
        }
      }
    } catch (error) {
      console.error(error);
      setErrors({ api: "Server is down. Please check your connection." });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP & Register
  const handleVerifyEmail = async () => {
    const otpString = otp.join("");
    if (otpString.length < OTP_LENGTH) {
      setOtpError("Enter all 6 digits.");
      return;
    }

    setIsLoading(true);
    setOtpError("");
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: otpString, 
          roleName: "Store Owner" 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowPopup(false);
        setAccountCreated(true);
      } else {
        setOtpError(data.message);
      }
    } catch (error) {
      console.error(error);
      setOtpError("Server error during verification.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH - index);
    setOtpError("");
    if (!digits) {
      setOtp((current) => current.map((d, i) => (i === index ? "" : d)));
      return;
    }
    setOtp((current) => {
      const next = [...current];
      digits.split("").forEach((d, offset) => { next[index + offset] = d; });
      return next;
    });
    const nextIndex = index + digits.length;
    otpInputRefs.current[Math.min(nextIndex, OTP_LENGTH - 1)]?.focus();
  };

  const handleSuccessContinue = () => {
    setAccountCreated(false);
    navigate('/login/store-owner-staff');
  };

  // Helper for inline error rendering
  const renderError = (fieldName) => {
    return errors[fieldName] ? (
      <span style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px', display: 'block', fontWeight: '500' }}>
        {errors[fieldName]}
      </span>
    ) : null;
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-content signup-content">

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

        <div className="login-right signup-right">
          <div className="form-wrapper registration-wrapper">
            <h2>Create account</h2>

            <div className="role-toggle">
              <button className="role-btn active">Store</button>
              <Link to="/signupsupplier" className="role-btn">Supplier</Link>
            </div>

            <form onSubmit={handleCreateAccount} noValidate>
              
              {/* GENERAL API ERROR BANNER (For unexpected server errors) */}
              {errors.api && (
                <div style={{ color: '#d32f2f', backgroundColor: '#fde8e8', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                  {errors.api}
                </div>
              )}

              <h3 className="section-title">Your details</h3>

              <div className="form-row">
                <div className="input-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    className="form-input" 
                    value={formData.name} 
                    onChange={handleChange} 
                  />
                  {renderError("name")}
                </div>
                <div className="input-group">
                  <label>Surname</label>
                  <input 
                    type="text" 
                    name="surname" 
                    className="form-input" 
                    value={formData.surname} 
                    onChange={handleChange} 
                  />
                  {renderError("surname")}
                </div>
              </div>

              <div className="input-group">
                <label>Email address</label>
                <input 
                  type="email" 
                  name="email" 
                  className="form-input" 
                  value={formData.email} 
                  onChange={handleChange} 
                />
                {renderError("email")}
              </div>

              <div className="input-group">
                <label>Mobile number</label>
                <input 
                  type="tel" 
                  name="mobileNumber" 
                  className="form-input" 
                  value={formData.mobileNumber} 
                  onChange={handleChange} 
                  placeholder="e.g., 0821234567" 
                />
                {renderError("mobileNumber")}
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Gender</label>
                  <select 
                    name="gender" 
                    className="form-input select-input" 
                    value={formData.gender} 
                    onChange={handleChange}
                  >
                    <option value="" disabled>Select your gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {renderError("gender")}
                </div>
                <div className="input-group">
                  <label>Disability</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input type="radio" checked={formData.disability === true} onChange={() => handleDisabilityChange(true)} /> Yes
                    </label>
                    <label className="radio-label">
                      <input type="radio" checked={formData.disability === false} onChange={() => handleDisabilityChange(false)} /> No
                    </label>
                  </div>
                </div>
              </div>

              {formData.disability && (
                <div className="input-group disability-details">
                  <label>What type of disability?</label>
                  <input 
                    type="text" 
                    name="disabilityDescription" 
                    className="form-input" 
                    value={formData.disabilityDescription} 
                    onChange={handleChange} 
                  />
                </div>
              )}

              <div className="input-group">
                <label>Password</label>
                <PasswordInput 
                  name="password" 
                  className="form-input" 
                  autoComplete="new-password" 
                  value={formData.password} 
                  onChange={handleChange} 
                />
                <PasswordRequirements password={formData.password} />
                {renderError("password")}
              </div>

              <div className="input-group">
                <label>Confirm password</label>
                <PasswordInput 
                  name="confirmPassword" 
                  className="form-input" 
                  autoComplete="new-password" 
                  value={formData.confirmPassword} 
                  onChange={handleChange} 
                />
                {renderError("confirmPassword")}
              </div>

              <div className="terms-group" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    name="acceptTerms" 
                    id="store-terms" 
                    checked={formData.acceptTerms} 
                    onChange={handleChange} 
                  />
                  <label htmlFor="store-terms" style={{ marginLeft: '8px' }}>
                    I agree to the <a href="#" className="terms-link">Terms and Conditions</a> (POPIA compliant).
                  </label>
                </div>
                {renderError("acceptTerms")}
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Create account"}
              </button>
            </form>

            <p className="auth-footer-text">
              Already registered? <Link to="/login/store-owner-staff">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Verify your email</h2>
              <button className="modal-close-btn" onClick={() => setShowPopup(false)}>✕</button>
            </div>
            <p className="modal-subtitle">We sent a 6-digit code to <strong>{formData.email}</strong>.</p>
            <div className="otp-input-group">
              {otp.map((digit, index) => (
                <input 
                  key={index} 
                  ref={(el) => { otpInputRefs.current[index] = el; }} 
                  type="text" 
                  maxLength="1" 
                  className="otp-box" 
                  value={digit} 
                  onChange={(e) => handleOtpChange(index, e.target.value)} 
                />
              ))}
            </div>
            {otpError && <p className="field-error" style={{color: '#d32f2f', fontSize: '12px', marginTop: '4px'}}>{otpError}</p>}
            <button type="button" className="modal-submit-btn" onClick={handleVerifyEmail} disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify email"}
            </button>
          </div>
        </div>
      )}

      {accountCreated && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Account successfully created</h2>
            <p>Your account is ready. You can now sign in.</p>
            <button type="button" className="modal-submit-btn" onClick={handleSuccessContinue}>Continue to Login</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupStoreOwner;