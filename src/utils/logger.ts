import pino from 'pino';
import { env } from '../config/env';

export const logger = pino({
    level: env.isDev ? 'debug' : 'info',
    formatters: {
        level: (label) => ({ level: label }),
    },
});
