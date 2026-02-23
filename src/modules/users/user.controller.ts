import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { ApiError } from '../../utils/ApiError';
import { UserRole } from '../../types/user.types';
import { parsePaginationParams, paginationMeta } from '../../types/pagination.types';
import {
    createUserService,
    getAllUsersService,
    getUserByIdService,
    getMyTeamService,
    getMyClientsService,
    assignPmService,
    updateUserStatusService,
} from './user.service';

export const createUser = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const user = await createUserService({
            ...req.body,
            createdById: req.user!._id,
            createdByRole: req.user!.role as UserRole,
        });
        res.status(201).json(new ApiResponse(201, 'User created successfully', user));
    },
);

export const getAllUsers = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { page, limit } = parsePaginationParams(req.query as { page?: string; limit?: string });
        const { items, total } = await getAllUsersService(page, limit);
        const pagination = paginationMeta(page, limit, total);
        res.status(200).json(
            new ApiResponse(200, 'Users retrieved successfully', { items, pagination }),
        );
    },
);

export const getMyTeam = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const team = await getMyTeamService(req.user!._id);
        res.status(200).json(new ApiResponse(200, 'Team retrieved successfully', team));
    },
);

export const getMyClients = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const clients = await getMyClientsService(req.user!._id);
        res.status(200).json(new ApiResponse(200, 'Clients retrieved successfully', clients));
    },
);

export const getUserById = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        if (!req.user) throw ApiError.unauthorized();
        const user = await getUserByIdService(req.params.id as string, req.user!._id, req.user!.role as UserRole);
        res.status(200).json(new ApiResponse(200, 'User retrieved successfully', user));
    },
);

export const assignPm = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { procurementManagerId } = req.body;
        const user = await assignPmService(req.params.id as string, procurementManagerId);
        const msg = procurementManagerId
            ? 'Inspection manager assigned to procurement manager'
            : 'Inspection manager unassigned from procurement manager';
        res.status(200).json(new ApiResponse(200, msg, user));
    },
);

export const updateUserStatus = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
        const { isActive } = req.body;
        const user = await updateUserStatusService(req.params.id as string, isActive);
        res.status(200).json(
            new ApiResponse(200, `User ${isActive ? 'activated' : 'deactivated'} successfully`, user),
        );
    },
);
