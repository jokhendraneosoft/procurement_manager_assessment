import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { ApiResponse } from '../../utils/ApiResponse';
import {
    getOrStartAnswerService,
    updateAnswerService,
    submitAnswerService,
    getAnswerByOrderIdService
} from './answer.service';

export const startAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.body;
    const answer = await getOrStartAnswerService(orderId, req.user!._id);
    res.status(200).json(new ApiResponse(200, 'Answer sheet retrieved/started', answer));
});

export const updateAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { responses } = req.body;
    // responses is array of { sectionId, questionId, value, imageUrl }
    const answer = await updateAnswerService(req.params.id as string, responses, req.user!._id);
    res.status(200).json(new ApiResponse(200, 'Answers updated', answer));
});

export const submitAnswer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const answer = await submitAnswerService(req.params.id as string, req.user!._id);
    res.status(200).json(new ApiResponse(200, 'Checklist submitted successfully', answer));
});

export const getAnswerByOrderId = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const answer = await getAnswerByOrderIdService(
        req.params.orderId as string,
        req.user!._id,
        req.user!.role
    );
    res.status(200).json(new ApiResponse(200, 'Answer sheet retrieved', answer));
});
