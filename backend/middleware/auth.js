import crypto from 'crypto';
import { getUser } from '../services/supabaseAuth.js';
import { ACCESS_COOKIE, CSRF_COOKIE, parseCookies } from '../utils/cookies.js';

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

    const result = await getUser(accessToken);
    if (!result.ok || !result.data?.id) {
      return res.status(401).json({ error: 'Your session has expired', requestId: req.requestId });
    }

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
