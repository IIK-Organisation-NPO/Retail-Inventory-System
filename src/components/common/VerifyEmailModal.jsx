import { useState } from "react";

const VerifyEmailModal = ({
  email,
  role,
  onClose,
  onVerified,          // optional: called after a successful verification (replaces the alert)
  onResend,            // optional: async function that sends a new code (makes "Resend code" work)
  notice = "",         // optional: message shown above the boxes
  closeLabel = "Change email address", // optional: text of the bottom button
}) => {
  const [code, setCode] = useState(Array(6).fill(""));
  const [error, setError] = useState("");
  const [info, setInfo] = useState(notice);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  // Handle input changes for the 6 boxes
  const handleChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setError("");

    // Auto-focus next box
    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    const otp = code.join("");
    if (otp.length !== 6) {
      setError("Enter all 6 digits of the code we emailed you.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          otp: otp,
          role: role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      if (onVerified) {
        onVerified();
      } else {
        alert("Email verified successfully! You can now log in.");
      }
      onClose(); // Close the modal

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!onResend || resending) return; // no resend handler: link does nothing, as before

    setResending(true);
    setError("");
    setInfo("");

    try {
      await onResend();
      setCode(Array(6).fill(""));
      setInfo("A new code was sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div className="auth-modal" style={{ backgroundColor: 'white', padding: '30px', borderRadius: '10px', width: '90%', maxWidth: '450px', position: 'relative' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', padding: '5px 10px' }}>✕</button>
        
        <h2 style={{ marginTop: 0, fontSize: '24px' }}>Verify your email</h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to {onVerified ? "confirm your email address" : "activate your account"}.
        </p>

        {info && !error && <p style={{ color: '#2e7d32', fontSize: '14px', marginBottom: '10px' }}>{info}</p>}
        {error && <p style={{ color: 'red', fontSize: '14px', marginBottom: '10px' }}>{error}</p>}

        <form onSubmit={handleVerify}>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
            {code.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                style={{ width: '45px', height: '55px', fontSize: '24px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '8px' }}
                required
              />
            ))}
          </div>

          <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', fontSize: '13px', marginBottom: '20px' }}>
            Didn't get an email? Check your spam folder.{" "}
            <a href="#" onClick={handleResend}>{resending ? "Sending..." : "Resend code"}</a>
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '15px', backgroundColor: 'black', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
            {loading ? "Verifying..." : "Verify email"}
          </button>
          
          <button type="button" onClick={onClose} style={{ width: '100%', padding: '15px', backgroundColor: 'white', color: 'black', border: '1px solid black', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {closeLabel}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmailModal;