import test from 'node:test';
import assert from 'node:assert/strict';
import { rateLimit } from '../middleware/security.js';

const run = (middleware, req) => {
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(key, value) { this.headers[key] = value; },
    status(code) { this.statusCode = code; return this; },
    json() { return this; },
  };
  let passed = false;
  middleware(req, res, () => { passed = true; });
  return { passed, status: res.statusCode };
};

const caller = (overrides) => ({ ip: '10.0.0.1', requestId: 'r', ...overrides });

test('two demo visitors behind one proxy address do not share an allowance', () => {
  // The real shape of the bug: every visitor reaches the service through the same
  // proxy, so ip is identical, and they all sign into one account, so workspaceId
  // is identical too. Only the session differs.
  const limiter = rateLimit({ limit: 2, name: `demo-fair-${Date.now()}` });

  const alice = caller({ workspaceId: 'shared-demo', rateLimitSubject: 'demo:alice' });
  const bob = caller({ workspaceId: 'shared-demo', rateLimitSubject: 'demo:bob' });

  assert.ok(run(limiter, alice).passed);
  assert.ok(run(limiter, alice).passed);
  assert.equal(run(limiter, alice).status, 429, 'alice should spend her own allowance');

  assert.ok(run(limiter, bob).passed, 'bob must not be blocked by alice');
  assert.ok(run(limiter, bob).passed);
});

test('a real account is still bucketed by workspace', () => {
  const limiter = rateLimit({ limit: 2, name: `owner-${Date.now()}` });
  const user = caller({ workspaceId: 'real-user' });

  assert.ok(run(limiter, user).passed);
  assert.ok(run(limiter, user).passed);
  assert.equal(run(limiter, user).status, 429);
});

test('a subject limiter counts every caller into one bucket', () => {
  const ceiling = rateLimit({ limit: 2, name: `ceiling-${Date.now()}`, subject: () => 'all' });

  assert.ok(run(ceiling, caller({ rateLimitSubject: 'demo:alice' })).passed);
  assert.ok(run(ceiling, caller({ rateLimitSubject: 'demo:bob' })).passed);
  // Third request from a third visitor: the ceiling is what caps the spend.
  assert.equal(run(ceiling, caller({ rateLimitSubject: 'demo:carol' })).status, 429);
});

test('a subject returning null skips the limit entirely', () => {
  const demoOnly = rateLimit({ limit: 1, name: `skip-${Date.now()}`, subject: () => null });

  // A signed-up account must not be counted against the demo ceiling.
  assert.ok(run(demoOnly, caller({ workspaceId: 'real-user' })).passed);
  assert.ok(run(demoOnly, caller({ workspaceId: 'real-user' })).passed);
  assert.ok(run(demoOnly, caller({ workspaceId: 'real-user' })).passed);
});
