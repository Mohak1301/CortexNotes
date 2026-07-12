import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChatCompletionRequest } from '../services/chatCompletion.js';

test('chat completion request keeps timeout out of the OpenAI payload', () => {
  const messages = [
    { role: 'system', content: 'system prompt' },
    { role: 'user', content: 'hello' },
  ];

  const { body, options } = buildChatCompletionRequest(messages);

  assert.equal(body.model, 'gpt-4.1-mini');
  assert.deepEqual(body.messages, messages);
  assert.equal(body.temperature, 0.2);
  assert.equal(body.max_tokens, 1200);
  assert.equal('timeout' in body, false);
  assert.equal(typeof options.timeout, 'number');
  assert.equal(options.timeout > 0, true);
});
