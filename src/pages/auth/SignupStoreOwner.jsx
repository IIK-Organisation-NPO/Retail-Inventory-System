import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png"; 

const SignupStoreOwner = () => {
  const navigate = useNavigate();
  
  // Consolidated state for all form fields
  const [formData, setFormData] = useState({
    name: "",
    surname: "",
    email: "",
    mobileNumber: "",
    gender: "",
    disability: false, // false = No, true = Yes
    disabilityDescription: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Universal handler for all inputs
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" || type === "radio" ? checked : value
    });
  };

  // Specific handler for the Disability Radio buttons
  const handleDisabilityChange = (isDisabled) => {
    setFormData({
      ...formData,
      disability: isDisabled,
      disabilityDescription: isDisabled ? formData.disabilityDescription : "" // Clear description if 'No' is selected
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic Validation
    if (formData.password !== formData.confirmPassword) {
      return setError("Passwords do not match");
    }
    if (!formData.acceptTerms) {
      return setError("You must accept the Terms and Conditions");
    }
    if (formData.disability && !formData.disabilityDescription) {
      return setError("Please describe your disability");
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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

      // Success! Redirect to login
      alert("Account created successfully! Please log in.");
      navigate("/login/store-owner-staff");

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
              <button className="role-btn active" type="button">Store</button>
              <button className="role-btn" type="button">Supplier</button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && <div className="error-message" style={{color: 'red', marginBottom: '10px', fontWeight: 'bold'}}>{error}</div>}
              
              <h3 className="section-title">Your details</h3>

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

              {/* Disability Description (Conditional Rendering) */}
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
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-input" required minLength="8" />
              </div>
              <div className="input-group">
                <label>Confirm password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="form-input" required minLength="8" />
              </div>

              {/* Terms */}
              <div className="terms-group">
                <input type="checkbox" id="terms" name="acceptTerms" checked={formData.acceptTerms} onChange={handleChange} required />
                <label htmlFor="terms">
                  I agree to the <a href="#" className="terms-link">Terms and Conditions</a> (POPIA compliant).
                </label>
              </div>

              {/* Submit */}
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="auth-footer-text">
              Already registered? <Link to="/login/store-owner-staff">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SignupStoreOwner;