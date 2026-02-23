import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { IUser } from './user.model';
import { userRepository } from './user.repository';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/user.types';

interface CreateUserInput {
    name: string;
    email?: string;
    mobile?: string;
    password: string;
    role: UserRole;
    createdById: string;
    createdByRole: UserRole;
}

export const createUserService = async (input: CreateUserInput): Promise<IUser> => {
    const { name, email, mobile, password, role, createdById, createdByRole } = input;

    if (createdByRole === UserRole.PROCUREMENT_MANAGER) {
        const allowedToCreate = [UserRole.INSPECTION_MANAGER, UserRole.CLIENT];
        if (!allowedToCreate.includes(role)) {
            throw ApiError.forbidden('Procurement managers can only create inspection managers or clients');
        }
        if (role === UserRole.INSPECTION_MANAGER && mobile) {
            const existingIM = await userRepository.findByMobile(mobile);
            if (existingIM) {
                throw ApiError.conflict(
                    'Inspection manager with this mobile already exists. Contact admin to assign.',
                );
            }
        }
    }

    if (createdByRole === UserRole.INSPECTION_MANAGER || createdByRole === UserRole.CLIENT) {
        throw ApiError.forbidden('You do not have permission to create users');
    }

    const orConditions: Array<{ email?: string } | { mobile?: string }> = [];
    if (input.email != null && String(input.email).trim() !== '') {
        orConditions.push({ email: input.email.trim().toLowerCase() });
    }
    if (input.mobile != null && String(input.mobile).trim() !== '') {
        orConditions.push({ mobile: input.mobile.trim() });
    }
    if (orConditions.length > 0) {
        const existingUser = await userRepository.findByEmailOrMobile(orConditions);
        if (existingUser) {
            throw ApiError.conflict('User with this email or mobile already exists.');
        }
    }

    return userRepository.create({
        name,
        email,
        mobile,
        password,
        role,
        createdBy: new Types.ObjectId(createdById),
    });
};

export const getAllUsersService = async (page: number, limit: number): Promise<{ items: IUser[]; total: number }> => {
    const [items, total] = await Promise.all([
        userRepository.findAllWithPopulate((page - 1) * limit, limit),
        userRepository.countAll(),
    ]);
    return { items, total };
};

export const getUserByIdService = async (
    id: string,
    requesterId: string,
    requesterRole: UserRole,
): Promise<IUser> => {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid user ID format');

    const user = await userRepository.findById(id);
    if (!user) throw ApiError.notFound('User');

    if (requesterRole === UserRole.PROCUREMENT_MANAGER) {
        if (
            user.role === UserRole.INSPECTION_MANAGER &&
            user.assignedProcurementManager?.toString() !== requesterId &&
            user.createdBy?.toString() !== requesterId
        ) {
            throw ApiError.forbidden('You can only view users in your team');
        }
    }

    return user;
};

export const getMyTeamService = async (pmId: string): Promise<IUser[]> => {
    return userRepository.findMyTeam(pmId);
};

export const getMyClientsService = async (_pmId: string): Promise<IUser[]> => {
    return userRepository.findMyClients();
};

export const assignPmService = async (
    imId: string,
    procurementManagerId: string | null,
): Promise<IUser> => {
    if (!mongoose.isValidObjectId(imId)) throw ApiError.badRequest('Invalid IM ID');

    const im = await userRepository.findByIdForAssign(imId);
    if (!im) throw ApiError.notFound('Inspection Manager');
    if (im.role !== UserRole.INSPECTION_MANAGER) {
        throw ApiError.badRequest('Target user must be an inspection manager');
    }

    if (procurementManagerId) {
        if (!mongoose.isValidObjectId(procurementManagerId)) {
            throw ApiError.badRequest('Invalid Procurement Manager ID');
        }
        const pm = await userRepository.findByIdForAssign(procurementManagerId);
        if (!pm) throw ApiError.notFound('Procurement Manager');
        if (pm.role !== UserRole.PROCUREMENT_MANAGER) {
            throw ApiError.badRequest('Target must be a procurement manager');
        }
    }

    im.assignedProcurementManager = procurementManagerId
        ? new Types.ObjectId(procurementManagerId)
        : undefined;
    await userRepository.save(im);
    return im;
};

export const updateUserStatusService = async (
    id: string,
    isActive: boolean,
): Promise<IUser> => {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid user ID');
    const user = await userRepository.findByIdAndUpdate(id, { isActive });
    if (!user) throw ApiError.notFound('User');
    return user;
};
