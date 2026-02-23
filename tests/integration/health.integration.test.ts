import request from 'supertest';

jest.mock('@/config/env', () => ({
    env: {
        NODE_ENV: 'test',
        isDev: true,
        UPLOAD_DIR: 'uploads',
    },
}));

jest.mock('@/config/db', () => ({
    pingDB: jest.fn(),
}));

import app from '@/app';

const { pingDB } = require('@/config/db') as { pingDB: jest.Mock };

describe('Health API (integration)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /health', () => {
        it('should return 200 with success and environment', async () => {
            const res = await request(app).get('/health');
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                statusCode: 200,
                message: 'Procurement API is running',
            });
            expect(res.body.data).toHaveProperty('environment');
            expect(res.body.data).toHaveProperty('timestamp');
        });
    });

    describe('GET /health/ready', () => {
        it('should return 200 when DB is connected', async () => {
            pingDB.mockResolvedValue(true);
            const res = await request(app).get('/health/ready');
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                success: true,
                statusCode: 200,
                message: 'Ready',
            });
            expect(res.body.data.mongodb).toBe('connected');
        });

        it('should return 503 when DB is disconnected', async () => {
            pingDB.mockResolvedValue(false);
            const res = await request(app).get('/health/ready');
            expect(res.status).toBe(503);
            expect(res.body).toMatchObject({
                success: false,
                statusCode: 503,
                message: 'Service Unavailable',
            });
            expect(res.body.data.mongodb).toBe('disconnected');
        });
    });
});
