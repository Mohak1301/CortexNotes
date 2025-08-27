import express from 'express';
import { deleteSource, clearAllSources, getAllDocuments } from '../controllers/sourcesController.js';

const router = express.Router();

// Delete a specific source's embeddings
router.delete('/:sourceId', deleteSource);

// Clear all embeddings (for hard refresh simulation)
router.delete('/', clearAllSources);

// Handle sendBeacon requests for page refresh cleanup
router.post('/', clearAllSources);

// Test endpoint to get all documents from vector DB
router.get('/test', getAllDocuments);

export default router;
