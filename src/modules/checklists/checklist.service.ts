import mongoose from 'mongoose';
import { Types } from 'mongoose';
import { IChecklist } from './checklist.model';
import { checklistRepository } from './checklist.repository';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/user.types';

export const createChecklistService = async (
    input: Partial<IChecklist>,
    createdById: string
): Promise<IChecklist> => {
    return checklistRepository.create({
        ...input,
        createdBy: new Types.ObjectId(createdById),
        version: 1,
    });
};

export const updateChecklistService = async (
    id: string,
    input: Partial<IChecklist>,
    userId: string
): Promise<IChecklist> => {
    const oldChecklist = await checklistRepository.findById(id);
    if (!oldChecklist) throw ApiError.notFound('Checklist');

    const newVersion = oldChecklist.version + 1;

    return checklistRepository.create({
        ...input,
        createdBy: new Types.ObjectId(userId),
        client: input.client || oldChecklist.client,
        version: newVersion,
        parentChecklist: oldChecklist._id,
        sections: input.sections || oldChecklist.sections,
        title: input.title || oldChecklist.title,
        description: input.description || oldChecklist.description,
    });
};

export const getAllChecklistsService = async (
    role: string,
    userId: string,
    clientId: string | undefined,
    page: number,
    limit: number
): Promise<{ items: IChecklist[]; total: number }> => {
    const query: Record<string, unknown> = { isActive: true };

    if (clientId && (role === UserRole.PROCUREMENT_MANAGER || role === UserRole.ADMIN)) {
        if (!mongoose.isValidObjectId(clientId)) throw ApiError.badRequest('Invalid client ID');
        query.client = new Types.ObjectId(clientId);
    }

    if (role === UserRole.CLIENT) {
        query.$or = [{ client: new Types.ObjectId(userId) }, { client: null }];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        checklistRepository.find(query, skip, limit),
        checklistRepository.count(query),
    ]);
    return { items, total };
};

export const getChecklistByIdService = async (id: string): Promise<IChecklist> => {
    const checklist = await checklistRepository.findById(id);
    if (!checklist) throw ApiError.notFound('Checklist');
    return checklist;
};
