import test from 'node:test';
import assert from 'node:assert/strict';
import { toAuthError, validateAuthInput } from '../controllers/authController.js';
import { requireCsrf } from '../middleware/auth.js';
import { CSRF_COOKIE, parseCookies } from '../utils/cookies.js';

test('registration normalizes identity fields and enforces strong passwords', () => {
  const result = validateAuthInput({
    email: '  Person@Example.COM ',
    password: 'long-password',
    name: '  Person Name ',
    requireName: true,
    requireStrongPassword: true,
  });
  assert.equal(result.email, 'person@example.com');
  assert.equal(result.name, 'Person Name');
  assert.throws(() => validateAuthInput({
    email: 'person@example.com',
    password: 'short',
    name: 'Person',
    requireName: true,
    requireStrongPassword: true,
  }), /between 10 and 128/);
});

test('login remains compatible with existing shorter passwords', () => {
  assert.equal(validateAuthInput({ email: 'person@example.com', password: 'legacy' }).password, 'legacy');
});

test('cookie parser handles encoded values and malformed segments safely', () => {
  assert.deepEqual(parseCookies('a=hello%20world; token=abc.def; invalid'), {
    a: 'hello world',
    token: 'abc.def',
    invalid: '',
  });
});

test('CSRF middleware rejects missing or mismatched double-submit tokens', () => {
  const request = {
    method: 'POST',
    requestId: 'request-id',
    headers: { cookie: `${CSRF_COOKIE}=expected` },
    get: () => 'wrong',
  };
  let responseStatus;
  const response = {
    status(status) { responseStatus = status; return this; },
    json(body) { return body; },
  };
  requireCsrf(request, response, () => assert.fail('mismatched CSRF token must not call next'));
  assert.equal(responseStatus, 403);
});

test('CSRF middleware accepts a matching token', () => {
  const request = {
    method: 'DELETE',
    headers: { cookie: `${CSRF_COOKIE}=matching-token` },
    get: () => 'matching-token',
  };
  let called = false;
  requireCsrf(request, {}, () => { called = true; });
  assert.equal(called, true);
});

test('Supabase failures are converted to safe actionable errors', () => {
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    const smtpError = toAuthError({
      status: 400,
      data: { error_code: 'email_address_not_authorized', message: 'provider internals' },
    }, 'fallback', 'registration', 'request-id');
    assert.equal(smtpError.status, 400);
    assert.match(smtpError.message, /custom SMTP/);
    assert.doesNotMatch(smtpError.message, /provider internals/);
  } finally {
    console.warn = originalWarn;
  }
});
