import { Types } from 'mongoose';
import { Checklist, IChecklist } from './checklist.model';

/**
 * Checklist repository – all data access for Checklist entity.
 */
export const checklistRepository = {
    create(data: Partial<IChecklist>) {
        return Checklist.create(data);
    },

    findById(id: string) {
        return Checklist.findById(id);
    },

    findByIdLean(id: string) {
        return Checklist.findById(id).lean();
    },

    count(query: Record<string, unknown>) {
        return Checklist.countDocuments(query);
    },

    find(query: Record<string, unknown>, skip = 0, limit = 20) {
        return Checklist.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    },
};
