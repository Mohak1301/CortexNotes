import express from 'express';
import {
  changePassword,
  demoLogin,
  forgotPassword,
  login,
  logout,
  recoverSession,
  register,
  resendConfirmation,
  session,
} from '../controllers/authController.js';
import { requireAuth, requireCsrf } from '../middleware/auth.js';
import { rateLimit } from '../middleware/security.js';

const router = express.Router();
const authLimit = rateLimit({ limit: 10, windowMs: 15 * 60 * 1000, name: 'auth' });
const sessionLimit = rateLimit({ limit: 120, windowMs: 15 * 60 * 1000, name: 'auth-session' });

router.post('/register', authLimit, register);
router.post('/login', authLimit, login);
router.post('/demo', authLimit, demoLogin);
router.get('/session', sessionLimit, session);
router.post('/logout', requireCsrf, logout);

// Mail costs quota, so these share sign-in's tighter limit.
router.post('/forgot-password', authLimit, forgotPassword);
router.post('/resend-confirmation', authLimit, resendConfirmation);

// No CSRF check here, same as login: there's no session to protect yet.
router.post('/recover-session', authLimit, recoverSession);

// Mounted before the app-wide guard, so it needs its own.
router.post('/password', requireAuth, requireCsrf, authLimit, changePassword);

export default router;
