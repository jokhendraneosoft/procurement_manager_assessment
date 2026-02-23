import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import { parsePaginationParams, paginationMeta } from '../../types/pagination.types';
import {
    createChecklistService,
    updateChecklistService,
    getAllChecklistsService,
    getChecklistByIdService
} from './checklist.service';

export const createChecklist = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const checklist = await createChecklistService(req.body, req.user!._id);
    res.status(201).json(new ApiResponse(201, 'Checklist created successfully', checklist));
});

export const updateChecklist = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const checklist = await updateChecklistService(req.params.id as string, req.body, req.user!._id);
    res.status(200).json(new ApiResponse(200, 'Checklist updated (new version created)', checklist));
});

export const getAllChecklists = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const clientId = typeof req.query.client === 'string' ? req.query.client : undefined;
    const { page, limit } = parsePaginationParams(req.query as { page?: string; limit?: string });
    const { items, total } = await getAllChecklistsService(
        req.user!.role,
        req.user!._id,
        clientId,
        page,
        limit,
    );
    const pagination = paginationMeta(page, limit, total);
    res.status(200).json(
        new ApiResponse(200, 'Checklists retrieved successfully', { items, pagination }),
    );
});

export const getChecklistById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const checklist = await getChecklistByIdService(req.params.id as string);
    res.status(200).json(new ApiResponse(200, 'Checklist retrieved successfully', checklist));
});
