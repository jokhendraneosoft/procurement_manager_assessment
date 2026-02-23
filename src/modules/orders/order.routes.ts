import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createOrderSchema, updateOrderStatusSchema, linkChecklistSchema } from '../../validators/order.validator';
import { UserRole } from '../../types/user.types';
import {
    createOrder,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    linkChecklist
} from './order.controller';

const router = Router();

router.use(authenticate);

// PM creates order
router.post(
    '/',
    authorize(UserRole.PROCUREMENT_MANAGER, UserRole.ADMIN),
    validate(createOrderSchema),
    createOrder
);

// Get all orders (logic scopes inside service)
router.get('/', getAllOrders);

// Get single order
router.get('/:id', getOrderById);

// Update status (PM, IM, Admin)
router.patch(
    '/:id/status',
    authorize(UserRole.PROCUREMENT_MANAGER, UserRole.INSPECTION_MANAGER, UserRole.ADMIN),
    validate(updateOrderStatusSchema),
    updateOrderStatus
);

// Link checklist (PM only)
router.patch(
    '/:id/checklist',
    authorize(UserRole.PROCUREMENT_MANAGER, UserRole.ADMIN),
    validate(linkChecklistSchema),
    linkChecklist
);

export default router;
