import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../Style/components/auth.css";
import Footer from "../../components/common/Footer";
import ForgotPasswordModal from "../../components/common/ForgotPasswordModal";
import PasswordInput from "../../components/common/PasswordInput";
import BackgroundImage from "../../assets/images/IIK Background.jpeg";
import Logo from "../../assets/images/IIK logo.png";

const API_BASE = "http://localhost:5000/api/auth";

// Maps raw backend error messages to user-friendly, non-revealing messages.
const mapServerError = (message, expectedRole) => {
  if (!message) return "An unknown error occurred.";
  const msg = message.toLowerCase();

  if (msg.includes("incorrect") || msg.includes("invalid") || msg.includes("failed")) {
    return "Incorrect email or password.";
  }
  if (msg.includes("verify")) {
    return "Please verify your email before signing in.";
  }
  if (msg.includes("deactivated") || msg.includes("suspended")) {
    return "Your account has been deactivated. Contact support.";
  }
  if (msg.includes("role") || msg.includes("not registered as")) {
    return `This account is not registered as a ${expectedRole}.`;
  }
  if (msg.includes("required")) {
    return "Please enter your email and password.";
  }

  return "Server is down. Please check your connection.";
};

// POST /api/auth/login for a given role.
// Returns { ok, status, data } — never throws on HTTP errors.
const attemptLogin = async ({ email, password, roleName, rememberMe }) => {
  const response = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password, roleName, rememberMe }),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

const LoginStoreOwnerStaff = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      // Option A: try "Store Owner" first, then "Store Staff" on role mismatch.
      let result = await attemptLogin({
        email: cleanEmail,
        password,
        roleName: "Store Owner",
        rememberMe,
      });

      const isRoleMismatch =
        result.status === 403 &&
        typeof result.data?.message === "string" &&
        /not registered as/i.test(result.data.message);

      if (isRoleMismatch) {
        result = await attemptLogin({
          email: cleanEmail,
          password,
          roleName: "Store Staff",
          rememberMe,
        });
      }

      if (result.ok) {
        // Backend also sets an httpOnly cookie; token is available if you need it.
        // Store non-sensitive user info for quick UI reads (optional).
        try {
          if (result.data?.user) {
            localStorage.setItem("spazanet_user", JSON.stringify(result.data.user));
          }
        } catch {
          /* ignore storage errors */
        }
        navigate("/dashboard");
        return;
      }

      setError(mapServerError(result.data?.message, "Store"));
    } catch (networkError) {
      console.error("Login network error:", networkError);
      setError("Server is down. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-content">
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

        <div className="login-right">
          <div className="form-wrapper">
            <h2>Sign in</h2>
            <p className="subtitle">
              Sign in as a store owner or a staff member to continue.
            </p>

            <div className="role-toggle">
              <button type="button" className="role-btn active">Store</button>
              <Link to="/login/supplier" className="role-btn">Supplier</Link>
            </div>

            {/* Error banner */}
            {error && (
              <div
                role="alert"
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
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="login-email">Email or mobile number</label>
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="login-password">Password or user code (for Staff)</label>
                <PasswordInput
                  id="login-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="form-input"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
              </div>

              <div className="form-actions">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <label htmlFor="remember">Remember me</label>
                </div>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="auth-footer-text">
              New store owner? <Link to="/signupstoreowner">Register your store</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      {showForgotPassword && (
        <ForgotPasswordModal
          roleName="Store Owner"
          onClose={() => setShowForgotPassword(false)}
        />
      )}
    </div>
  );
};

export default LoginStoreOwnerStaff;