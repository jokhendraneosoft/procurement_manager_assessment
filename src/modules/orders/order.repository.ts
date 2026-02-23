import { Types } from 'mongoose';
import { Order, IOrder } from './order.model';

/**
 * Order repository – all data access for Order entity.
 */
export const orderRepository = {
    create(data: Partial<IOrder>) {
        return Order.create(data);
    },

    findById(orderId: string, options?: { populate?: boolean }) {
        const q = Order.findById(orderId);
        if (options?.populate !== false) {
            q.populate('client', 'name email mobile')
                .populate('procurementManager', 'name email')
                .populate('inspectionManager', 'name mobile')
                .populate('checklist', 'title version');
        }
        return q;
    },

    count(query: Record<string, unknown>) {
        return Order.countDocuments(query);
    },

    find(query: Record<string, unknown>, skip = 0, limit = 20) {
        return Order.find(query)
            .sort({ createdAt: -1 })
            .populate('client', 'name')
            .populate('inspectionManager', 'name')
            .populate('checklist', 'title')
            .skip(skip)
            .limit(limit)
            .exec();
    },

    save(doc: IOrder) {
        return doc.save();
    },
};
