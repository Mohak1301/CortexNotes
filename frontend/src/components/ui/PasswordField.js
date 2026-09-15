import React, { useState } from 'react';

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const PasswordField = ({ label, hint, ...inputProps }) => {
  // Deliberately not remembered between visits. A password left on screen because
  // of a choice made last week is a worse surprise than clicking the eye again.
  const [isVisible, setIsVisible] = useState(false);

  return (
    <label className="password-label">
      {label}
      <span className="password-control">
        <input {...inputProps} type={isVisible ? 'text' : 'password'} />
        <button
          // Without this it defaults to submit, and revealing the password would
          // send the form.
          type="button"
          className="password-toggle"
          onClick={() => setIsVisible((current) => !current)}
          // The label has to describe the action, not the state, or a screen reader
          // announces "show password" while the password is already showing.
          aria-label={isVisible ? 'Hide password' : 'Show password'}
          aria-pressed={isVisible}
          // Tabbing through a form should reach the next field, not this.
          tabIndex={-1}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
};

export default PasswordField;
