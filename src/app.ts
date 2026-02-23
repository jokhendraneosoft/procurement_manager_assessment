import express, { Application } from 'express';
import path from 'path';
import cors from 'cors';
// import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import pinoHttp from 'pino-http';

import { errorMiddleware, notFoundMiddleware } from './middleware/error.middleware';
import { requestIdMiddleware } from './middleware/requestId.middleware';
import { globalRateLimiter } from './middleware/rateLimit.middleware';
import { getSwaggerSpec } from './config/swagger.generator';
import { logger } from './utils/logger';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import orderRoutes from './modules/orders/order.routes';
import checklistRoutes from './modules/checklists/checklist.routes';
import answerRoutes from './modules/answers/answer.routes';
import uploadRoutes from './modules/uploads/upload.routes';
import { env } from './config/env';
import { getSafeUploadDir } from './validators/upload.validator';

const app: Application = express();

// ── Security headers ─────────────────────────────────────────────────────────
// app.use(helmet());

// ── CORS (for frontend) ───────────────────────────────────────────────────────
app.use(cors({ origin: env.isDev ? true : process.env.FRONTEND_URL, credentials: true }));

// ── Request ID (for tracing) ──────────────────────────────────────────────────
app.use(requestIdMiddleware);

// ── Structured logging (JSON with requestId, duration) ────────────────────────
app.use(
    pinoHttp({
        logger,
        genReqId: (req) => (req as express.Request).requestId ?? '',
        customSuccessMessage: (req, res) =>
            `${req.method} ${req.url} ${res.statusCode}`,
        customErrorMessage: (req, res, err) =>
            `${req.method} ${req.url} ${res.statusCode} - ${err?.message ?? 'error'}`,
        customAttributeKeys: { reqId: 'requestId' },
    }),
);

// ── Rate limiting (100 req/15min per IP) ───────────────────────────────────────
app.use(globalRateLimiter);

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static files for uploads (safe path under cwd, matches upload service) ───────
app.use('/uploads', express.static(getSafeUploadDir(env.UPLOAD_DIR)));

// ── Health check (liveness: process is up) ──────────────────────────────────────
app.get('/health', (_req, res) => {
    return res.json({
        success: true,
        statusCode: 200,
        message: 'Procurement API is running',
        data: {
            environment: env.NODE_ENV,
            timestamp: new Date().toISOString(),
        },
    });
});

// ── Readiness (DB + dependencies; for K8s/load balancers) ──────────────────────
app.get('/health/ready', async (_req, res) => {
    const { pingDB } = await import('./config/db');
    const ok = await pingDB();
    if (ok) {
        return res.status(200).json({
            success: true,
            statusCode: 200,
            message: 'Ready',
            data: { mongodb: 'connected', timestamp: new Date().toISOString() },
        });
    } else {
        return res.status(503).json({
            success: false,
            statusCode: 503,
            message: 'Service Unavailable',
            data: { mongodb: 'disconnected', timestamp: new Date().toISOString() },
        });
    }
});

// ── Swagger API docs (generated from api.registry + Joi validators) ─────────────
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(getSwaggerSpec() as Parameters<typeof swaggerUi.setup>[0], {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Procurement API Docs',
    }),
);
app.get('/api-docs.json', (_req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(getSwaggerSpec());
});

// ── API Routes (versioned) ─────────────────────────────────────────────────────
const API_V1 = '/api/v1';
app.use(`${API_V1}/auth`, authRoutes);
app.use(`${API_V1}/users`, userRoutes);
app.use(`${API_V1}/orders`, orderRoutes);
app.use(`${API_V1}/checklists`, checklistRoutes);
app.use(`${API_V1}/answers`, answerRoutes);
app.use(`${API_V1}/uploads`, uploadRoutes);

// ── 404 & Global error handlers ───────────────────────────────────────────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
