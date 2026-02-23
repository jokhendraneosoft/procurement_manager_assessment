import mongoose from 'mongoose';
import { UserRole } from '@/types/user.types';
import {
    createUserService,
    getAllUsersService,
    getUserByIdService,
    updateUserStatusService,
} from '@/modules/users/user.service';

jest.mock('@/modules/users/user.repository', () => ({
    userRepository: {
        findByMobile: jest.fn(),
        findByEmailOrMobile: jest.fn(),
        create: jest.fn(),
        findAllWithPopulate: jest.fn(),
        countAll: jest.fn(),
        findById: jest.fn(),
        findByIdAndUpdate: jest.fn(),
    },
}));

const { userRepository } = require('@/modules/users/user.repository');

const validAdminId = new mongoose.Types.ObjectId().toString();
const validPmId = new mongoose.Types.ObjectId().toString();
const validImId = new mongoose.Types.ObjectId().toString();
const validUserId = new mongoose.Types.ObjectId().toString();

describe('user.service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createUserService', () => {
        it('should create user when Admin creates any role', async () => {
            (userRepository.findByEmailOrMobile as jest.Mock).mockResolvedValue(null);
            (userRepository.create as jest.Mock).mockResolvedValue({
                _id: 'new-id',
                name: 'Client User',
                role: UserRole.CLIENT,
            });

            const result = await createUserService({
                name: 'Client User',
                email: 'client@example.com',
                password: 'pass123',
                role: UserRole.CLIENT,
                createdById: validAdminId,
                createdByRole: UserRole.ADMIN,
            });

            expect(userRepository.create).toHaveBeenCalled();
            expect(result.role).toBe(UserRole.CLIENT);
        });

        it('should allow PM to create IM or client only', async () => {
            (userRepository.findByEmailOrMobile as jest.Mock).mockResolvedValue(null);
            (userRepository.create as jest.Mock).mockResolvedValue({ _id: 'im-1', role: UserRole.INSPECTION_MANAGER });

            await createUserService({
                name: 'IM User',
                mobile: '+1234567890',
                password: 'pass123',
                role: UserRole.INSPECTION_MANAGER,
                createdById: validPmId,
                createdByRole: UserRole.PROCUREMENT_MANAGER,
            });

            expect(userRepository.create).toHaveBeenCalled();
        });

        it('should throw forbidden when PM tries to create Admin', async () => {
            await expect(
                createUserService({
                    name: 'Admin',
                    email: 'admin@example.com',
                    password: 'pass123',
                    role: UserRole.ADMIN,
                    createdById: validPmId,
                    createdByRole: UserRole.PROCUREMENT_MANAGER,
                }),
            ).rejects.toMatchObject({
                statusCode: 403,
                message: 'Procurement managers can only create inspection managers or clients',
            });
            expect(userRepository.create).not.toHaveBeenCalled();
        });

        it('should throw forbidden when IM or Client tries to create user', async () => {
            await expect(
                createUserService({
                    name: 'Someone',
                    email: 'a@b.com',
                    password: 'pass123',
                    role: UserRole.CLIENT,
                    createdById: validImId,
                    createdByRole: UserRole.INSPECTION_MANAGER,
                }),
            ).rejects.toMatchObject({
                statusCode: 403,
                message: 'You do not have permission to create users',
            });
        });

        it('should throw conflict when email already exists', async () => {
            (userRepository.findByEmailOrMobile as jest.Mock).mockResolvedValue({ _id: 'existing' });

            await expect(
                createUserService({
                    name: 'Duplicate',
                    email: 'existing@example.com',
                    password: 'pass123',
                    role: UserRole.CLIENT,
                    createdById: validAdminId,
                    createdByRole: UserRole.ADMIN,
                }),
            ).rejects.toMatchObject({
                statusCode: 409,
                message: 'User with this email or mobile already exists.',
            });
        });
    });

    describe('getAllUsersService', () => {
        it('should return items and total from repository', async () => {
            const mockItems = [{ _id: '1', name: 'User 1' }];
            (userRepository.findAllWithPopulate as jest.Mock).mockResolvedValue(mockItems);
            (userRepository.countAll as jest.Mock).mockResolvedValue(1);

            const result = await getAllUsersService(1, 10);
            expect(result.items).toEqual(mockItems);
            expect(result.total).toBe(1);
            expect(userRepository.findAllWithPopulate).toHaveBeenCalledWith(0, 10);
        });
    });

    describe('getUserByIdService', () => {
        it('should throw badRequest for invalid ObjectId', async () => {
            await expect(
                getUserByIdService('invalid', 'req-id', UserRole.ADMIN),
            ).rejects.toMatchObject({ statusCode: 400, message: 'Invalid user ID format' });
        });

        it('should throw notFound when user does not exist', async () => {
            (userRepository.findById as jest.Mock).mockResolvedValue(null);
            await expect(
                getUserByIdService(new mongoose.Types.ObjectId().toString(), 'req-id', UserRole.ADMIN),
            ).rejects.toMatchObject({ statusCode: 404, message: 'User not found' });
        });

        it('should return user when Admin requests', async () => {
            const mockUser = { _id: validUserId, name: 'User', role: UserRole.CLIENT };
            (userRepository.findById as jest.Mock).mockResolvedValue(mockUser);

            const result = await getUserByIdService(validUserId, validAdminId, UserRole.ADMIN);
            expect(result).toEqual(mockUser);
        });
    });

    describe('updateUserStatusService', () => {
        it('should throw badRequest for invalid id', async () => {
            await expect(updateUserStatusService('bad', true)).rejects.toMatchObject({
                statusCode: 400,
                message: 'Invalid user ID',
            });
        });

        it('should return updated user', async () => {
            const updated = { _id: 'u1', isActive: false };
            (userRepository.findByIdAndUpdate as jest.Mock).mockResolvedValue(updated);

            const result = await updateUserStatusService(
                new mongoose.Types.ObjectId().toString(),
                false,
            );
            expect(result).toEqual(updated);
        });
    });
});
