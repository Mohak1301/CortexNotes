import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanFilename,
  createSourceId,
  validateChatMessage,
  validatePublicUrl,
  validateText,
} from '../utils/validation.js';

test('source identifiers are unguessable and typed', () => {
  const first = createSourceId('pdf');
  const second = createSourceId('pdf');
  assert.match(first, /^pdf_[0-9a-f-]{36}$/);
  assert.notEqual(first, second);
});

test('user text is trimmed and required', () => {
  assert.equal(validateText('  useful notes  '), 'useful notes');
  assert.throws(() => validateText('  '), /required/);
  assert.throws(() => validateText(null), /required/);
});

test('chat messages are bounded and normalized', () => {
  assert.equal(validateChatMessage('  question  '), 'question');
  assert.throws(() => validateChatMessage(''), /required/);
});

test('uploaded filenames cannot escape the temporary directory', () => {
  assert.equal(cleanFilename('../../secret\\file.pdf'), '.._.._secret_file.pdf');
  assert.equal(cleanFilename('safe.pdf'), 'safe.pdf');
});

test('private and credential-bearing URLs are blocked', async () => {
  await assert.rejects(validatePublicUrl('http://127.0.0.1/admin'), /Private network/);
  await assert.rejects(validatePublicUrl('http://user:pass@example.com'), /public HTTP/);
  await assert.rejects(validatePublicUrl('file:///etc/passwd'), /public HTTP/);
});
