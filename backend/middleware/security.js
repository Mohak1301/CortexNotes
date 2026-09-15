import crypto from 'crypto';
import { config } from '../config.js';

const buckets = new Map();

export const requestContext = (req, res, next) => {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  res.setHeader('Cache-Control', 'no-store');
  next();
};

// `subject` makes one shared bucket instead of per-caller. Return null to skip.
export const rateLimit = ({ limit, windowMs = config.rateLimitWindowMs, name = 'api', subject }) => (
  req,
  res,
  next,
) => {
  const now = Date.now();

  let keys;
  if (subject) {
    const value = subject(req);
    if (!value) return next();
    keys = [`${name}:${value}`];
  } else if (req.rateLimitSubject) {
    // req.ip is the proxy for every demo visitor, so counting it lumps them together.
    keys = [`${name}:owner:${req.rateLimitSubject}`];
  } else {
    // Enforce both network and workspace buckets so rotating a client ID cannot bypass limits.
    keys = [`${name}:ip:${req.ip}`];
    if (req.workspaceId) keys.push(`${name}:owner:${req.workspaceId}`);
  }
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

  // A status we set means we wrote the message too, so it is safe to send. Anything
  // without one is a crash, and its message could name internals.
  const deliberate = Boolean(error.status || error.statusCode || error.name === 'MulterError');

  // Crashes always, and deliberate outages too: a 503 is worth knowing about.
  if (!deliberate || status >= 500) console.error(`[${req.requestId}]`, deliberate ? error.message : error);

  res.status(status).json({
    error: deliberate ? error.message : 'The server could not complete the request',
    ...(deliberate && error.code ? { code: error.code } : {}),
    requestId: req.requestId,
  });
};
