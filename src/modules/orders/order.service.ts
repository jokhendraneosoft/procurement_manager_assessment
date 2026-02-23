import { IOrder } from './order.model';
import { orderRepository } from './order.repository';
import { answerRepository } from '../answers/answer.repository';
import { UserRole } from '../../types/user.types';
import { ApiError } from '../../utils/ApiError';
import { OrderStatus } from '../../types/order.types';
import mongoose, { Types } from 'mongoose';

export const createOrderService = async (
    input: Partial<IOrder>,
    procurementManagerId: string
): Promise<IOrder> => {
    return orderRepository.create({
        ...input,
        procurementManager: new Types.ObjectId(procurementManagerId),
    });
};

export const getOrderByIdService = async (
    orderId: string,
    userId: string,
    role: string
): Promise<IOrder> => {
    if (!mongoose.isValidObjectId(orderId)) throw ApiError.badRequest('Invalid Order ID');

    const order = await orderRepository.findById(orderId);
    if (!order) throw ApiError.notFound('Order');

    if (role === UserRole.CLIENT) {
        if ((order.client as any)._id.toString() !== userId) {
            throw ApiError.forbidden('You can only view your own orders');
        }
    } else if (role === UserRole.INSPECTION_MANAGER) {
        if ((order.inspectionManager as any)?._id.toString() !== userId) {
            throw ApiError.forbidden('You can only view orders assigned to you');
        }
    } else if (role === UserRole.PROCUREMENT_MANAGER) {
        if ((order.procurementManager as any)._id.toString() !== userId) {
            throw ApiError.forbidden('You can only view orders you manage');
        }
    }

    return order;
};

export const getAllOrdersService = async (
    userId: string,
    role: string,
    page: number,
    limit: number
): Promise<{ items: IOrder[]; total: number }> => {
    const query: Record<string, unknown> = {};
    if (role === UserRole.CLIENT) {
        query.client = new Types.ObjectId(userId);
    } else if (role === UserRole.INSPECTION_MANAGER) {
        query.inspectionManager = new Types.ObjectId(userId);
    } else if (role === UserRole.PROCUREMENT_MANAGER) {
        query.procurementManager = new Types.ObjectId(userId);
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
        orderRepository.find(query, skip, limit),
        orderRepository.count(query),
    ]);
    return { items, total };
};

export const updateOrderStatusService = async (
    orderId: string,
    status: OrderStatus,
    userId: string,
    role: string
): Promise<IOrder> => {
    const order = await orderRepository.findById(orderId, { populate: false });
    if (!order) throw ApiError.notFound('Order');

    if (role === UserRole.CLIENT) {
        throw ApiError.forbidden('Clients cannot update order status');
    }
    if (role === UserRole.INSPECTION_MANAGER) {
        if (order.inspectionManager?.toString() !== userId) {
            throw ApiError.forbidden('Not assigned to this order');
        }
    }
    if (role === UserRole.PROCUREMENT_MANAGER) {
        if (order.procurementManager.toString() !== userId) {
            throw ApiError.forbidden('Not managing this order');
        }
    }

    order.status = status;
    await orderRepository.save(order);
    return order;
};

export const linkChecklistService = async (
    orderId: string,
    checklistId: string,
    pmId: string
): Promise<IOrder> => {
    const order = await orderRepository.findById(orderId, { populate: false });
    if (!order) throw ApiError.notFound('Order');

    if (order.procurementManager.toString() !== pmId) {
        throw ApiError.forbidden('You do not manage this order');
    }

    order.checklist = new mongoose.Types.ObjectId(checklistId) as any;
    await orderRepository.save(order);

    await answerRepository.deleteDraftByOrderId(orderId);

    return order;
};
