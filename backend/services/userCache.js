import crypto from 'crypto';

const TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;

const entries = new Map();

// Store a digest, not the token itself.
const keyFor = (accessToken) => crypto.createHash('sha256').update(accessToken).digest('base64');

export const getCachedUser = (accessToken) => {
  const key = keyFor(accessToken);
  const entry = entries.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    entries.delete(key);
    return null;
  }
  return entry.user;
};

export const setCachedUser = (accessToken, user) => {
  if (entries.size >= MAX_ENTRIES) {
    const now = Date.now();
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key);
    }
    // Still full after pruning, so drop the oldest.
    if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value);
  }
  entries.set(keyFor(accessToken), { user, expiresAt: Date.now() + TTL_MS });
};

export const clearCachedUser = (accessToken) => {
  entries.delete(keyFor(accessToken));
};
