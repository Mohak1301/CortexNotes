import { config } from '../config.js';

export const ACCESS_COOKIE = 'cn_access';
export const REFRESH_COOKIE = 'cn_refresh';
export const CSRF_COOKIE = 'cn_csrf';

export const parseCookies = (header = '') => Object.fromEntries(
  header.split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [part, ''];
    const key = part.slice(0, separator);
    const value = part.slice(separator + 1);
    try { return [key, decodeURIComponent(value)]; } catch { return [key, '']; }
  }),
);

const serializeCookie = (name, value, { maxAge, httpOnly = true } = {}) => {
  const attributes = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/api',
    `SameSite=${config.authCookieSameSite[0].toUpperCase()}${config.authCookieSameSite.slice(1)}`,
    ...(httpOnly ? ['HttpOnly'] : []),
    ...(config.authCookieSecure ? ['Secure'] : []),
    ...(config.authCookieDomain ? [`Domain=${config.authCookieDomain}`] : []),
    ...(Number.isFinite(maxAge) ? [`Max-Age=${Math.max(0, Math.floor(maxAge))}`] : []),
  ];
  return attributes.join('; ');
};

export const setSessionCookies = (res, session, csrfToken) => {
  res.append('Set-Cookie', serializeCookie(ACCESS_COOKIE, session.access_token, {
    maxAge: Number(session.expires_in) || 3600,
  }));
  res.append('Set-Cookie', serializeCookie(REFRESH_COOKIE, session.refresh_token, {
    maxAge: 60 * 60 * 24 * 30,
  }));
  res.append('Set-Cookie', serializeCookie(CSRF_COOKIE, csrfToken, {
    maxAge: 60 * 60 * 24 * 30,
  }));
};

export const setCsrfCookie = (res, csrfToken) => {
  res.append('Set-Cookie', serializeCookie(CSRF_COOKIE, csrfToken, {
    maxAge: 60 * 60 * 24 * 30,
  }));
};

export const clearSessionCookies = (res) => {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE]) {
    res.append('Set-Cookie', serializeCookie(name, '', { maxAge: 0 }));
  }
};
