import { UserRole } from '@/types/user.types';
import { loginService } from '@/modules/auth/auth.service';

jest.mock('@/modules/users/user.repository', () => ({
    userRepository: {
        findByEmailActive: jest.fn(),
        findByMobileActive: jest.fn(),
    },
}));

jest.mock('@/config/env', () => ({
    env: {
        JWT_SECRET: 'test-secret-at-least-32-characters-long',
        JWT_EXPIRES_IN: '7d',
    },
}));

const { userRepository } = require('@/modules/users/user.repository');

describe('auth.service - loginService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('email login', () => {
        it('should return token and user when credentials are valid', async () => {
            const mockUser = {
                _id: { toString: () => 'user-id-1' },
                name: 'John',
                role: UserRole.ADMIN,
                email: 'john@example.com',
                mobile: undefined,
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            (userRepository.findByEmailActive as jest.Mock).mockResolvedValue(mockUser);

            const result = await loginService({
                email: 'john@example.com',
                password: 'password123',
            });

            expect(result.token).toBeDefined();
            expect(typeof result.token).toBe('string');
            expect(result.user).toEqual({
                _id: 'user-id-1',
                name: 'John',
                role: UserRole.ADMIN,
                email: 'john@example.com',
                mobile: undefined,
            });
            expect(userRepository.findByEmailActive).toHaveBeenCalledWith('john@example.com');
        });

        it('should throw unauthorized when user not found by email', async () => {
            (userRepository.findByEmailActive as jest.Mock).mockResolvedValue(null);

            await expect(
                loginService({ email: 'missing@example.com', password: 'pass123' }),
            ).rejects.toMatchObject({
                statusCode: 401,
                message: 'Invalid email or password',
            });
        });

        it('should throw badRequest when IM tries to login with email', async () => {
            const mockIM = {
                _id: { toString: () => 'im-1' },
                name: 'IM User',
                role: UserRole.INSPECTION_MANAGER,
                comparePassword: jest.fn(),
            };
            (userRepository.findByEmailActive as jest.Mock).mockResolvedValue(mockIM);

            await expect(
                loginService({ email: 'im@example.com', password: 'pass123' }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: 'Inspection managers must log in with mobile number',
            });
        });

        it('should throw unauthorized when password does not match', async () => {
            const mockUser = {
                _id: { toString: () => 'u1' },
                name: 'John',
                role: UserRole.ADMIN,
                email: 'j@e.com',
                mobile: undefined,
                comparePassword: jest.fn().mockResolvedValue(false),
            };
            (userRepository.findByEmailActive as jest.Mock).mockResolvedValue(mockUser);

            await expect(
                loginService({ email: 'j@e.com', password: 'wrong' }),
            ).rejects.toMatchObject({
                statusCode: 401,
                message: 'Invalid credentials',
            });
        });
    });

    describe('mobile login', () => {
        it('should return token and user when IM logs in with mobile', async () => {
            const mockIM = {
                _id: { toString: () => 'im-1' },
                name: 'Inspector',
                role: UserRole.INSPECTION_MANAGER,
                email: undefined,
                mobile: '+1234567890',
                comparePassword: jest.fn().mockResolvedValue(true),
            };
            (userRepository.findByMobileActive as jest.Mock).mockResolvedValue(mockIM);

            const result = await loginService({
                mobile: '+1234567890',
                password: 'pass123',
            });

            expect(result.token).toBeDefined();
            expect(result.user.role).toBe(UserRole.INSPECTION_MANAGER);
            expect(userRepository.findByMobileActive).toHaveBeenCalledWith('+1234567890');
        });

        it('should throw unauthorized when mobile user not found', async () => {
            (userRepository.findByMobileActive as jest.Mock).mockResolvedValue(null);

            await expect(
                loginService({ mobile: '+9999999999', password: 'pass123' }),
            ).rejects.toMatchObject({
                statusCode: 401,
                message: 'Invalid mobile number or password',
            });
        });

        it('should throw badRequest when non-IM tries to login with mobile', async () => {
            const mockAdmin = {
                _id: { toString: () => 'a1' },
                name: 'Admin',
                role: UserRole.ADMIN,
                comparePassword: jest.fn(),
            };
            (userRepository.findByMobileActive as jest.Mock).mockResolvedValue(mockAdmin);

            await expect(
                loginService({ mobile: '+1234567890', password: 'pass123' }),
            ).rejects.toMatchObject({
                statusCode: 400,
                message: 'Only inspection managers can log in with mobile number',
            });
        });
    });

    describe('no email or mobile', () => {
        it('should throw unauthorized when neither email nor mobile provided', async () => {
            await expect(
                loginService({ password: 'pass123' } as any),
            ).rejects.toMatchObject({
                statusCode: 401,
                message: 'Invalid credentials',
            });
        });
    });
});
