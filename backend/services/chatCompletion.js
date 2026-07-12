import { config } from '../config.js';

export const buildChatCompletionRequest = (messages) => ({
  body: {
    model: 'gpt-4.1-mini',
    messages,
    temperature: 0.2,
    max_tokens: 1200,
  },
  options: {
    timeout: config.requestTimeoutMs,
  },
});
