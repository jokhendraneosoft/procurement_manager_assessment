import { Request, Response, NextFunction } from 'express';
import { asyncHandler } from '@/utils/asyncHandler';

describe('asyncHandler', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = {};
        mockRes = {};
        mockNext = jest.fn();
    });

    it('should call the handler and pass req, res, next', async () => {
        const handler = jest.fn().mockResolvedValue(undefined);
        const wrapped = asyncHandler(handler);
        await wrapped(
            mockReq as Request,
            mockRes as Response,
            mockNext,
        );
        expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
        expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call next with error when handler throws', async () => {
        const error = new Error('Handler error');
        const handler = jest.fn().mockRejectedValue(error);
        const wrapped = asyncHandler(handler);
        await wrapped(
            mockReq as Request,
            mockRes as Response,
            mockNext,
        );
        expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should call next when handler rejects with ApiError', async () => {
        const { ApiError } = await import('@/utils/ApiError');
        const handler = jest.fn().mockRejectedValue(ApiError.badRequest('Invalid'));
        const wrapped = asyncHandler(handler);
        await wrapped(
            mockReq as Request,
            mockRes as Response,
            mockNext,
        );
        expect(mockNext).toHaveBeenCalledWith(
            expect.objectContaining({ statusCode: 400, message: 'Invalid' }),
        );
    });
});
