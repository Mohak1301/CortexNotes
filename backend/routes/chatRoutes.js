import express from "express";
import { chat } from "../controllers/chatController.js";
import { config } from '../config.js';
import { rateLimit } from '../middleware/security.js';
import { isDemoUser } from '../middleware/demo.js';

const router = express.Router();

router.post(
  "/chat",
  rateLimit({ limit: config.expensiveRateLimit, name: 'chat' }),
  // And a ceiling over all demo chats, so an open door isn't an open wallet.
  rateLimit({
    limit: config.demoChatCeiling,
    name: 'demo-chat-total',
    subject: (req) => (isDemoUser(req) ? 'all' : null),
  }),
  chat,
);

export default router;
