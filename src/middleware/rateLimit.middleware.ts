import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/** Global: 100 requests per 15 minutes per IP */
export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.isDev ? 1000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Try again later.' },
});

/** Login: 5 attempts per 15 minutes per IP (brute-force protection) */
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});
