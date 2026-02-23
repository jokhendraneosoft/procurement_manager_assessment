import mongoose from 'mongoose';
import { env } from './env';
import { logger } from '../utils/logger';

const RECONNECT_MAX_DELAY_MS = 30000;
const RECONNECT_INITIAL_DELAY_MS = 1000;

let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let isShuttingDown = false;

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
        });
        reconnectAttempts = 0;
        logger.info({ host: conn.connection.host }, 'MongoDB connected');
    } catch (error) {
        logger.error({ err: error }, 'MongoDB connection failed');
        process.exit(1);
    }
};

function scheduleReconnect(): void {
    if (reconnectTimer || isShuttingDown) return;
    const delay = Math.min(
        RECONNECT_INITIAL_DELAY_MS * Math.pow(2, reconnectAttempts),
        RECONNECT_MAX_DELAY_MS,
    );
    reconnectAttempts += 1;
    logger.warn(
        { attempt: reconnectAttempts, delayMs: delay },
        'MongoDB disconnected. Reconnecting...',
    );
    reconnectTimer = setTimeout(async () => {
        reconnectTimer = null;
        try {
            await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
            reconnectAttempts = 0;
            logger.info('MongoDB reconnected');
        } catch (err) {
            logger.error({ err }, 'MongoDB reconnect failed');
            scheduleReconnect();
        }
    }, delay);
}

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
    scheduleReconnect();
});

mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
});

/** Close MongoDB connection (for graceful shutdown) */
export const closeDB = (): Promise<void> => {
    isShuttingDown = true;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    return mongoose.connection.close();
};

/** Check if DB is connected (for readiness probe) */
export const isDBConnected = (): boolean => {
    return mongoose.connection.readyState === 1;
};

/** Ping DB (for readiness probe; returns a promise) */
export const pingDB = async (): Promise<boolean> => {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) return false;
    try {
        await mongoose.connection.db.admin().ping();
        return true;
    } catch {
        return false;
    }
};
