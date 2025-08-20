import express from "express";
import { chat } from "../controllers/chatController.js";
import { authMiddleware, checkQueryLimit } from "../middleware/authMiddleware.js";

const router = express.Router();

// Chat route - requires authentication and checks query limit
router.post("/chat", authMiddleware, checkQueryLimit, chat);

export default router;
