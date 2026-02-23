import request from 'supertest';

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

jest.mock('@/modules/users/user.repository', () => ({
    userRepository: {
        findByEmailActive: jest.fn(),
        findByMobileActive: jest.fn(),
    },
}));

import app from '../../src/app';

const { userRepository } = require('@/modules/users/user.repository');
const { UserRole } = require('@/types/user.types');

describe('Auth API (integration)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/v1/auth/login', () => {
        it('should return 400 when body is empty', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({})
                .set('Content-Type', 'application/json');
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toMatch(/validation|required|either/i);
        });

        it('should return 400 when both email and mobile are sent', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'a@b.com',
                    mobile: '+1234567890',
                    password: 'pass123',
                });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 400 when password is too short', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'user@example.com',
                    password: 'short',
                });
            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
        });

        it('should return 200 and token when credentials are valid', async () => {
            const mockUser = {
                _id: { toString: () => 'user-1' },
                name: 'Test User',
                role: UserRole.ADMIN,
                email: 'test@example.com',
                mobile: undefined,
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            (userRepository.findByEmailActive as jest.Mock).mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'password123',
                });
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login successful');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data.user.name).toBe('Test User');
        });

        it('should return 401 when user not found', async () => {
            (userRepository.findByEmailActive as jest.Mock).mockResolvedValue(null);
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nobody@example.com',
                    password: 'password123',
                });
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });
});
