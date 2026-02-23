import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { createChecklistSchema, updateChecklistSchema } from '../../validators/checklist.validator';
import { UserRole } from '../../types/user.types';
import {
    createChecklist,
    updateChecklist,
    getAllChecklists,
    getChecklistById
} from './checklist.controller';

const router = Router();

router.use(authenticate);

// PM creates checklists
router.post('/', authorize(UserRole.PROCUREMENT_MANAGER, UserRole.ADMIN), validate(createChecklistSchema), createChecklist);

// PM updates checklists (creates new version)
router.put('/:id', authorize(UserRole.PROCUREMENT_MANAGER, UserRole.ADMIN), validate(updateChecklistSchema), updateChecklist);

// Everyone can view lists (scoped in service)
router.get('/', getAllChecklists);
router.get('/:id', getChecklistById);

export default router;
