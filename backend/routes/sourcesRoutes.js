import express from 'express';
import { deleteSource, clearAllSources, listSources } from '../controllers/sourcesController.js';
import { blockDemoWrites } from '../middleware/demo.js';

const router = express.Router();

router.get('/', listSources);

// Delete a specific source's embeddings
router.delete('/:sourceId', blockDemoWrites, deleteSource);

// Clear all embeddings (for hard refresh simulation)
router.delete('/', blockDemoWrites, clearAllSources);

export default router;
