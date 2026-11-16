import { useState } from "react";

const PasswordInput = ({ className = "form-input", ...inputProps }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="password-input-wrapper">
      <input
        {...inputProps}
        type={isVisible ? "text" : "password"}
        className={className}
      />
      <button
        type="button"
        className="password-visibility-toggle"
        onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
      >
        {isVisible ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.2A10.9 10.9 0 0 1 12 5c5.5 0 9 7 9 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.9 7.7 3 12 3 12s3.5 7 9 7c1.2 0 2.3-.3 3.3-.8" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z" />
            <circle cx="12" cy="12" r="2.5" />
          </svg>
        )}
      </button>
    </span>
  );
};

export default PasswordInput;
