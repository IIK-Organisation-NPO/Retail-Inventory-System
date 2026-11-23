// src/components/common/ForgotPasswordModal.jsx
// Forgot password popup flow: email address -> OTP code -> new password
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "../../Style/components/auth.css";
import PasswordInput from "./PasswordInput";
import PasswordRequirements from "./PasswordRequirements";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 30;

const TITLES = {
  email: "Forgot your password?",
  code: "Enter your code",
  reset: "Create a new password",
};

const maskEmail = (email) => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
};

const ForgotPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const otpRefs = useRef([]);

  // Close on Escape and stop the page behind the popup from scrolling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Countdown before a new code can be requested
  useEffect(() => {
    if (step !== "code" || secondsLeft === 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [step, secondsLeft]);

  const goTo = (nextStep) => {
    setError("");
    setStep(nextStep);
  };

  const sendCode = (recipient = email) => {
    setEmail(recipient);
    // TODO: call the API to send the OTP to `recipient`
    setCode(Array(OTP_LENGTH).fill(""));
    setSecondsLeft(RESEND_SECONDS);
    goTo("code");
  };

  // --- Step 1: Email address ---
  const handleSendOtp = (e) => {
    e.preventDefault();
    const recipient = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      setError("Enter a valid email address.");
      return;
    }
    sendCode(recipient);
  };

  // --- Step 2: OTP code ---
  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextCode = [...code];
    nextCode[index] = digit;
    setCode(nextCode);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1].focus();
  };

  const handleCodeKeyDown = (index, e) => {
    // Jump back to the previous box when deleting from an empty one
    if (e.key === "Backspace" && !code[index] && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };

  const handleCodePaste = (e) => {
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    const nextCode = Array(OTP_LENGTH).fill("");
    digits.split("").forEach((digit, i) => {
      nextCode[i] = digit;
    });
    setCode(nextCode);
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)].focus();
  };

  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (code.join("").length !== OTP_LENGTH) {
      setError("Enter the 6-digit code.");
      return;
    }
    // TODO: verify the code with the API
    goTo("reset");
  };

  // --- Step 3: New password ---
  const handleResetPassword = (e) => {
    e.preventDefault();
    const meetsRequirements = password.length >= 8
      && /[A-Z]/.test(password)
      && /[a-z]/.test(password)
      && /\d/.test(password)
      && /[^A-Za-z0-9]/.test(password);

    if (!meetsRequirements) {
      setError("Password must meet all the requirements listed above.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    // TODO: save the new password with the API
    onClose();
  };

  return createPortal(
    // Clicking the dark backdrop (outside the popup) closes it
    <div
      className="auth-modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Popup Header */}
        <div className="auth-modal-header">
          <h2 id="auth-modal-title">{TITLES[step]}</h2>
          <button type="button" className="auth-modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>

        {step === "email" && (
          <form onSubmit={handleSendOtp} noValidate>
            <p className="auth-modal-text">
              Enter your email address and we will send you an OTP to reset your password.
            </p>

            <div className="input-group">
              <label htmlFor="reset-email">Email address</label>
              <input
                id="reset-email"
                type="email"
                className="form-input"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError("");
                }}
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && <p className="field-error">{error}</p>}

            <button type="submit" className="submit-btn">Send reset OTP</button>
            <button type="button" className="outline-btn" onClick={onClose}>Cancel</button>
          </form>
        )}

        {/* =========================================
            STEP 2: ENTER YOUR CODE
            ========================================= */}
        {step === "code" && (
          <form onSubmit={handleVerifyCode} noValidate>
            <p className="auth-modal-text">
              We sent a 6-digit code to <strong>{maskEmail(email)}</strong>. Enter it below to continue.
            </p>

            {/* One box per digit */}
            <div className="otp-inputs" onPaste={handleCodePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (otpRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  className="otp-input"
                  aria-label={`Digit ${index + 1}`}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleCodeKeyDown(index, e)}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Resend countdown */}
            <div className="auth-modal-note">
              {secondsLeft > 0 ? (
                <>Didn't get a code? You can request a new one in 0:{String(secondsLeft).padStart(2, "0")}.</>
              ) : (
                <>
                  Didn't get a code?{" "}
                  <button type="button" className="resend-btn" onClick={sendCode}>Resend code</button>
                </>
              )}
            </div>

            {error && <p className="field-error">{error}</p>}

            <button type="submit" className="submit-btn">Verify code</button>
            <button type="button" className="outline-btn" onClick={() => goTo("email")}>
              Change email address
            </button>
          </form>
        )}

        {/* =========================================
            STEP 3: CREATE A NEW PASSWORD
            ========================================= */}
        {step === "reset" && (
          <form onSubmit={handleResetPassword} noValidate>
            <p className="auth-modal-text">
              Your code was verified. Choose a new password for your account.
            </p>

            <div className="input-group">
              <label htmlFor="new-password">New password</label>
              <PasswordInput
                id="new-password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
                autoFocus
              />
              <PasswordRequirements password={password} />
            </div>

            <div className="input-group">
              <label htmlFor="confirm-new-password">Confirm new password</label>
              <PasswordInput
                id="confirm-new-password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}"
                title="Use at least 8 characters, including uppercase and lowercase letters, a number, and a special character."
              />
            </div>

            {error && <p className="field-error">{error}</p>}

            <button type="submit" className="submit-btn">Reset password</button>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default ForgotPasswordModal;
