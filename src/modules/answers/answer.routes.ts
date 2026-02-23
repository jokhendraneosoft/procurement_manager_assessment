import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { startAnswerSchema, submitAnswerSchema } from '../../validators/answer.validator';
import { UserRole } from '../../types/user.types';
import {
    startAnswer,
    updateAnswer,
    submitAnswer,
    getAnswerByOrderId
} from './answer.controller';

const router = Router();

router.use(authenticate);

// Start or Get Draft (IM only)
router.post(
    '/',
    authorize(UserRole.INSPECTION_MANAGER),
    validate(startAnswerSchema),
    startAnswer
);

// Update responses (IM only)
// PATCH body: { responses: [...] }
router.patch(
    '/:id',
    authorize(UserRole.INSPECTION_MANAGER),
    validate(submitAnswerSchema), // We reuse schema for structure validation
    updateAnswer
);

// Submit (finalize) (IM only)
router.patch(
    '/:id/submit',
    authorize(UserRole.INSPECTION_MANAGER),
    submitAnswer
);

// Get by Order ID (All roles involved)
router.get(
    '/:orderId',
    authorize(
        UserRole.ADMIN,
        UserRole.PROCUREMENT_MANAGER,
        UserRole.INSPECTION_MANAGER,
        UserRole.CLIENT
    ),
    getAnswerByOrderId
);

export default router;
