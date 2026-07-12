import { config } from '../config.js';

const AUTH_TIMEOUT_MS = 10_000;

const authRequest = async (path, { method = 'GET', accessToken, body } = {}) => {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw Object.assign(new Error('Authentication service is not configured'), { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AUTH_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.supabaseUrl}/auth/v1${path}`, {
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
