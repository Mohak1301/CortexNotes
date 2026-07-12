import express from 'express';
import { deleteSource, clearAllSources, listSources } from '../controllers/sourcesController.js';

const router = express.Router();

router.get('/', listSources);

// Delete a specific source's embeddings
router.delete('/:sourceId', deleteSource);

// Clear all embeddings (for hard refresh simulation)
router.delete('/', clearAllSources);

export default router;
