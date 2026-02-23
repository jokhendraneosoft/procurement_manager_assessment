import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';
import { validate } from '../../middleware/validate.middleware';
import { UserRole } from '../../types/user.types';
import { createUserSchema, assignPmSchema, updateStatusSchema } from '../../validators/user.validator';
import {
    createUser,
    getAllUsers,
    getMyTeam,
    getMyClients,
    getUserById,
    assignPm,
    updateUserStatus,
} from './user.controller';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route  POST /api/v1/users
 * @desc   Create a user (Admin: any role; PM: IM or client only)
 * @access Admin | PM
 */
router.post(
    '/',
    authorize(UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER),
    validate(createUserSchema),
    createUser,
);

/**
 * @route  GET /api/v1/users
 * @desc   List all users
 * @access Admin
 */
router.get('/', authorize(UserRole.ADMIN), getAllUsers);

/**
 * @route  GET /api/v1/users/my-team
 * @desc   List IMs assigned to the calling Procurement Manager
 * @access PM
 */
router.get('/my-team', authorize(UserRole.PROCUREMENT_MANAGER), getMyTeam);

/**
 * @route  GET /api/v1/users/my-clients
 * @desc   List clients created by the calling Procurement Manager
 * @access PM
 */
router.get('/my-clients', authorize(UserRole.PROCUREMENT_MANAGER), getMyClients);

/**
 * @route  GET /api/v1/users/:id
 * @desc   Get a single user by ID
 * @access Admin | PM
 */
router.get('/:id', authorize(UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER), getUserById);

/**
 * @route  PATCH /api/v1/users/:id/assign-pm
 * @desc   Assign or unassign an IM to a Procurement Manager
 * @access Admin only
 */
router.patch(
    '/:id/assign-pm',
    authorize(UserRole.ADMIN),
    validate(assignPmSchema),
    assignPm,
);

/**
 * @route  PATCH /api/v1/users/:id/status
 * @desc   Activate or deactivate a user
 * @access Admin only
 */
router.patch(
    '/:id/status',
    authorize(UserRole.ADMIN),
    validate(updateStatusSchema),
    updateUserStatus,
);

export default router;
