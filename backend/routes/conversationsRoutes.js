import express from 'express';
import { destroy, index, show } from '../controllers/conversationsController.js';

const router = express.Router();

router.get('/', index);
router.get('/:conversationId', show);
router.delete('/:conversationId', destroy);

export default router;
