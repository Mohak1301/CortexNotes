import crypto from 'crypto';
import {
  getUser,
  refreshSession,
  requestPasswordReset,
  resendVerification,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from '../services/supabaseAuth.js';
import { config } from '../config.js';
import { clearCachedUser } from '../services/userCache.js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  parseCookies,
  setSessionCookies,
  setCsrfCookie,
} from '../utils/cookies.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateAuthInput = ({ email, password, name, requireName = false, requireStrongPassword = false }) => {
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedName = typeof name === 'string' ? name.trim() : '';
  if (!EMAIL_PATTERN.test(normalizedEmail) || normalizedEmail.length > 254) {
    throw Object.assign(new Error('Enter a valid email address'), { status: 400 });
  }
  const minimumLength = requireStrongPassword ? 10 : 1;
  if (typeof password !== 'string' || password.length < minimumLength || password.length > 128) {
    throw Object.assign(new Error(requireStrongPassword
      ? 'Password must be between 10 and 128 characters'
      : 'Email and password are required'), { status: 400 });
  }
  if (requireName && (normalizedName.length < 2 || normalizedName.length > 60)) {
    throw Object.assign(new Error('Name must be between 2 and 60 characters'), { status: 400 });
  }
  return { email: normalizedEmail, password, name: normalizedName };
};

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
  emailVerified: Boolean(user.email_confirmed_at),
});

const issueSession = (res, session) => {
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  setSessionCookies(res, session, csrfToken);
  return csrfToken;
};

const AUTH_ERROR_MESSAGES = {
  captcha_failed: 'CAPTCHA verification failed. Check the Supabase CAPTCHA configuration.',
  email_address_invalid: 'Enter a deliverable email address.',
  email_address_not_authorized: 'Supabase is not authorized to send email to this address. Configure custom SMTP or use an authorized team email.',
  email_not_confirmed: 'Confirm your email address before signing in. Check your inbox for the link.',
  email_provider_disabled: 'Email registration is disabled for this project.',
  over_email_send_rate_limit: 'Too many confirmation emails were requested. Please wait before trying again.',
  over_request_rate_limit: 'Too many authentication attempts. Please try again later.',
  signup_disabled: 'New account registration is currently disabled.',
  user_already_exists: 'An account with this email already exists. Sign in instead.',
  weak_password: 'Choose a stronger password that has not appeared in known password breaches.',
};

export const toAuthError = (result, fallback, operation = 'authentication', requestId = 'unknown') => {
  const code = result.data?.error_code || result.data?.code || '';
  const status = result.status === 429 ? 429 : result.status >= 500 ? 503 : operation === 'login' ? 401 : 400;
  console.warn(`[${requestId}] Supabase ${operation} rejected: status=${result.status} code=${code || 'unknown'}`);
  return Object.assign(new Error(AUTH_ERROR_MESSAGES[code] || fallback), { status, code });
};

export const register = async (req, res, next) => {
  try {
    const credentials = validateAuthInput({ ...req.body, requireName: true, requireStrongPassword: true });
    const result = await signUp(credentials.email, credentials.password, credentials.name);
    if (!result.ok || !result.data?.user) {
      throw toAuthError(result, 'Registration could not be completed. Check the Supabase Auth logs for details.', 'registration', req.requestId);
    }

    if (!result.data.access_token) {
      return res.status(201).json({
        requiresEmailConfirmation: true,
        message: 'Check your email to confirm your account before signing in.',
      });
    }

    const csrfToken = issueSession(res, result.data);
    res.status(201).json({ user: publicUser(result.data.user), csrfToken });
  } catch (error) { next(error); }
};

export const login = async (req, res, next) => {
  try {
    const credentials = validateAuthInput(req.body || {});
    const result = await signIn(credentials.email, credentials.password);
    if (!result.ok || !result.data?.access_token || !result.data?.user) {
      throw toAuthError(result, 'Invalid email or password', 'login', req.requestId);
    }
    const csrfToken = issueSession(res, result.data);
    res.json({ user: publicUser(result.data.user), csrfToken });
  } catch (error) { next(error); }
};

// Signs the visitor into the shared demo account. The credentials live only on the
// server, so the browser never learns them and the account cannot be reused outside
// this endpoint.
export const demoLogin = async (req, res, next) => {
  try {
    if (!config.demoEmail || !config.demoPassword) {
      throw Object.assign(new Error('The demo is not available right now'), { status: 503 });
    }

    const result = await signIn(config.demoEmail, config.demoPassword);
    if (!result.ok || !result.data?.access_token || !result.data?.user) {
      // The visitor cannot fix this, so it reads as an outage rather than a refusal.
      console.warn(`[${req.requestId}] demo sign-in failed: status=${result.status}`);
      throw Object.assign(new Error('The demo is not available right now'), { status: 503 });
    }

    const csrfToken = issueSession(res, result.data);
    res.json({ user: { ...publicUser(result.data.user), isDemo: true }, csrfToken });
  } catch (error) { next(error); }
};

