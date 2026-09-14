import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_ENDPOINTS } from '../config/api.js';
import { apiFetch } from '../utils/apiUtils.js';
import './AuthPage.css';

const AuthPage = ({ mode }) => {
  const isRegister = mode === 'register';
  const { user, isAuthLoading, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendNotice, setResendNotice] = useState('');

  const resendConfirmation = async () => {
    setResendNotice('Sending…');
    try {
      const response = await apiFetch(API_ENDPOINTS.AUTH_RESEND_CONFIRMATION, {
        method: 'POST',
        skipAuthRetry: true,
        body: JSON.stringify({ email: form.email }),
      });
      const data = await response.json().catch(() => ({}));
      setResendNotice(response.ok ? data.message : (data.error || 'Could not send that link'));
    } catch {
      setResendNotice('Could not reach the service. Please try again.');
    }
  };

  if (!isAuthLoading && user) return <Navigate to="/dashboard" replace />;

  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = isRegister
        ? await register(form.name, form.email, form.password)
        : await login(form.email, form.password);
      if (result.requiresEmailConfirmation) {
        setConfirmationSent(true);
      } else {
        navigate(location.state?.from || '/dashboard', { replace: true });
      }
    } catch (authError) {
      setError(authError.message);
      // Supabase names this case, so the form can offer the fix instead of
      // leaving the user to guess that their password is wrong.
      setNeedsConfirmation(authError.code === 'email_not_confirmed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-grid" aria-hidden="true" />
      <Link className="auth-brand" to="/" aria-label="CortexNotes home"><span className="brand-mark">C</span><span>CortexNotes</span></Link>
      <section className="auth-card" aria-labelledby="auth-title">
        {confirmationSent ? (
          <div className="auth-confirmation">
            <div className="auth-success-icon">✓</div>
            <h1 id="auth-title">Check your inbox</h1>
            <p>We sent a confirmation link to <strong>{form.email}</strong>. Confirm your email, then sign in.</p>
            {resendNotice
              ? <p className="auth-intro">{resendNotice}</p>
              : <p className="auth-switch"><button type="button" className="auth-inline-btn" onClick={resendConfirmation}>Resend the link</button></p>}
            <Link className="auth-primary-link" to="/login">Continue to sign in</Link>
          </div>
        ) : (
          <>
            <h1 id="auth-title">{isRegister ? 'Start researching clearly.' : 'Sign in to CortexNotes.'}</h1>
            <p className="auth-intro">{isRegister ? 'Your sources and conversations stay isolated in your account.' : 'Continue working with your private research sources.'}</p>
            <form className="auth-form" onSubmit={submit}>
              {isRegister && <label>Full name<input name="name" value={form.name} onChange={update} autoComplete="name" minLength="2" maxLength="60" required /></label>}
              <label>Email address<input name="email" type="email" value={form.email} onChange={update} autoComplete="email" maxLength="254" required /></label>
              <label>Password<input name="password" type="password" value={form.password} onChange={update} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength="10" maxLength="128" required /><small>{isRegister ? 'Use at least 10 characters.' : ''}</small></label>
              {error && <div className="auth-error" role="alert">{error}</div>}
              {needsConfirmation && (
                resendNotice
                  ? <p className="auth-intro">{resendNotice}</p>
                  : <p className="auth-switch"><button type="button" className="auth-inline-btn" onClick={resendConfirmation}>Resend the confirmation link</button></p>
              )}
              <button className="auth-submit" disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
            </form>
            {!isRegister && <p className="auth-switch"><Link to="/forgot-password">Forgot your password?</Link></p>}
            <p className="auth-switch">{isRegister ? 'Already have an account?' : 'New to CortexNotes?'} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
          </>
        )}
      </section>
      <p className="auth-security-note">Protected by secure, server-managed sessions</p>
    </main>
  );
};

export default AuthPage;
