import { Types } from 'mongoose';
import { User, IUser } from './user.model';
import { UserRole } from '../../types/user.types';

/**
 * User repository – all data access for User entity.
 * Keeps services free of Mongoose/query details.
 */
export const userRepository = {
    findByMobile(mobile: string) {
        return User.findOne({ mobile }).select('+password');
    },

    findByEmailActive(email: string) {
        return User.findOne({ email, isActive: true }).select('+password');
    },

    findByMobileActive(mobile: string) {
        return User.findOne({ mobile, isActive: true }).select('+password');
    },

    findByEmailOrMobile(conditions: Array<{ email?: string } | { mobile?: string }>) {
        if (conditions.length === 0) return null;
        return User.findOne({ $or: conditions });
    },

    create(data: Partial<IUser>) {
        return User.create(data);
    },

    countAll() {
        return User.countDocuments();
    },

    findAllWithPopulate(skip = 0, limit = 20) {
        return User.find()
            .populate('createdBy', 'name role')
            .populate('assignedProcurementManager', 'name')
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
    },

    findById(id: string, options?: { populate?: boolean }) {
        const q = User.findById(id);
        if (options?.populate !== false) {
            q.populate('createdBy', 'name role');
        }
        return q.select('-password');
    },

    findMyTeam(pmId: string) {
        return User.find({
            $or: [
                { assignedProcurementManager: new Types.ObjectId(pmId) },
                { createdBy: pmId, role: UserRole.INSPECTION_MANAGER },
            ],
        }).select('-password');
    },

    findMyClients() {
        return User.find({
            role: UserRole.CLIENT,
            isActive: true,
        })
            .select('-password')
            .sort({ name: 1 });
    },

    findByIdForAssign(id: string) {
        return User.findById(id).select('-password');
    },

    findByIdAndUpdate(id: string, update: Partial<IUser>) {
        return User.findByIdAndUpdate(id, update, { new: true, runValidators: true })
            .select('-password');
    },

    save(doc: IUser) {
        return doc.save();
    },
};
