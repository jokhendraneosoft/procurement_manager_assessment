import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../utils/logger';

interface ErrorResponse {
    success: false;
    statusCode: number;
    message: string;
    errors: string[] | null;
    stack?: string;
}

export const errorMiddleware = (
    err: Error,
    req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: NextFunction,
): void => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let errors: string[] = [];

    // ── 1. Known operational API errors ─────────────────────────────────────────
    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        errors = err.errors;
    }

    // ── 2. Mongoose validation errors (required fields, enum, minlength, etc.) ─
    else if (err instanceof MongooseError.ValidationError) {
        statusCode = 422;
        message = 'Validation failed';
        errors = Object.values(err.errors).map((e) => e.message);
    }

    // ── 3. Mongoose CastError (invalid ObjectId format) ─────────────────────────
    else if (err instanceof MongooseError.CastError) {
        statusCode = 400;
        // Don't expose the invalid value in the response (could be sensitive)
        message = env.isDev
            ? `Invalid value for field '${err.path}': ${err.value}`
            : `Invalid value for field '${err.path}'`;
    }

    // ── 4. MongoDB duplicate key (E11000) ────────────────────────────────────────
    else if (err instanceof MongoServerError && err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
        // Don't expose the duplicate value (e.g. email/mobile) in the response
        message = `A record with this ${field} already exists`;
    }

    // ── 5. JWT errors (invalid / expired token) ─────────────────────────────────
    else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token. Please log in again.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Your session has expired. Please log in again.';
    }

    // ── 6. Unexpected / programmer errors ────────────────────────────────────────
    else {
        logger.error(
            {
                err,
                message: err.message,
                stack: err.stack,
                requestId: req.requestId,
                path: req.path,
                method: req.method,
            },
            env.isDev ? 'Unexpected error' : 'Error',
        );
    }

    const body: ErrorResponse = {
        success: false,
        statusCode,
        message,
        errors: errors.length > 0 ? errors : null,
    };

    // Only expose stack trace in development
    if (env.isDev) {
        body.stack = err.stack;
    }

    res.status(statusCode).json(body);
};

// ── 404 Not Found handler (must be registered after all routes) ──────────────
export const notFoundMiddleware = (req: Request, _res: Response, next: NextFunction): void => {
    next(ApiError.notFound(`Route '${req.method} ${req.originalUrl}'`));
};
