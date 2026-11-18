import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordRequirements from "../../components/common/PasswordRequirements";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const OTP_LENGTH = 6;
const OTP_RESEND_SECONDS = 30;

const SignupSupplier = () => {
  const navigate = useNavigate();
  
  // --- Form State ---
  const [formData, setFormData] = useState({
    companyName: "",
    name: "",
    surname: "",
    email: "",
    mobileNumber: "",
    gender: "",
    disability: false,
    disabilityDescription: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  
  // --- Validation Errors State ---
  const [validationErrors, setValidationErrors] = useState({});
  
  // --- UI State ---
  const [error, setError] = useState(""); 
  const [loading, setLoading] = useState(false);

  // --- Verification Modal State ---
  const [showPopup, setShowPopup] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_SECONDS);

  const emailInputRef = useRef(null);
  const otpInputRefs = useRef([]);

  // Countdown before a new code can be requested
  useEffect(() => {
    if (!showPopup || resendSeconds === 0) return undefined;
    const timer = setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [showPopup, resendSeconds]);

  // Universal change handler
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || type === "radio" ? checked : value
    });
    if (validationErrors[name]) {
      setValidationErrors({ ...validationErrors, [name]: "" });
    }
  };

  const handleDisabilityChange = (isDisabled) => {
    setFormData({
      ...formData,
      disability: isDisabled,
      disabilityDescription: isDisabled ? formData.disabilityDescription : "" 
    });
  };

  // --- Validation Function ---
  const validateForm = () => {
    const errors = {};

    if (!formData.companyName.trim()) errors.companyName = "Please enter a company name";

    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!formData.name.trim()) errors.name = "Name is required";
    else if (!nameRegex.test(formData.name)) errors.name = "Name can only contain letters, spaces, hyphens, and apostrophes";

    if (!formData.surname.trim()) errors.surname = "Surname is required";
    else if (!nameRegex.test(formData.surname)) errors.surname = "Surname can only contain letters, spaces, hyphens, and apostrophes";

    if (!formData.email.trim()) errors.email = "Email address is required";

    const mobileRegex = /^(?:\+27|0)[6-8][0-9]{8}$/;
    if (!formData.mobileNumber.trim()) errors.mobileNumber = "Mobile number is required";
    else if (!mobileRegex.test(formData.mobileNumber.replace(/\s/g, ''))) errors.mobileNumber = "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)";

    if (!formData.gender) errors.gender = "Please select a gender in the list";

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) errors.password = "Use at least 8 characters, including UpperCase and lowerCase letters, a number and a special character";

    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match";
    
    if (!formData.acceptTerms) errors.acceptTerms = "You must agree to the Terms of Service and Privacy Policy to continue.";

    return errors;
  };

  // --- API Call: Register Supplier ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return; // Stop submission
    }

    setValidationErrors({});
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register/supplier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: formData.companyName,
          name: formData.name,
          surname: formData.surname,
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          gender: formData.gender,
          disability: formData.disability,
          disabilityDescription: formData.disability ? formData.disabilityDescription : null,
          password: formData.password
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      // Success! Show the verification popup
      setOtp(Array(OTP_LENGTH).fill(""));
      setOtpError("");
      setResendSeconds(OTP_RESEND_SECONDS);
      setShowPopup(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- API Call: Verify Email ---
  const handleVerifyEmail = async () => {
    if (otp.some((digit) => !digit)) {
      setOtpError("Enter all six digits to verify your email.");
      return;
    }

    setOtpError("");
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: formData.email, 
          otp: otp.join(""), 
          role: "SUPPLIER" 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verification failed");

      setShowPopup(false);
      setAccountCreated(true);
    } catch (err) {
      setOtpError(err.message);
    }
  };

  const handleResendCode = () => {
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setResendSeconds(OTP_RESEND_SECONDS);
    otpInputRefs.current[0]?.focus();
  };

  const handleOtpChange = (index, value) => {
    const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH - index);
    setOtpError("");
    if (!digits) {
      setOtp((currentOtp) => currentOtp.map((digit, position) => (
        position === index ? "" : digit
      )));
      return;
    }

    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp];
      digits.split("").forEach((digit, offset) => {
        nextOtp[index + offset] = digit;
      });
      return nextOtp;
    });

    const nextIndex = index + digits.length;
    otpInputRefs.current[Math.min(nextIndex, OTP_LENGTH - 1)]?.focus();
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleChangeEmail = () => {
    setShowPopup(false);
    requestAnimationFrame(() => {
      emailInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      emailInputRef.current?.focus();
    });
  };

  const maskedEmail = formData.email.replace(/^(.).+(@.*)$/, "$1***$2");

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
              <h1>Become one of us</h1>
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
              <button type="button" className="role-btn" onClick={() => navigate("/signupstoreowner")}>
                Store
              </button>
              <button type="button" className="role-btn active">Supplier</button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              
              {error && (
                <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                  {error}
                </div>
              )}

              <h3 className="section-title">Your details</h3>

              <div className="input-group">
                <label>Company name</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="form-input" />
                {validationErrors.companyName && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.companyName}</span>}
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" />
                  {validationErrors.name && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.name}</span>}
                </div>
                <div className="input-group">
                  <label>Surname</label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleChange} className="form-input" />
                  {validationErrors.surname && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.surname}</span>}
                </div>
              </div>

              <div className="input-group">
                <label>Email address</label>
                <input
                  ref={emailInputRef}
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                />
                {validationErrors.email && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.email}</span>}
              </div>

              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="form-input" placeholder="e.g., 0821234567 or +27821234567" />
                {validationErrors.mobileNumber && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.mobileNumber}</span>}
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="form-input select-input">
                    <option value="" disabled>Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {validationErrors.gender && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.gender}</span>}
                </div>
                <div className="input-group">
                  <label>Disability</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="disabilityRadio"
                        checked={formData.disability === true}
                        onChange={() => handleDisabilityChange(true)}
                      /> Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="disabilityRadio"
                        checked={formData.disability === false}
                        onChange={() => handleDisabilityChange(false)}
                      /> No
                    </label>
                  </div>
                </div>
              </div>

              {formData.disability && (
                <div className="input-group disability-details" style={{marginBottom: '15px'}}>
                  <label htmlFor="disability-type">What type of disability?</label>
                  <input
                    id="disability-type"
                    type="text"
                    name="disabilityDescription"
                    value={formData.disabilityDescription}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              )}

              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="new-password"
                />
                <PasswordRequirements password={formData.password} />
                {validationErrors.password && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.password}</span>}
              </div>
              
              <div className="input-group">
                <label>Confirm password</label>
                <PasswordInput
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="new-password"
                />
                {validationErrors.confirmPassword && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.confirmPassword}</span>}
              </div>

              <div className="terms-group">
                <input
                  type="checkbox"
                  name="acceptTerms"
                  id="supplier-terms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
                 <label htmlFor="supplier-terms">
                  I agree to the <a href="#" className="terms-link">Terms and Conditions</a> (POPIA compliant).
                </label>
              </div>
              {validationErrors.acceptTerms && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block', width: '100%' }}>{validationErrors.acceptTerms}</span>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="auth-footer-text">
              Already registered? <Link to="/login/supplier">Sign in</Link>
            </p>
          </div>
        </div>

      </div>
      <Footer />

      {/* VERIFICATION POPUP MODAL */}
      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>Verify your email</h2>
              <button type="button" className="modal-close-btn" onClick={() => setShowPopup(false)} aria-label="Close modal">✕</button>
            </div>

            <p className="modal-subtitle">
              We sent a 6-digit code to <strong>{maskedEmail}</strong>. Enter it below to activate your account.
            </p>

            <div className="otp-input-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => { otpInputRefs.current[index] = element; }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength="1"
                  className="otp-box"
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={(event) => {
                    event.preventDefault();
                    handleOtpChange(index, event.clipboardData.getData("text"));
                  }}
                  aria-label={`Verification digit ${index + 1}`}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="modal-info-box">
              <p>
                Didn't get an email? Check your spam folder.{" "}
                {resendSeconds > 0 ? (
                  <>You can request a new code in 0:{String(resendSeconds).padStart(2, "0")}.</>
                ) : (
                  <button type="button" className="resend-btn" onClick={handleResendCode}>Resend code</button>
                )}
              </p>
            </div>

            {otpError && <p className="field-error" role="alert">{otpError}</p>}
            <button type="button" className="modal-submit-btn" onClick={handleVerifyEmail}>Verify email</button>
            <button type="button" className="modal-secondary-btn" onClick={handleChangeEmail}>Change email address</button>
          </div>
        </div>
      )}

      {/* ACCOUNT CREATED MESSAGE */}
      {accountCreated && (
        <div className="modal-overlay">
          <div className="modal-card" role="status" aria-live="polite">
            <div className="modal-header">
              <h2>Account successfully created</h2>
            </div>
            <p className="modal-subtitle">
              Your email has been verified and your supplier account is ready. Sign in to continue.
            </p>
            <button type="button" className="modal-submit-btn" onClick={() => navigate("/login/supplier")}>
              Continue to sign in
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignupSupplier;