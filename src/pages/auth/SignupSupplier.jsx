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
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2. Universal handler for all inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || type === "radio" ? checked : value
    });
  };

  // 3. Handler for Disability toggle
  const handleDisabilityChange = (isDisabled) => {
    setFormData({
      ...formData,
      disability: isDisabled,
      disabilityDescription: isDisabled ? formData.disabilityDescription : "" 
    });
  };

  // 4. Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!formData.acceptTerms) {
      return setError("You must agree to the Terms and Conditions to create an account.");
    }
    if (formData.disability && !formData.disabilityDescription) {
      return setError("Please describe your disability");
    }

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

            <form onSubmit={handleSubmit}>
              
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
                <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="form-input" required />
              </div>

              {/* Name & Surname */}
              <div className="form-row">
                <div className="input-group">
                  <label>Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-input" required />
                </div>
                <div className="input-group">
                  <label>Surname</label>
                  <input type="text" name="surname" value={formData.surname} onChange={handleChange} className="form-input" required />
                </div>
              </div>

              {/* Email */}
              <div className="input-group">
                <label>Email address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} className="form-input" required />
              </div>

              {/* Mobile */}
              <div className="input-group">
                <label>Mobile number</label>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} className="form-input" required />
              </div>

              {/* Gender & Disability */}
              <div className="form-row">
                <div className="input-group">
                  <label>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="form-input select-input" required>
                    <option value="" disabled>Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
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
                    required={formData.disability}
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
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  minLength={8}
                  pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                  title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                  autoComplete="new-password"
                  required
                />
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