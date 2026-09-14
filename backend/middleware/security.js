import crypto from 'crypto';
import { config } from '../config.js';

const buckets = new Map();

export const requestContext = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('Cache-Control', 'no-store');
  next();
};

export const rateLimit = ({ limit, windowMs = config.rateLimitWindowMs, name = 'api' }) => (
  req,
  res,
  next,
) => {
  const now = Date.now();
  // Enforce both network and workspace buckets so rotating a client ID cannot bypass limits.
  const keys = [`${name}:ip:${req.ip}`];
  if (req.workspaceId) keys.push(`${name}:workspace:${req.workspaceId}`);
  const activeBuckets = keys.map((key) => {
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    return bucket;
  });
  const bucket = activeBuckets.reduce((mostUsed, current) => current.count > mostUsed.count ? current : mostUsed);

  const remaining = Math.max(0, limit - bucket.count);
  res.setHeader('RateLimit-Limit', limit);
  res.setHeader('RateLimit-Remaining', remaining);
  res.setHeader('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));

  if (activeBuckets.some((candidate) => candidate.count > limit)) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: 'Too many requests. Please try again shortly.',
      requestId: req.requestId,
    });
  }

  if (buckets.size > 10_000) {
    for (const [bucketKey, value] of buckets) {
      if (value.resetAt <= now) buckets.delete(bucketKey);
    }
  }
  next();
};

export const notFound = (req, res) => {
  res.status(404).json({ error: 'Route not found', requestId: req.requestId });
};

export const errorHandler = (error, req, res, _next) => {
  const status = error.status || error.statusCode || (error.name === 'MulterError' ? 400 : 500);
  const expected = status >= 400 && status < 500;
  if (!expected) console.error(`[${req.requestId}]`, error);

  const message = expected ? error.message : 'The server could not complete the request';

  // Expected errors are ones this app threw itself, so their code is safe to pass
  // on and lets the interface react - offering to resend a confirmation, say.
  // Unexpected errors keep their code to themselves.
  res.status(status).json({
    error: message,
    ...(expected && error.code ? { code: error.code } : {}),
    requestId: req.requestId,
  });
};
