import request from 'supertest';
import { UserRole } from '@/types/user.types';
import { OrderStatus } from '@/types/order.types';
import { getPMToken, TEST_IDS } from '../helpers/authHelper';

jest.mock('@/config/env', () => ({
    env: {
        NODE_ENV: 'test',
        isDev: true,
        UPLOAD_DIR: 'uploads',
        JWT_SECRET: 'test-secret-at-least-32-characters-long',
        JWT_EXPIRES_IN: '7d',
    },
}));

jest.mock('@/config/db', () => ({
    pingDB: jest.fn().mockResolvedValue(true),
}));

const mockOrderRepo = {
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
};

jest.mock('@/modules/orders/order.repository', () => ({
    orderRepository: mockOrderRepo,
}));

jest.mock('@/modules/answers/answer.repository', () => ({
    answerRepository: { deleteDraftByOrderId: jest.fn().mockResolvedValue(undefined) },
}));

import app from '@/app';

describe('Orders API (integration)', () => {
    const pmToken = getPMToken();
    const validId = '507f1f77bcf86cd799439011';

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/orders', () => {
        it('should return 401 when no token', async () => {
            const res = await request(app)
                .post('/api/v1/orders')
                .send({ client: validId });
            expect(res.status).toBe(401);
        });

        it('should return 400 when validation fails (missing client)', async () => {
            const res = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({});
            expect(res.status).toBe(400);
        });

        it('should return 201 when PM creates order', async () => {
            mockOrderRepo.create.mockResolvedValue({
                _id: 'order-1',
                client: validId,
                procurementManager: 'pm-1',
                status: OrderStatus.PENDING,
            });

            const res = await request(app)
                .post('/api/v1/orders')
                .set('Authorization', `Bearer ${pmToken}`)
                .send({
                    client: validId,
                    inspectionManager: null,
                    checklist: null,
                    notes: '',
                });
            expect(res.status).toBe(201);
            expect(mockOrderRepo.create).toHaveBeenCalled();
        });
    });

    describe('GET /api/v1/orders', () => {
        it('should return 401 when no token', async () => {
            const res = await request(app).get('/api/v1/orders');
            expect(res.status).toBe(401);
        });

        it('should return 200 and list for PM', async () => {
            mockOrderRepo.find.mockResolvedValue([{ _id: 'ord-1', status: OrderStatus.PENDING }]);
            mockOrderRepo.count.mockResolvedValue(1);

            const res = await request(app)
                .get('/api/v1/orders')
                .set('Authorization', `Bearer ${pmToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.items).toBeDefined();
            expect(res.body.data.pagination.total).toBe(1);
        });
    });

    describe('GET /api/v1/orders/:id', () => {
        it('should return 401 when no token', async () => {
            const res = await request(app).get(`/api/v1/orders/${validId}`);
            expect(res.status).toBe(401);
        });

        it('should return 200 when order exists and PM owns it', async () => {
            mockOrderRepo.findById.mockResolvedValue({
                _id: validId,
                procurementManager: { _id: { toString: () => TEST_IDS.PM } },
                client: {},
                status: OrderStatus.PENDING,
            });

            const res = await request(app)
                .get(`/api/v1/orders/${validId}`)
                .set('Authorization', `Bearer ${pmToken}`);
            expect(res.status).toBe(200);
        });

        it('should return 404 when order not found', async () => {
            mockOrderRepo.findById.mockResolvedValue(null);

            const res = await request(app)
                .get(`/api/v1/orders/${validId}`)
                .set('Authorization', `Bearer ${pmToken}`);
            expect(res.status).toBe(404);
        });
    });
});
