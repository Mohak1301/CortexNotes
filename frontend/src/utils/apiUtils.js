import { getApiUrl, API_ENDPOINTS } from '../config/api.js';
import toast from 'react-hot-toast';

let csrfToken = '';

export const setCsrfToken = (token = '') => { csrfToken = token; };

const executeFetch = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const isFormData = options.body instanceof FormData;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 35_000);
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
    ...options.headers,
  };

  try {
    return await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
      signal: options.signal || controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
};

const restoreSession = async () => {
  const response = await executeFetch(API_ENDPOINTS.AUTH_SESSION);
  if (!response.ok) {
    setCsrfToken();
    window.dispatchEvent(new Event('cortex:auth-expired'));
    return false;
  }
  const data = await response.json();
  setCsrfToken(data.csrfToken);
  return true;
};

export const apiFetch = async (endpoint, options = {}) => {
  const { skipAuthRetry, ...fetchOptions } = options;
  let response = await executeFetch(endpoint, fetchOptions);
  const isAuthEndpoint = endpoint.startsWith('/api/auth/');

  if (response.status === 401 && !skipAuthRetry && !isAuthEndpoint && await restoreSession()) {
    response = await executeFetch(endpoint, fetchOptions);
  }
  return response;
};

export const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || 'An error occurred';
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
  return { success: true };
};

// Reads a text/event-stream response and hands each token to onDelta as it lands,
// so the UI can render the answer while the model is still writing it.
export const streamApi = async (endpoint, options, onDelta) => {
  const response = await apiFetch(endpoint, options);
  // Errors arrive as normal JSON, so leave the body for the caller to read.
  if (!response.ok || !response.body) return response;

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Events are separated by a blank line. A trailing fragment means the last
    // event is still arriving, so hold it back until the next read completes it.
    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const event of events) {
      const payload = event.replace(/^data:\s*/, '').trim();
      if (!payload || payload === '[DONE]') continue;

      let parsed;
      try {
        parsed = JSON.parse(payload);
      } catch {
        continue;
      }
      if (parsed.error) throw new Error(parsed.error);
      if (parsed.delta) onDelta(parsed.delta);
    }
  }

  return response;
};
