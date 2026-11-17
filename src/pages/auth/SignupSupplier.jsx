import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const SignupSupplier = () => {
  const navigate = useNavigate();
  
  // 1. State for all form data
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
  
  // 2. State for Validation Errors
  const [validationErrors, setValidationErrors] = useState({});
  
  const [error, setError] = useState(""); // For backend errors
  const [loading, setLoading] = useState(false);

  // 3. Universal handler for all inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || type === "radio" ? checked : value
    });

    // Clear the specific error message as the user types/selects
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ""
      });
    }
  };

  // 4. Handler for Disability toggle
  const handleDisabilityChange = (isDisabled) => {
    setFormData({
      ...formData,
      disability: isDisabled,
      disabilityDescription: isDisabled ? formData.disabilityDescription : "" 
    });
  };

  // 5. The Validation Logic
  const validateForm = () => {
    const errors = {};

    // Company Name Validation
    if (!formData.companyName.trim()) {
      errors.companyName = "Please enter a company name";
    }

    // Name & Surname Validation
    const nameRegex = /^[A-Za-z\s\-']+$/;
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    } else if (!nameRegex.test(formData.name)) {
      errors.name = "Name can only contain letters, spaces, hyphens, and apostrophes";
    }

    if (!formData.surname.trim()) {
      errors.surname = "Surname is required";
    } else if (!nameRegex.test(formData.surname)) {
      errors.surname = "Surname can only contain letters, spaces, hyphens, and apostrophes";
    }

    // Email Validation
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    }

    // Mobile Number Validation (SA format)
    const mobileRegex = /^(?:\+27|0)[6-8][0-9]{8}$/;
    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = "Mobile number is required";
    } else if (!mobileRegex.test(formData.mobileNumber.replace(/\s/g, ''))) {
      errors.mobileNumber = "Please enter a valid South African phone number (e.g., 0821234567 or +27821234567)";
    }

    // Gender Validation
    if (!formData.gender) {
      errors.gender = "Please select a gender in the list";
    }

    // Password Validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      errors.password = "use atleast 8 characters, including Uppercase and lowercase letters, a number and a special character";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Terms Validation
    if (!formData.acceptTerms) {
      errors.acceptTerms = "You must agree to the Terms of Service and Privacy Policy to continue.";
    }

    return errors;
  };

  // 6. Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Run frontend validation
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

      if (!response.ok) {
        throw new Error(data.message || "Registration failed");
      }

      alert("Supplier account created successfully! Please log in.");
      navigate("/login/supplier");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
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
              <h1>Become one of us</h1>
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
              <button
                type="button"
                className="role-btn"
                onClick={() => navigate("/signupstoreowner")}
              >
                Store
              </button>
              <button type="button" className="role-btn active">Supplier</button>
            </div>

            {/* noValidate prevents the browser's default popups */}
            <form onSubmit={handleSubmit} noValidate>
              
              {/* Backend Error Message */}
              {error && (
                <div style={{ color: 'red', backgroundColor: '#ffebee', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                  {error}
                </div>
              )}

              <h3 className="section-title">Your details</h3>

              {/* Company Name */}
              <div className="input-group">
                <label>Company name</label>
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="form-input" />
                {validationErrors.companyName && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.companyName}</span>}
              </div>

              {/* Name & Surname */}
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

              {/* Email */}
              <div className="input-group">
                <label>Email address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" />
                {validationErrors.email && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.email}</span>}
              </div>

              {/* Mobile */}
              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="form-input" placeholder="e.g., 0821234567 or +27821234567" />
                {validationErrors.mobileNumber && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.mobileNumber}</span>}
              </div>

              {/* Gender & Disability */}
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

              {/* Disability Description */}
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

              {/* Passwords */}
              <div className="input-group">
                <label>Password</label>
                <PasswordInput
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="new-password"
                />
                {validationErrors.password && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.password}</span>}
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
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  autoComplete="new-password"
                />
                {validationErrors.confirmPassword && <span className="field-error" style={{ color: 'red', fontSize: '12px', marginTop: '5px', display: 'block' }}>{validationErrors.confirmPassword}</span>}
              </div>

              {/* Terms */}
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

              {/* Submit */}
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
    </div>
  );
};

export default SignupSupplier;