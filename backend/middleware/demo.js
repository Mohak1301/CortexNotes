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
