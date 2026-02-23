import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { UserRole } from '../../types/user.types';
import { OrderStatus } from '../../types/order.types';
import { parsePaginationParams, paginationMeta } from '../../types/pagination.types';
import {
    createOrderService,
    getOrderByIdService,
    getAllOrdersService,
    updateOrderStatusService,
    linkChecklistService
} from './order.service';

export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const order = await createOrderService(req.body, req.user!._id);
    res.status(201).json(new ApiResponse(201, 'Order created successfully', order));
});

export const getOrderById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const order = await getOrderByIdService(req.params.id as string, req.user!._id, req.user!.role);
    res.status(200).json(new ApiResponse(200, 'Order retrieved successfully', order));
});

export const getAllOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { items, total } = await getAllOrdersService(req.user!._id, req.user!.role, page, limit);
    const pagination = paginationMeta(page, limit, total);
    res.status(200).json(
        new ApiResponse(200, 'Orders retrieved successfully', { items, pagination }),
    );
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    const order = await updateOrderStatusService(
        req.params.id as string,
        status as OrderStatus,
        req.user!._id,
        req.user!.role
    );
    res.status(200).json(new ApiResponse(200, 'Order status updated successfully', order));
});

export const linkChecklist = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { checklistId } = req.body;
    const order = await linkChecklistService(req.params.id as string, checklistId, req.user!._id);
    res.status(200).json(new ApiResponse(200, 'Checklist linked to order successfully', order));
});
