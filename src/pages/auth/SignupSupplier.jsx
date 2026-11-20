import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import PasswordInput from "../../components/common/PasswordInput";
import PasswordRequirements from "../../components/common/PasswordRequirements";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const API_BASE = "http://localhost:5000/api/auth";
const OTP_LENGTH = 6;

const NAME_REGEX = /^[A-Za-z\s\-']+$/;
const MOBILE_REGEX = /^(?:\+27|0)[6-8][0-9]{8}$/;
// Aligned with the BACKEND regex AFTER the fix in section 3 below.
// Special char = any non-alphanumeric. Keep these in sync.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const SignupSupplier = () => {
  const navigate = useNavigate();

  const [showPopup, setShowPopup] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef([]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" || type === "radio" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (errors.api) {
      setErrors((prev) => ({ ...prev, api: "" }));
    }
  };

  const handleDisabilityChange = (isDisabled) => {
    setFormData((prev) => ({
      ...prev,
      disability: isDisabled,
      disabilityDescription: isDisabled ? prev.disabilityDescription : "",
    }));
  };

  // -------- STEP 1: validate + send OTP --------
  const handleCreateAccount = async (event) => {
    event.preventDefault();
    setErrors({});

    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = "Please enter your company name.";
    }
    if (!formData.name.trim() || !NAME_REGEX.test(formData.name.trim())) {
      newErrors.name = "Please enter a valid Name (letters only).";
    }
    if (!formData.surname.trim() || !NAME_REGEX.test(formData.surname.trim())) {
      newErrors.surname = "Please enter a valid Surname (letters only).";
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      newErrors.email = "Please enter a valid Email address.";
    }
    if (
      !formData.mobileNumber.trim() ||
      !MOBILE_REGEX.test(formData.mobileNumber.replace(/\s/g, ""))
    ) {
      newErrors.mobileNumber = "Please enter a valid SA Mobile number (e.g., 0821234567).";
    }
    if (!formData.gender) {
      newErrors.gender = "Please select a Gender.";
    }
    if (!PASSWORD_REGEX.test(formData.password)) {
      newErrors.password = "Password does not meet the requirements below.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "You must agree to the Terms and Conditions.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleName: "Supplier",
          companyName: formData.companyName.trim(),
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          email: formData.email.trim().toLowerCase(),
          mobileNumber: formData.mobileNumber.replace(/\s/g, ""),
          gender: formData.gender,
          password: formData.password,
          disability: formData.disability,
          disabilityDescription: formData.disability
            ? formData.disabilityDescription
            : null,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setShowPopup(true);
        return;
      }

      const message = (data?.message || "").toLowerCase();
      if (message.includes("already registered")) {
        setErrors({ email: "This email is already registered. Please sign in." });
      } else if (message.includes("password")) {
        setErrors({ password: data.message });
      } else if (message.includes("company")) {
        setErrors({ companyName: data.message });
      } else {
        setErrors({ api: data?.message || "An error occurred during signup." });
      }
    } catch (error) {
      console.error("Send OTP error:", error);
      setErrors({ api: "Server is down. Please check your connection." });
    } finally {
      setIsLoading(false);
    }
  };

  // -------- STEP 2: verify OTP --------
  const handleVerifyEmail = async () => {
    const otpString = otp.join("");
    if (otpString.length < OTP_LENGTH) {
      setOtpError("Enter all 6 digits.");
      return;
    }

    setIsLoading(true);
    setOtpError("");
    try {
      const response = await fetch(`${API_BASE}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          otp: otpString,
          roleName: "Supplier",
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        setShowPopup(false);
        setAccountCreated(true);
      } else {
        setOtpError(data?.message || "Could not verify the code. Please try again.");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
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
      digits.split("").forEach((d, offset) => {
        next[index + offset] = d;
      });
      return next;
    });
    const nextIndex = index + digits.length;
    otpInputRefs.current[Math.min(nextIndex, OTP_LENGTH - 1)]?.focus();
  };

  const handleSuccessContinue = () => {
    setAccountCreated(false);
    navigate("/login/supplier");
  };

  const renderError = (fieldName) =>
    errors[fieldName] ? (
      <span
        style={{
          color: "#d32f2f",
          fontSize: "12px",
          marginTop: "4px",
          display: "block",
          fontWeight: "500",
        }}
      >
        {errors[fieldName]}
      </span>
    ) : null;

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
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate("/signupstoreowner")}
              >
                Store
              </button>
              <button type="button" className="role-btn active">Supplier</button>
            </div>

            <form onSubmit={handleCreateAccount} noValidate>
              {errors.api && (
                <div
                  style={{
                    color: "#d32f2f",
                    backgroundColor: "#fde8e8",
                    padding: "10px",
                    borderRadius: "4px",
                    marginBottom: "15px",
                    fontSize: "14px",
                    fontWeight: "bold",
                  }}
                >
                  {errors.api}
                </div>
              )}

              <h3 className="section-title">Your details</h3>

              <div className="input-group">
                <label htmlFor="supplier-company">Company name</label>
                <input
                  id="supplier-company"
                  type="text"
                  name="companyName"
                  className="form-input"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                />
                {renderError("companyName")}
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="supplier-name">Name</label>
                  <input
                    id="supplier-name"
                    type="text"
                    name="name"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  {renderError("name")}
                </div>
                <div className="input-group">
                  <label htmlFor="supplier-surname">Surname</label>
                  <input
                    id="supplier-surname"
                    type="text"
                    name="surname"
                    className="form-input"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                  />
                  {renderError("surname")}
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="supplier-email">Email address</label>
                <input
                  id="supplier-email"
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                {renderError("email")}
              </div>

              <div className="input-group">
                <label htmlFor="supplier-mobile">Mobile number</label>
                <input
                  id="supplier-mobile"
                  type="tel"
                  name="mobileNumber"
                  className="form-input"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="e.g., 0821234567"
                  required
                />
                {renderError("mobileNumber")}
              </div>

              <div className="form-row">
                <div className="input-group">
                  <label htmlFor="supplier-gender">Gender</label>
                  <select
                    id="supplier-gender"
                    name="gender"
                    className="form-input select-input"
                    value={formData.gender}
                    onChange={handleChange}
                    required
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
                      <input
                        type="radio"
                        name="disability"
                        checked={formData.disability === true}
                        onChange={() => handleDisabilityChange(true)}
                      />{" "}
                      Yes
                    </label>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="disability"
                        checked={formData.disability === false}
                        onChange={() => handleDisabilityChange(false)}
                      />{" "}
                      No
                    </label>
                  </div>
                </div>
              </div>

              {formData.disability && (
                <div className="input-group disability-details">
                  <label htmlFor="supplier-disability-desc">What type of disability?</label>
                  <input
                    id="supplier-disability-desc"
                    type="text"
                    name="disabilityDescription"
                    className="form-input"
                    value={formData.disabilityDescription}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="input-group">
                <label htmlFor="supplier-password">Password</label>
                <PasswordInput
                  id="supplier-password"
                  name="password"
                  className="form-input"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <PasswordRequirements password={formData.password} />
                {renderError("password")}
              </div>

              <div className="input-group">
                <label htmlFor="supplier-confirm-password">Confirm password</label>
                <PasswordInput
                  id="supplier-confirm-password"
                  name="confirmPassword"
                  className="form-input"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                {renderError("confirmPassword")}
              </div>

              <div className="terms-group" style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    name="acceptTerms"
                    id="supplier-terms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                  />
                  <label htmlFor="supplier-terms" style={{ marginLeft: "8px" }}>
                    I agree to the{" "}
                    <a href="#" className="terms-link">Terms and Conditions</a>{" "}
                    (POPIA compliant).
                  </label>
                </div>
                {renderError("acceptTerms")}
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? "Sending OTP..." : "Create account"}
              </button>
            </form>

            <p className="auth-footer-text">
              Already registered? <Link to="/login/supplier">Sign in</Link>
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
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPopup(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="modal-subtitle">
              We sent a 6-digit code to <strong>{formData.email}</strong>.
            </p>
            <div className="otp-input-group">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { otpInputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  className="otp-box"
                  value={digit}
                  onChange={(event) => handleOtpChange(index, event.target.value)}
                  aria-label={`Digit ${index + 1}`}
                />
              ))}
            </div>
            {otpError && (
              <p className="field-error" style={{ color: "#d32f2f", fontSize: "12px", marginTop: "4px" }}>
                {otpError}
              </p>
            )}
            <button
              type="button"
              className="modal-submit-btn"
              onClick={handleVerifyEmail}
              disabled={isLoading}
            >
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
            <button
              type="button"
              className="modal-submit-btn"
              onClick={handleSuccessContinue}
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignupSupplier;