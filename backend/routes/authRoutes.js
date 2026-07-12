import express from 'express';
import { login, logout, register, session } from '../controllers/authController.js';
import { requireCsrf } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';

const router = express.Router();
const authLimit = rateLimit({ limit: 10, windowMs: 15 * 60 * 1000, name: 'auth' });
const sessionLimit = rateLimit({ limit: 120, windowMs: 15 * 60 * 1000, name: 'auth-session' });

router.post('/register', authLimit, register);
router.post('/login', authLimit, login);
router.get('/session', sessionLimit, session);
router.post('/logout', requireCsrf, logout);

export default router;
