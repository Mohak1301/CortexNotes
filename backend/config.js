import 'dotenv/config';

const getInteger = (name, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const value = Number.parseInt(process.env[name] ?? `${fallback}`, 10);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max}`);
  }
  return value;
};

const splitOrigins = (value = '') => value
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const cookieSameSite = (process.env.AUTH_COOKIE_SAME_SITE || 'lax').toLowerCase();
if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
  throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
}

export const config = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: getInteger('PORT', 5000, { max: 65535 }),
  frontendOrigins: [
    ...splitOrigins(process.env.FRONTEND_URLS || process.env.FRONTEND_URL),
    ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
  ],
  supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/$/, ''),
  supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
  authCookieSameSite: cookieSameSite,
  authCookieDomain: process.env.AUTH_COOKIE_DOMAIN || '',
  authCookieSecure: process.env.AUTH_COOKIE_SECURE
    ? process.env.AUTH_COOKIE_SECURE === 'true'
    : process.env.NODE_ENV === 'production',
  maxPdfBytes: getInteger('MAX_PDF_BYTES', 10 * 1024 * 1024, { max: 25 * 1024 * 1024 }),
  maxTextChars: getInteger('MAX_TEXT_CHARS', 200_000, { max: 1_000_000 }),
  maxChatChars: getInteger('MAX_CHAT_CHARS', 4_000, { max: 20_000 }),
  maxWebBytes: getInteger('MAX_WEB_BYTES', 2 * 1024 * 1024, { max: 5 * 1024 * 1024 }),
  maxExtractedChars: getInteger('MAX_EXTRACTED_CHARS', 1_000_000, { max: 5_000_000 }),
  requestTimeoutMs: getInteger('REQUEST_TIMEOUT_MS', 30_000, { min: 1_000, max: 120_000 }),
  rateLimitWindowMs: getInteger('RATE_LIMIT_WINDOW_MS', 60_000, { min: 1_000 }),
  generalRateLimit: getInteger('RATE_LIMIT_MAX', 120),
  expensiveRateLimit: getInteger('EXPENSIVE_RATE_LIMIT_MAX', 12),
  trustProxy: process.env.TRUST_PROXY === 'true' ? 1 : false,
});

export const assertProductionConfig = () => {
  if (config.nodeEnv !== 'production') return;

  const missing = [
    'OPENAI_API_KEY',
    'QDRANT_URL',
    'QDRANT_API_KEY',
    'QDRANT_COLLECTION_NAME',
    'SUPABASE_URL',
  ]
    .filter((name) => !process.env[name]);

  if (!config.supabasePublishableKey) missing.push('SUPABASE_PUBLISHABLE_KEY');

  if (missing.length > 0) {
    throw new Error(`Missing required production variables: ${missing.join(', ')}`);
  }
  if (config.frontendOrigins.length === 0) {
    throw new Error('FRONTEND_URL or FRONTEND_URLS is required in production');
  }
  if (config.authCookieSameSite === 'none' && !config.authCookieSecure) {
    throw new Error('AUTH_COOKIE_SECURE must be true when AUTH_COOKIE_SAME_SITE=none');
  }
};
