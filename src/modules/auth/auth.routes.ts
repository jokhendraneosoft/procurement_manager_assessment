import { Router } from 'express';
import { login, logout } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema } from '../../validators/auth.validator';
import { authenticate } from '../../middleware/auth.middleware';
import { loginRateLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route  POST /api/v1/auth/login
 * @desc   Login with email+password (admin/PM/client) or mobile+password (IM)
 * @access Public (rate limited: 5/15min per IP)
 */
router.post('/login', loginRateLimiter, validate(loginSchema), login);

/**
 * @route  POST /api/v1/auth/logout
 * @desc   Revoke current token (logout)
 * @access Authenticated
 */
router.post('/logout', authenticate, logout);

export default router;
