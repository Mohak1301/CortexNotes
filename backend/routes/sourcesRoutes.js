import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getUserSources, getAllDocuments } from '../controllers/sourcesController.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all sources for the authenticated user
router.get('/', getUserSources);

// Test endpoint to check all documents (for debugging)
router.get('/test', getAllDocuments);

export default router;
