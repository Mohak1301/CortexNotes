import express from "express";
import { chat } from "../controllers/chatController.js";
import { config } from '../config.js';
import { rateLimit } from '../middleware/security.js';

const router = express.Router();

router.post(
  "/chat",
  rateLimit({ limit: config.expensiveRateLimit, name: 'chat' }),
  chat,
);

export default router;
