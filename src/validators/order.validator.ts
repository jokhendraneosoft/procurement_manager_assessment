import Joi from 'joi';
import { OrderStatus } from '../types/order.types';

export const createOrderSchema = Joi.object({
    client: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    inspectionManager: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null),
    checklist: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).allow(null),
    notes: Joi.string().trim().allow('', null),
});

export const updateOrderStatusSchema = Joi.object({
    status: Joi.string()
        .valid(...Object.values(OrderStatus))
        .required(),
});

export const linkChecklistSchema = Joi.object({
    checklistId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
});
