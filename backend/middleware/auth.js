import crypto from 'crypto';
import { getUser } from '../services/supabaseAuth.js';
import { ACCESS_COOKIE, CSRF_COOKIE, parseCookies } from '../utils/cookies.js';
import { getCachedUser, setCachedUser } from '../services/userCache.js';

const safeEqual = (left, right) => {
  const a = Buffer.from(left || '');
  const b = Buffer.from(right || '');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

export const requireAuth = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const accessToken = cookies[ACCESS_COOKIE];
    if (!accessToken) {
      return res.status(401).json({ error: 'Authentication required', requestId: req.requestId });
    }

    // Supabase is a network hop away, so skip it when this token was checked
    // moments ago. Logout clears the entry, so a signed-out token stops working
    // immediately rather than lingering for the cache lifetime.
    const cached = getCachedUser(accessToken);
    if (cached) {
      req.accessToken = accessToken;
      req.user = cached;
      req.workspaceId = cached.id;
      return next();
    }

    const result = await getUser(accessToken);
    if (!result.ok || !result.data?.id) {
      return res.status(401).json({ error: 'Your session has expired', requestId: req.requestId });
    }

    setCachedUser(accessToken, result.data);
    req.accessToken = accessToken;
    req.user = result.data;
    req.workspaceId = result.data.id;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireCsrf = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const cookies = parseCookies(req.headers.cookie);
  if (!safeEqual(cookies[CSRF_COOKIE], req.get('x-csrf-token'))) {
    return res.status(403).json({ error: 'Invalid security token', requestId: req.requestId });
  }
  next();
};