export const session = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    let userResult = cookies[ACCESS_COOKIE] ? await getUser(cookies[ACCESS_COOKIE]) : { ok: false };
    let csrfToken;

    if (!userResult.ok && cookies[REFRESH_COOKIE]) {
      const refreshed = await refreshSession(cookies[REFRESH_COOKIE]);
      if (refreshed.ok && refreshed.data?.access_token) {
        csrfToken = issueSession(res, refreshed.data);
        userResult = { ok: true, data: refreshed.data.user };
      }
    }

    if (!userResult.ok || !userResult.data?.id) {
      clearSessionCookies(res);
      return res.status(401).json({ error: 'No active session' });
    }

    if (!csrfToken) {
      csrfToken = crypto.randomBytes(32).toString('base64url');
      setCsrfCookie(res, csrfToken);
    }
    const user = publicUser(userResult.data);
    res.json({
      user: { ...user, isDemo: Boolean(config.demoEmail && user.email?.toLowerCase() === config.demoEmail) },
      csrfToken,
    });
  } catch (error) { next(error); }
};

// The address the reset link returns to. Supabase only honours URLs on its own
// redirect allow list, so this has to match what is configured there.
const appOrigin = () => config.frontendOrigins[0] || '';

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = validateAuthInput({ ...req.body, password: 'placeholder-value' });
    const result = await requestPasswordReset(email, `${appOrigin()}/reset-password`);

    // Supabase reports a refused send as a status, not an exception, so checking it
    // is the only way this ever reaches a log. Returning the same answer to every
    // caller must not also mean returning no answer to whoever runs the service.
    if (!result.ok) {
      console.warn(
        `[${req.requestId}] Supabase recovery mail rejected: status=${result.status} `
        + `code=${result.data?.error_code || result.data?.code || 'unknown'} `
        + `msg=${result.data?.msg || result.data?.message || 'none'}`,
      );
    }
  } catch (error) {
    if (error.status === 400) return next(error);
    console.warn(`[${req.requestId}] password reset request failed: ${error.message}`);
  }

  // Always the same response. Saying "no account with that email" would turn this
  // endpoint into a way to test which addresses are registered.
  res.json({ message: 'If that address has an account, a reset link is on its way.' });
};

// The recovery link hands the browser a session in the URL fragment. This swaps it
// for the same HttpOnly cookies every other sign-in uses, so the rest of the app
// needs no special case for a user who arrived this way.
export const recoverSession = async (req, res, next) => {
  try {
    const accessToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken : '';
    const refreshToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : '';
    if (!accessToken || !refreshToken) {
      throw Object.assign(new Error('That reset link is incomplete'), { status: 400 });
    }

    // Never trust the token because it arrived: ask Supabase who it belongs to.
    const result = await getUser(accessToken);
    if (!result.ok || !result.data?.id) {
      throw Object.assign(
        new Error('That reset link has expired. Request a new one.'),
        { status: 401 },
      );
    }

    const csrfToken = issueSession(res, {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
    });
    res.json({ user: publicUser(result.data), csrfToken });
  } catch (error) { next(error); }
};

// Requires a signed-in session, which covers both a recovery link and a user
// changing their password from inside the app.
export const changePassword = async (req, res, next) => {
  try {
    const { password } = validateAuthInput({
      email: req.user?.email,
      password: req.body?.password,
      requireStrongPassword: true,
    });

    const result = await updatePassword(req.accessToken, password);
    if (!result.ok) {
      throw toAuthError(result, 'That password could not be saved', 'password change', req.requestId);
    }

    res.json({ message: 'Password updated. Use it next time you sign in.' });
  } catch (error) { next(error); }
};

export const resendConfirmation = async (req, res, next) => {
  try {
    const { email } = validateAuthInput({ ...req.body, password: 'placeholder-value' });
    const result = await resendVerification(email, `${appOrigin()}/login`);

    if (!result.ok) {
      console.warn(
        `[${req.requestId}] Supabase confirmation mail rejected: status=${result.status} `
        + `code=${result.data?.error_code || result.data?.code || 'unknown'} `
        + `msg=${result.data?.msg || result.data?.message || 'none'}`,
      );
    }
  } catch (error) {
    if (error.status === 400) return next(error);
    console.warn(`[${req.requestId}] confirmation resend failed: ${error.message}`);
  }

  res.json({ message: 'If that address needs confirming, a new link is on its way.' });
};

export const logout = async (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  try {
    let accessToken = cookies[ACCESS_COOKIE];
    if (!accessToken && cookies[REFRESH_COOKIE]) {
      const refreshed = await refreshSession(cookies[REFRESH_COOKIE]);
      if (refreshed.ok) accessToken = refreshed.data?.access_token;
    }
    if (accessToken) {
      // Drop the cached lookup first so the token cannot survive this logout.
      clearCachedUser(accessToken);
      await signOut(accessToken);
    }
    if (cookies[ACCESS_COOKIE]) clearCachedUser(cookies[ACCESS_COOKIE]);
  } catch {
    // Cookie removal is authoritative for this browser even if remote revocation is unavailable.
  } finally {
    clearSessionCookies(res);
    res.status(204).end();
  }
};
