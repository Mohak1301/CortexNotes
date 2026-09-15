import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '../config/api.js';
import { apiFetch, setCsrfToken } from '../utils/apiUtils.js';
import PasswordField from './ui/PasswordField';
import './AuthPage.css';

// Supabase sends the recovery session in the URL fragment, which never reaches a
// server. Reading it here is the one place this app handles a raw token.
const readRecoveryFragment = () => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const recovery = {
    accessToken: params.get('access_token') || '',
    refreshToken: params.get('refresh_token') || '',
    errorDescription: params.get('error_description') || '',
  };

  // Wipe it straight away. A fragment holding a live session would otherwise stay
  // in browser history, and in any screenshot or shared link.
  if (window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname);
  }

  return recovery;
};

const PasswordResetPage = ({ mode }) => {
  const isRequest = mode === 'request';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkState, setLinkState] = useState(isRequest ? 'n/a' : 'checking');

  // Trade the fragment for ordinary cookies before showing the password field, so
  // there is no point offering the form if the link is already dead.
  useEffect(() => {
    if (isRequest) return;

    const recovery = readRecoveryFragment();

    if (recovery.errorDescription) {
      setError(recovery.errorDescription);
      setLinkState('invalid');
      return;
    }
    if (!recovery.accessToken || !recovery.refreshToken) {
      setError('That reset link is incomplete. Request a new one.');
      setLinkState('invalid');
      return;
    }

    (async () => {
      try {
        const response = await apiFetch(API_ENDPOINTS.AUTH_RECOVER_SESSION, {
          method: 'POST',
          skipAuthRetry: true,
          body: JSON.stringify(recovery),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          setError(data.error || 'That reset link has expired. Request a new one.');
          setLinkState('invalid');
          return;
        }
        setCsrfToken(data.csrfToken);
        setLinkState('ready');
      } catch {
        setError('Could not reach the service. Please try again.');
        setLinkState('invalid');
      }
    })();
  }, [isRequest]);

  const requestLink = useCallback(async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setIsSubmitting(true);
    try {
      const response = await apiFetch(API_ENDPOINTS.AUTH_FORGOT_PASSWORD, {
        method: 'POST',
        skipAuthRetry: true,
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'Could not send that link');
        return;
      }
      setNotice(data.message);
    } catch {
      setError('Could not reach the service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email]);

  const savePassword = useCallback(async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await apiFetch(API_ENDPOINTS.AUTH_PASSWORD, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || 'That password could not be saved');
        return;
      }
      // The recovery session is a real session, so there is nowhere else to send them.
      navigate('/dashboard', { replace: true });
    } catch {
      setError('Could not reach the service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, navigate]);

  return (
    <main className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <Link className="auth-brand" to="/" aria-label="CortexNotes home">
        <span className="brand-mark">C</span><span>CortexNotes</span>
      </Link>

      <section className="auth-card" aria-labelledby="auth-title">
        {isRequest && (
          notice ? (
            <div className="auth-confirmation">
              <div className="auth-success-icon">✓</div>
              <h1 id="auth-title">Check your inbox</h1>
              <p>{notice}</p>
              <Link className="auth-primary-link" to="/login">Back to sign in</Link>
            </div>
          ) : (
            <>
              <h1 id="auth-title">Reset your password.</h1>
              <p className="auth-intro">We will email you a link to choose a new one.</p>
              <form className="auth-form" onSubmit={requestLink}>
                <label>Email address
                  <input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    maxLength="254"
                    required
                  />
                </label>
                {error && <div className="auth-error" role="alert">{error}</div>}
                <button className="auth-submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Please wait…' : 'Send reset link'}
                </button>
              </form>
              <p className="auth-switch">Remembered it? <Link to="/login">Sign in</Link></p>
            </>
          )
        )}

        {!isRequest && linkState === 'checking' && (
          <>
            <h1 id="auth-title">Checking your link…</h1>
            <p className="auth-intro">One moment.</p>
          </>
        )}

        {!isRequest && linkState === 'invalid' && (
          <>
            <h1 id="auth-title">That link will not work.</h1>
            {error && <div className="auth-error" role="alert">{error}</div>}
            <p className="auth-switch">
              <Link to="/forgot-password">Request a new reset link</Link>
            </p>
          </>
        )}

        {!isRequest && linkState === 'ready' && (
          <>
            <h1 id="auth-title">Choose a new password.</h1>
            <p className="auth-intro">This replaces your old one immediately.</p>
            <form className="auth-form" onSubmit={savePassword}>
              <PasswordField
                label="New password"
                hint="Use at least 10 characters."
                name="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                minLength="10"
                maxLength="128"
                required
              />
              {error && <div className="auth-error" role="alert">{error}</div>}
              <button className="auth-submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Save password'}
              </button>
            </form>
          </>
        )}
      </section>

      <p className="auth-security-note">Protected by secure, server-managed sessions</p>
    </main>
  );
};

export default PasswordResetPage;
