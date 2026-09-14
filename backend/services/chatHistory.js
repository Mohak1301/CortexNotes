import 'dotenv/config';
import { config } from '../config.js';

const REST_TIMEOUT_MS = 10_000;

// PostgREST exposes the tables over HTTP. Every request carries the caller's own
// access token, so row level security decides which rows come back. Nothing in this
// file filters by user, which means nothing in this file can forget to.
const restRequest = async (path, { method = 'GET', accessToken, body, prefer } = {}) => {
  if (!config.supabaseUrl || !config.supabasePublishableKey) {
    throw Object.assign(new Error('Chat history is not configured'), { status: 503 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REST_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.supabaseUrl}/rest/v1${path}`, {
      method,
      signal: controller.signal,
      headers: {
        apikey: config.supabasePublishableKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = response.status === 204 ? null : await response.json().catch(() => null);

    if (!response.ok) {
      // Postgres error text can name columns and constraints, so it stays in the
      // log rather than going back to the browser.
      console.warn(`[history] ${method} ${path} -> ${response.status} ${data?.code || ''}`);
      throw Object.assign(
        new Error('Chat history is unavailable right now'),
        { status: response.status >= 500 ? 503 : 400 },
      );
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw Object.assign(new Error('Chat history timed out'), { status: 503 });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const TITLE_LIMIT = 60;

// A first message is a good enough title and costs nothing. An LLM-written title
// would be nicer and would add a second model call to every new conversation.
export const titleFromMessage = (message) => {
  const collapsed = message.replace(/\s+/g, ' ').trim();
  if (collapsed.length === 0) return 'New chat';
  return collapsed.length > TITLE_LIMIT
    ? `${collapsed.slice(0, TITLE_LIMIT - 1)}…`
    : collapsed;
};

export const listConversations = (accessToken) => restRequest(
  '/conversations?select=id,title,created_at,updated_at&order=updated_at.desc&limit=100',
  { accessToken },
);

export const createConversation = (accessToken, userId, title) => restRequest(
  '/conversations',
  {
    method: 'POST',
    accessToken,
    // Without this header PostgREST returns an empty body on insert.
    prefer: 'return=representation',
    body: { user_id: userId, title },
  },
).then((rows) => rows?.[0]);

export const listMessages = (accessToken, conversationId) => restRequest(
  `/messages?select=id,role,content,sources,created_at&conversation_id=eq.${encodeURIComponent(conversationId)}&order=created_at.asc&limit=500`,
  { accessToken },
);

export const appendMessage = (accessToken, { conversationId, userId, role, content, sources = [] }) => restRequest(
  '/messages',
  {
    method: 'POST',
    accessToken,
    prefer: 'return=representation',
    body: {
      conversation_id: conversationId,
      user_id: userId,
      role,
      content,
      sources,
    },
  },
).then((rows) => rows?.[0]);

export const deleteConversation = (accessToken, conversationId) => restRequest(
  `/conversations?id=eq.${encodeURIComponent(conversationId)}`,
  { method: 'DELETE', accessToken },
);
