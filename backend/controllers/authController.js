import crypto from 'crypto';
import { getUser, refreshSession, signIn, signOut, signUp } from '../services/supabaseAuth.js';
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
    res.json({ user: publicUser(userResult.data), csrfToken });
  } catch (error) { next(error); }
};

export const logout = async (req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  try {
    let accessToken = cookies[ACCESS_COOKIE];
    if (!accessToken && cookies[REFRESH_COOKIE]) {
      const refreshed = await refreshSession(cookies[REFRESH_COOKIE]);
      if (refreshed.ok) accessToken = refreshed.data?.access_token;
    }
    if (accessToken) await signOut(accessToken);
  } catch {
    // Cookie removal is authoritative for this browser even if remote revocation is unavailable.
  } finally {
    clearSessionCookies(res);
    res.status(204).end();
  }
};
