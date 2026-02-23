import { ApiError } from '@/utils/ApiError';

describe('ApiError', () => {
    describe('constructor', () => {
        it('should create error with statusCode, message, and optional errors', () => {
            const err = new ApiError(400, 'Bad request', ['field1 is invalid']);
            expect(err).toBeInstanceOf(Error);
            expect(err).toBeInstanceOf(ApiError);
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Bad request');
            expect(err.errors).toEqual(['field1 is invalid']);
            expect(err.isOperational).toBe(true);
        });

        it('should default errors to empty array and isOperational to true', () => {
            const err = new ApiError(500, 'Server error');
            expect(err.errors).toEqual([]);
            expect(err.isOperational).toBe(true);
        });
    });

    describe('static factories', () => {
        it('badRequest should return 400 with message and optional errors', () => {
            const err = ApiError.badRequest('Validation failed', ['email required']);
            expect(err.statusCode).toBe(400);
            expect(err.message).toBe('Validation failed');
            expect(err.errors).toEqual(['email required']);
        });

        it('unauthorized should return 401 with default message', () => {
            const err = ApiError.unauthorized();
            expect(err.statusCode).toBe(401);
            expect(err.message).toBe('Unauthorized');
        });

        it('unauthorized should accept custom message', () => {
            const err = ApiError.unauthorized('Invalid token');
            expect(err.statusCode).toBe(401);
            expect(err.message).toBe('Invalid token');
        });

        it('forbidden should return 403 with default message', () => {
            const err = ApiError.forbidden();
            expect(err.statusCode).toBe(403);
            expect(err.message).toBe('Forbidden - Insufficient permissions');
        });

        it('notFound should return 404 with resource name', () => {
            const err = ApiError.notFound('User');
            expect(err.statusCode).toBe(404);
            expect(err.message).toBe('User not found');
        });

        it('notFound should default resource to "Resource"', () => {
            const err = ApiError.notFound();
            expect(err.message).toBe('Resource not found');
        });

        it('conflict should return 409', () => {
            const err = ApiError.conflict('Email already exists');
            expect(err.statusCode).toBe(409);
            expect(err.message).toBe('Email already exists');
        });

        it('internal should return 500 and isOperational false', () => {
            const err = ApiError.internal('Internal server error');
            expect(err.statusCode).toBe(500);
            expect(err.message).toBe('Internal server error');
            expect(err.isOperational).toBe(false);
        });
    });
});
