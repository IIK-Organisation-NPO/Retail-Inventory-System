import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

// Import the stylesheet for the auth/registration pages
import "../../Style/components/auth.css";

// Import the shared Footer component
import Footer from "../../components/common/Footer";
import PasswordInput from "../../components/common/PasswordInput";

// Import background and logo images from the assets directory
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const OTP_LENGTH = 6;
const OTP_RESEND_SECONDS = 30;

const SignupStoreOwner = () => {
  // State to control the visibility of the verification popup
  const [showPopup, setShowPopup] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [email, setEmail] = useState("owner@tuckshop.co.za");
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_SECONDS);
  const [termsError, setTermsError] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasDisability, setHasDisability] = useState(false);
  const emailInputRef = useRef(null);
  const otpInputRefs = useRef([]);
  const termsInputRef = useRef(null);

  useEffect(() => {
    if (!showPopup || resendSeconds === 0) return undefined;

    const timer = setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showPopup, resendSeconds]);

  // Handler for the main form submission
  const handleCreateAccount = (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setTermsError("You must agree to the Terms and Conditions to create an account.");
      termsInputRef.current?.focus();
      return;
    }

    setTermsError("");
    // In a real app, you would send form data to the backend here.
    // Assuming success, show the verification modal.
    setOtp(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    setResendSeconds(OTP_RESEND_SECONDS);
    setShowPopup(true);
  };

  const handleResendCode = () => {
    // TODO: request a new email verification code from the API.
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

  const handleVerifyEmail = () => {
    if (otp.some((digit) => !digit)) {
      setOtpError("Enter all six digits to verify your email.");
      return;
    }

    setShowPopup(false);
    setAccountCreated(true);
  };

  const maskedEmail = email.replace(/^(.).+(@.*)$/, "$1***$2");

  return (
    <div className="login-page-wrapper">
      
      {/* =========================================
          MAIN SIGNUP PAGE CONTENT
          ========================================= */}
      <div className="login-content signup-content">
        
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

        {/* RIGHT SIDE: SIGN UP FORM */}
        <div className="login-right signup-right">
          <div className="form-wrapper registration-wrapper">
            <h2>Create account</h2>

            <div className="role-toggle">
              <button className="role-btn active">Store</button>
              <Link to="/signupsupplier" className="role-btn">Supplier</Link>
            </div>

            {/* Attach the submit handler to the form */}
            <form onSubmit={handleCreateAccount}>
              <h3 className="section-title">Your details</h3>

              <div className="form-row">
                <div className="input-group">
                  <label>Name</label>
                  <input type="text" className="form-input" required />
                </div>
                <div className="input-group">
                  <label>Surname</label>
                  <input type="text" className="form-input" required />
                </div>
              </div>

              <div className="input-group">
                <label>Email address</label>
                <input
                  ref={emailInputRef}
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" className="form-input" required />
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label>Gender</label>
                  <select className="form-input select-input" defaultValue="" required>
                    <option value="" disabled>Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {hasDisability && (
                    <div className="disability-details">
                      <label htmlFor="store-disability-type">What type of disability?</label>
                      <input
                        id="store-disability-type"
                        type="text"
                        className="form-input"
                        required
                      />
                    </div>
                  )}
                </div>
                <div className="input-group">
                  <label>Disability</label>
                  <div className="radio-group">
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="store-disability"
                        value="yes"
                        checked={hasDisability}
                        onChange={() => setHasDisability(true)}
                      /> Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="store-disability"
                        value="no"
                        checked={!hasDisability}
                        onChange={() => setHasDisability(false)}
                      /> No
                    </label>
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  className="form-input"
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
                  required
                />
                <ul className="password-requirements">
                  <li>At least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li className="special-character-requirement">
                    At least one special character (e.g. ! @ # $ % ^ &amp; *)
                  </li>
                </ul>
              </div>

              <div className="input-group">
                <label>Confirm password</label>
                <PasswordInput
                  className="form-input"
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
                  required
                />
              </div>

              <div className="terms-group">
                <input
                  ref={termsInputRef}
                  type="checkbox"
                  id="terms"
                  checked={termsAccepted}
                  onChange={(event) => {
                    setTermsAccepted(event.target.checked);
                    if (event.target.checked) setTermsError("");
                  }}
                  aria-describedby={termsError ? "terms-error" : undefined}
                />
                <label htmlFor="terms">
                  I agree to the <a href="#" className="terms-link">Terms and Conditions</a> (POPIA compliant).
                </label>
              </div>
              {termsError && <p id="terms-error" className="field-error" role="alert">{termsError}</p>}

              <button type="submit" className="submit-btn">
                Create account
              </button>
            </form>

            <p className="auth-footer-text">
              Already registered? <Link to="/login/store-owner-staff">Sign in</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      {/* =========================================
          VERIFICATION POPUP MODAL
          Only renders if showPopup is true
          ========================================= */}
      {showPopup && (
        <div className="modal-overlay">
          <div className="modal-card">
            
            {/* Modal Header */}
            <div className="modal-header">
              <h2>Verify your email</h2>
              <button 
                className="modal-close-btn" 
                onClick={() => setShowPopup(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            
            {/* Modal Body */}
            <p className="modal-subtitle">
              We sent a 6-digit code to <strong>{maskedEmail}</strong>. Enter it below to activate your account.
            </p>

            {/* 6-Digit OTP Inputs */}
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

            {/* Info Box */}
            <div className="modal-info-box">
              <p>
                Didn't get an email? Check your spam folder.{" "}
                {resendSeconds > 0 ? (
                  <>You can request a new code in 0:{String(resendSeconds).padStart(2, "0")}.</>
                ) : (
                  <button type="button" className="resend-btn" onClick={handleResendCode}>
                    Resend code
                  </button>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            {otpError && <p className="field-error" role="alert">{otpError}</p>}
            <button
              type="button"
              className="modal-submit-btn"
              onClick={handleVerifyEmail}
            >
              Verify email
            </button>
            <button
              type="button"
              className="modal-secondary-btn"
              onClick={handleChangeEmail}
            >
              Change email address
            </button>

          </div>
        </div>
      )}

      {accountCreated && (
        <div className="modal-overlay">
          <div className="modal-card" role="status" aria-live="polite">
            <div className="modal-header">
              <h2>Account successfully created</h2>
            </div>
            <p className="modal-subtitle">
              Your email has been verified and your account is ready.
            </p>
            <button
              type="button"
              className="modal-submit-btn"
              onClick={() => setAccountCreated(false)}
            >
              Continue
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignupStoreOwner;