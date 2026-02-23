import request from 'supertest';
import { UserRole } from '@/types/user.types';
import { getAdminToken } from '../helpers/authHelper';

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

const mockUserRepo = {
    findByMobile: jest.fn(),
    findByEmailActive: jest.fn(),
    findByMobileActive: jest.fn(),
    findByEmailOrMobile: jest.fn(),
    create: jest.fn(),
    countAll: jest.fn(),
    findAllWithPopulate: jest.fn(),
    findById: jest.fn(),
    findByIdForAssign: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    save: jest.fn(),
    findMyTeam: jest.fn(),
    findMyClients: jest.fn(),
};

jest.mock('@/modules/users/user.repository', () => ({
    userRepository: mockUserRepo,
}));

import app from '@/app';

describe('Users API (integration)', () => {
    const adminToken = getAdminToken();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/users', () => {
        it('should return 401 when no token', async () => {
            const res = await request(app).get('/api/v1/users');
            expect(res.status).toBe(401);
        });

        it('should return 200 and list when Admin', async () => {
            mockUserRepo.findAllWithPopulate.mockResolvedValue([{ _id: '1', name: 'User 1' }]);
            mockUserRepo.countAll.mockResolvedValue(1);

            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.items).toHaveLength(1);
            expect(res.body.data.pagination.total).toBe(1);
        });
    });

    describe('POST /api/v1/users', () => {
        it('should return 401 when no token', async () => {
            const res = await request(app)
                .post('/api/v1/users')
                .send({
                    name: 'New User',
                    email: 'new@example.com',
                    password: 'pass123',
                    role: UserRole.CLIENT,
                });
            expect(res.status).toBe(401);
        });

        it('should return 400 when validation fails (missing name)', async () => {
            const res = await request(app)
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    email: 'new@example.com',
                    password: 'pass123',
                    role: UserRole.CLIENT,
                });
            expect(res.status).toBe(400);
        });

        it('should return 201 when Admin creates user', async () => {
            mockUserRepo.findByEmailOrMobile.mockResolvedValue(null);
            mockUserRepo.create.mockResolvedValue({
                _id: 'new-user-id',
                name: 'New Client',
                email: 'new@example.com',
                role: UserRole.CLIENT,
            });

            const res = await request(app)
                .post('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    name: 'New Client',
                    email: 'new@example.com',
                    password: 'pass123',
                    role: UserRole.CLIENT,
                });
            expect(res.status).toBe(201);
            expect(res.body.data.name).toBe('New Client');
        });
    });

    describe('GET /api/v1/users/:id', () => {
        it('should return 401 when no token', async () => {
            const res = await request(app).get('/api/v1/users/507f1f77bcf86cd799439011');
            expect(res.status).toBe(401);
        });

        it('should return 200 when user exists', async () => {
            mockUserRepo.findById.mockResolvedValue({
                _id: '507f1f77bcf86cd799439011',
                name: 'Some User',
                role: UserRole.CLIENT,
            });

            const res = await request(app)
                .get('/api/v1/users/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Some User');
        });

        it('should return 404 when user not found', async () => {
            mockUserRepo.findById.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/v1/users/507f1f77bcf86cd799439011')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(404);
        });
    });
});
