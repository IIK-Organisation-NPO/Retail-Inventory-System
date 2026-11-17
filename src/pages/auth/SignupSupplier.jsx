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
  const [hasDisability, setHasDisability] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsError, setTermsError] = useState("");

  // Form values needed for the verification step and password check
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Verification popup state
  const [showPopup, setShowPopup] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [resendSeconds, setResendSeconds] = useState(OTP_RESEND_SECONDS);

  const emailInputRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const otpInputRefs = useRef([]);
  const termsInputRef = useRef(null);

  // Countdown before a new code can be requested
  useEffect(() => {
    if (!showPopup || resendSeconds === 0) return undefined;

    const timer = setTimeout(() => {
      setResendSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [showPopup, resendSeconds]);

  // Handler for the main form submission
  const handleCreateAccount = (event) => {
    event.preventDefault();

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      confirmPasswordRef.current?.focus();
      return;
    }
    setPasswordError("");

    if (!termsAccepted) {
      setTermsError("You must agree to the Terms and Conditions to create an account.");
      termsInputRef.current?.focus();
      return;
    }
    setTermsError("");

    // TODO: send the form data to the backend here.
    // Assuming success, show the verification popup.
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

    // TODO: verify the code with the API.
    setShowPopup(false);
    setAccountCreated(true);
  };

  const maskedEmail = email.replace(/^(.).+(@.*)$/, "$1***$2");

  return (
    // Main page wrapper using CSS Grid to keep footer at the bottom
    <div className="login-page-wrapper">

      {/* Main content area split into left (image) and right (form) panels */}
      <div className="login-content signup-content">

        {/* =========================================
            LEFT SIDE: HERO SECTION
            ========================================= */}
        <div className="login-left">

          {/* Background image with a dark overlay */}
          <div className="hero-background">
            <img src={BackgroundImage} alt="Store background" className="bg-image" />
            <div className="overlay"></div>
          </div>

          {/* Content layered on top of the background image */}
          <div className="left-content">
            <div className="logo-top">SpazaNet</div>

            <div className="welcome-text">
              <h1>Become one of us</h1>
              <p>Stock, sales and group buying for rural stores.</p>
            </div>

            {/* Bottom Partner Logo */}
            <div className="partner-logo">
              <img src={Logo} alt="IIK Organisation Logo" className="partner-logo-img" />
              <span>IIK Organisation</span>
            </div>
          </div>
        </div>

        {/* =========================================
            RIGHT SIDE: SIGN UP FORM
            ========================================= */}
        <div className="login-right signup-right">
          <div className="form-wrapper registration-wrapper">

            {/* Form Header */}
            <h2>Create account</h2>

            {/* Role Selection Toggle (Store / Supplier) */}
            <div className="role-toggle">
              {/* 'Store' switches to the store owner sign up page */}
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate("/signupstoreowner")}
              >
                Store
              </button>
              <button type="button" className="role-btn active">Supplier</button>
            </div>

            <form onSubmit={handleCreateAccount}>
              {/* Section Title */}
              <h3 className="section-title">Your details</h3>

              {/* Company Name Input */}
              <div className="input-group">
                <label>Company name</label>
                <input type="text" className="form-input" required />
              </div>

              {/* Name & Surname Row */}
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

              {/* Email Input */}
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

              {/* Mobile Number Input */}
              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" className="form-input" required />
              </div>

              {/* Gender & Disability Row */}
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
                      <label htmlFor="disability-type">What type of disability?</label>
                      <input
                        id="disability-type"
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
                        name="disability"
                        value="yes"
                        checked={hasDisability}
                        onChange={() => setHasDisability(true)}
                      /> Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="disability"
                        value="no"
                        checked={!hasDisability}
                        onChange={() => setHasDisability(false)}
                      /> No
                    </label>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  className="form-input"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
                  required
                />
                <PasswordRequirements password={password} />
              </div>

              {/* Confirm Password Input */}
              <div className="input-group">
                <label>Confirm password</label>
                <PasswordInput
                  ref={confirmPasswordRef}
                  className="form-input"
                  value={confirmPassword}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value);
                    setPasswordError("");
                  }}
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
                  aria-describedby={passwordError ? "supplier-password-error" : undefined}
                  required
                />
                {passwordError && (
                  <p id="supplier-password-error" className="field-error" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Terms & Conditions Checkbox */}
              <div className="terms-group">
                <input
                  ref={termsInputRef}
                  type="checkbox"
                  id="supplier-terms"
                  checked={termsAccepted}
                  onChange={(event) => {
                    setTermsAccepted(event.target.checked);
                    if (event.target.checked) setTermsError("");
                  }}
                  aria-describedby={termsError ? "supplier-terms-error" : undefined}
                />
                <label htmlFor="supplier-terms">
                  I agree to the <a href="#" className="terms-link">Terms and Conditions</a> (POPIA compliant).
                </label>
              </div>
              {termsError && (
                <p id="supplier-terms-error" className="field-error" role="alert">
                  {termsError}
                </p>
              )}

              {/* Form Submit Button */}
              <button type="submit" className="submit-btn">
                Create account
              </button>
            </form>

            {/* Login Redirect Link */}
            <p className="auth-footer-text">
              Already registered? <Link to="/login/supplier">Sign in</Link>
            </p>
          </div>
        </div>

      </div>

      {/* Global Footer Component */}
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
                type="button"
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

      {/* =========================================
          ACCOUNT CREATED MESSAGE
          ========================================= */}
      {accountCreated && (
        <div className="modal-overlay">
          <div className="modal-card" role="status" aria-live="polite">
            <div className="modal-header">
              <h2>Account successfully created</h2>
            </div>
            <p className="modal-subtitle">
              Your email has been verified and your supplier account is ready. Sign in to continue.
            </p>
            <button
              type="button"
              className="modal-submit-btn"
              onClick={() => navigate("/login/supplier")}
            >
              Continue to sign in
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SignupSupplier;
