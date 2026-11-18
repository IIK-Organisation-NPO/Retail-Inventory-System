const PasswordRequirements = ({ password }) => {
  const requirements = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least one uppercase letter", met: /[A-Z]/.test(password) },
    { label: "At least one lowercase letter", met: /[a-z]/.test(password) },
    { label: "At least one number", met: /\d/.test(password) },
    {
      label: "At least one special character (e.g. ! @ # $ % ^ & *)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <ul className="password-requirements" aria-live="polite">
      {requirements.map(({ label, met }) => (
        <li
          key={label}
          className={`password-requirement ${
            password.length === 0 ? "is-neutral" : met ? "is-met" : "is-unmet"
          }`}
        >
          <span aria-hidden="true">{password.length > 0 && met ? "✓" : "○"}</span>
          {label}
        </li>
      ))}
    </ul>
  );
};

export default PasswordRequirements;
