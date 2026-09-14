import test from 'node:test';
import assert from 'node:assert/strict';
import { clearCachedUser, getCachedUser, setCachedUser } from '../services/userCache.js';

test('cached lookups are scoped to the exact access token', () => {
  setCachedUser('token-a', { id: 'user-a' });

  assert.deepEqual(getCachedUser('token-a'), { id: 'user-a' });
  assert.equal(getCachedUser('token-b'), null);

  clearCachedUser('token-a');
});

test('logout removes the entry so a revoked token stops working at once', () => {
  setCachedUser('token-c', { id: 'user-c' });
  assert.ok(getCachedUser('token-c'));

  clearCachedUser('token-c');

  assert.equal(getCachedUser('token-c'), null);
});

test('entries expire rather than authorising indefinitely', async () => {
  setCachedUser('token-d', { id: 'user-d' });

  const now = Date.now;
  try {
    // Sixty-one seconds on from the write, the entry must no longer count.
    Date.now = () => now() + 61_000;
    assert.equal(getCachedUser('token-d'), null);
  } finally {
    Date.now = now;
  }
});
