import { Router } from 'express';
import { login, logout, refresh } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { loginSchema, refreshSchema } from '../../validators/auth.validator';
import { authenticate } from '../../middleware/auth.middleware';
import { loginRateLimiter } from '../../middleware/rateLimit.middleware';

const router = Router();

/**
 * @route  POST /api/v1/auth/login
 * @desc   Login with email+password (admin/PM/client) or mobile+password (IM). Returns access token + refresh token.
 * @access Public (rate limited: 5/15min per IP)
 */
router.post('/login', loginRateLimiter, validate(loginSchema), login);

/**
 * @route  POST /api/v1/auth/refresh
 * @desc   Exchange refresh (reference) token for new access token and new refresh token
 * @access Public (send refreshToken in body)
 */
router.post('/refresh', loginRateLimiter, validate(refreshSchema), refresh);

/**
 * @route  POST /api/v1/auth/logout
 * @desc   Revoke current access token (logout)
 * @access Authenticated
 */
router.post('/logout', authenticate, logout);

export default router;
