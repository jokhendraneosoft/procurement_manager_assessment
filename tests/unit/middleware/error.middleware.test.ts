import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { errorMiddleware } from '@/middleware/error.middleware';

jest.mock('@/config/env', () => ({
    env: { isDev: true },
}));

jest.mock('@/utils/logger', () => ({
    logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn(), child: jest.fn(() => ({ error: jest.fn(), info: jest.fn(), warn: jest.fn() })) },
}));

describe('errorMiddleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    const mockNext = jest.fn();

    beforeEach(() => {
        mockReq = { requestId: 'test-id', path: '/test', method: 'GET' };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    it('should handle ApiError with statusCode and message', () => {
        const err = ApiError.badRequest('Validation failed', ['field required']);
        errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(400);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                statusCode: 400,
                message: 'Validation failed',
                errors: ['field required'],
            }),
        );
    });

    it('should handle generic Error with 500', () => {
        const err = new Error('Unexpected');
        errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                success: false,
                statusCode: 500,
                message: 'Internal Server Error',
            }),
        );
    });

    it('should include stack in dev', () => {
        const err = new Error('Test');
        errorMiddleware(err, mockReq as Request, mockRes as Response, mockNext);

        expect(mockRes.json).toHaveBeenCalledWith(
            expect.objectContaining({
                stack: expect.any(String),
            }),
        );
    });
});
