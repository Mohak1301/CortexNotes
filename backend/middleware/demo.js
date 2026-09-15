import crypto from 'crypto';
import { config } from '../config.js';

// Everyone shares the demo login, so one person could wipe it for the rest.
export const isDemoUser = (req) => Boolean(
  config.demoEmail
  && req.user?.email
  && req.user.email.toLowerCase() === config.demoEmail,
);

export const blockDemoWrites = (req, res, next) => {
  if (!isDemoUser(req)) return next();

  return res.status(403).json({
    error: 'The demo workspace is read only. Create an account to add your own sources.',
    code: 'demo_read_only',
    requestId: req.requestId,
  });
};

// Demo visitors share an account and a proxy, so only the token tells them apart.
// Clearing cookies gets a fresh bucket, which is what the global ceiling is for.
export const demoRateSubject = (req, _res, next) => {
  if (isDemoUser(req) && req.accessToken) {
    req.rateLimitSubject = `demo:${crypto.createHash('sha256').update(req.accessToken).digest('base64url').slice(0, 22)}`;
  }
  next();
};
