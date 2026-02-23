import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { validate } from '@/middleware/validate.middleware';

describe('validate middleware', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let mockNext: NextFunction;

    beforeEach(() => {
        mockReq = { body: {} };
        mockRes = {};
        mockNext = jest.fn();
    });

    it('should call next() when body is valid', () => {
        const schema = Joi.object({ name: Joi.string().required() });
        const middleware = validate(schema);
        mockReq.body = { name: 'Test' };

        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.body).toEqual({ name: 'Test' });
    });

    it('should call next(ApiError) when validation fails', () => {
        const schema = Joi.object({ name: Joi.string().required() });
        const middleware = validate(schema);
        mockReq.body = {};

        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockNext).toHaveBeenCalledTimes(1);
        const err = (mockNext as jest.Mock).mock.calls[0][0];
        expect(err.statusCode).toBe(400);
        expect(err.message).toBe('Validation failed');
        expect(err.errors).toBeDefined();
        expect(Array.isArray(err.errors)).toBe(true);
    });

    it('should sanitize body with stripUnknown', () => {
        const schema = Joi.object({ name: Joi.string().required() });
        const middleware = validate(schema);
        mockReq.body = { name: 'Test', extra: 'ignored' };

        middleware(mockReq as Request, mockRes as Response, mockNext);

        expect(mockReq.body).toEqual({ name: 'Test' });
        expect(mockNext).toHaveBeenCalledWith();
    });
});
