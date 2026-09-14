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

// Sending mail costs Supabase quota and reveals timing, so these share the tight
// limit used by sign-in rather than the general one.
router.post('/forgot-password', authLimit, forgotPassword);
router.post('/resend-confirmation', authLimit, resendConfirmation);

// Exchanges the session from a recovery link for cookies. No CSRF check, for the
// same reason login has none: there is no session to protect yet.
router.post('/recover-session', authLimit, recoverSession);

// This router is mounted before the app-wide guard, so it states its own.
router.post('/password', requireAuth, requireCsrf, authLimit, changePassword);

export default router;
