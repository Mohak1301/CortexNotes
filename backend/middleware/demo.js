import crypto from 'crypto';
import { config } from '../config.js';

// The demo account is shared by every visitor, so it has to be read only. Without
// this, one person deleting the sample documents breaks the demo for everyone after
// them, and there is no way to tell who did it.
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

// Every demo visitor signs into the same account and arrives through the same
// proxy, so bucketing rate limits by workspace or address puts them all together:
// four people chatting at once exhausts the allowance and the fifth is told to
// slow down. Their access token is the only thing that differs, so it stands in
// for an identity here.
//
// It is a weak one - clearing cookies earns a fresh bucket - which is why the
// ceiling over all demo chats exists alongside it.
export const demoRateSubject = (req, _res, next) => {
  if (isDemoUser(req) && req.accessToken) {
    req.rateLimitSubject = `demo:${crypto.createHash('sha256').update(req.accessToken).digest('base64url').slice(0, 22)}`;
  }
  next();
};
