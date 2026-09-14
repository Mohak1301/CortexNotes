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

    // Row level security returns an empty set for someone else's conversation, so a
    // conversation that does not exist and one that belongs to another account look
    // identical from here. That is also what stops this endpoint confirming that a
    // given id is real.
    res.json({ messages: (rows || []).map(toClientMessage) });
  } catch (error) { next(error); }
};

export const destroy = async (req, res, next) => {
  try {
    const conversationId = validateConversationId(req.params.conversationId);
    await deleteConversation(req.accessToken, conversationId);
    // Messages go with it through the cascade on the composite foreign key.
    res.status(204).end();
  } catch (error) { next(error); }
};
