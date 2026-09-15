import {
  deleteConversation,
  listConversations,
  listMessages,
} from '../services/chatHistory.js';
import { validateConversationId } from '../utils/validation.js';

const toClientConversation = (row) => ({
  id: row.id,
  title: row.title,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toClientMessage = (row) => ({
  id: row.id,
  type: row.role,
  content: row.content,
  sources: row.sources || [],
  timestamp: row.created_at,
});

export const index = async (req, res, next) => {
  try {
    const rows = await listConversations(req.accessToken);
    res.json({ conversations: (rows || []).map(toClientConversation) });
  } catch (error) { next(error); }
};

export const show = async (req, res, next) => {
  try {
    const conversationId = validateConversationId(req.params.conversationId);
    const rows = await listMessages(req.accessToken, conversationId);

    // Someone else's conversation comes back empty, same as one that doesn't exist.
    res.json({ messages: (rows || []).map(toClientMessage) });
  } catch (error) { next(error); }
};

export const destroy = async (req, res, next) => {
  try {
    const conversationId = validateConversationId(req.params.conversationId);
    await deleteConversation(req.accessToken, conversationId);
    // Messages cascade with it.
    res.status(204).end();
  } catch (error) { next(error); }
};
