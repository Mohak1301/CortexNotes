import { config } from '../config.js';

const AUTH_TIMEOUT_MS = 10_000;

const authRequest = async (path, { method = 'GET', accessToken, body, query = '' } = {}) => {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw Object.assign(new Error('Authentication service is not configured'), { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const url = `${config.supabaseUrl}/auth/v1${path}${query ? `${path.includes('?') ? '&' : '?'}${query}` : ''}`;
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        apikey: config.supabasePublishableKey,
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('Authentication service timed out'), { status: 503 });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

export const signUp = (email, password, name) => authRequest('/signup', {
  method: 'POST',
  body: { email, password, data: { name } },
});

export const signIn = (email, password) => authRequest('/token?grant_type=password', {
  method: 'POST',
  body: { email, password },
});

export const refreshSession = (refreshToken) => authRequest('/token?grant_type=refresh_token', {
  method: 'POST',
  body: { refresh_token: refreshToken },
});

export const getUser = (accessToken) => authRequest('/user', { accessToken });

export const signOut = (accessToken) => authRequest('/logout', {
  method: 'POST',
  accessToken,
});

// Supabase mails a link that lands on redirectTo with a recovery session in the
// URL fragment. It answers the same way whether or not the address has an account.
export const requestPasswordReset = (email, redirectTo) => authRequest('/recover', {
  method: 'POST',
  body: { email, gotrue_meta_security: {} },
  query: redirectTo ? `redirect_to=${encodeURIComponent(redirectTo)}` : '',
});

// Needs a valid session, which after a recovery link is the one that link carried.
export const updatePassword = (accessToken, password) => authRequest('/user', {
  method: 'PUT',
  accessToken,
  body: { password },
});

export const resendVerification = (email, redirectTo) => authRequest('/resend', {
  method: 'POST',
  body: { type: 'signup', email },
  query: redirectTo ? `redirect_to=${encodeURIComponent(redirectTo)}` : '',
});
