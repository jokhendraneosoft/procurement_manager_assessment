import { env } from './config/env';
import { connectDB, closeDB } from './config/db';
import app from './app';
import { logger } from './utils/logger';

const SHUTDOWN_DEADLINE_MS = 10000;

const startServer = async (): Promise<void> => {
    await connectDB();

    const server = app.listen(env.PORT, () => {
        logger.info(
            { port: env.PORT, env: env.NODE_ENV },
            'Server running. Health: /health, Readiness: /health/ready',
        );
    });

    const shutdown = async (signal: string, exitCode: number): Promise<void> => {
        logger.info({ signal }, 'Graceful shutdown started');
        server.close(async () => {
            logger.info('HTTP server closed');
            try {
                await closeDB();
                logger.info('MongoDB connection closed');
            } catch (err) {
                logger.error({ err }, 'Error closing MongoDB');
            }
            process.exit(exitCode);
        });

        setTimeout(() => {
            logger.warn('Shutdown deadline exceeded, forcing exit');
            process.exit(exitCode === 0 ? 1 : exitCode);
        }, SHUTDOWN_DEADLINE_MS);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM', 0));
    process.on('SIGINT', () => shutdown('SIGINT', 0));

    process.on('unhandledRejection', (reason: unknown) => {
        logger.error({ reason }, 'Unhandled Rejection');
        server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (error: Error) => {
        logger.error({ err: error }, 'Uncaught Exception');
        process.exit(1);
    });
};

startServer();
