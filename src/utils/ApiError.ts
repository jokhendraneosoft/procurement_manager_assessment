/**
 * Custom application error class.
 *
 * Error response shape (set by errorMiddleware):
 * {
 *   success: false,
 *   statusCode: number,
 *   message: string,
 *   errors: string[] | null,   -- field-level validation errors
 *   stack: string | undefined  -- only in development
 * }
 */
export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly errors: string[];
    public readonly isOperational: boolean;

    constructor(
        statusCode: number,
        message: string,
        errors: string[] = [],
        isOperational = true,
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.isOperational = isOperational;

        // Maintain proper prototype chain
        Object.setPrototypeOf(this, ApiError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }

    // ─── Static convenience factories ───────────────────────────────────────────

    static badRequest(message: string, errors: string[] = []): ApiError {
        return new ApiError(400, message, errors);
    }

    static unauthorized(message = 'Unauthorized'): ApiError {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Forbidden - Insufficient permissions'): ApiError {
        return new ApiError(403, message);
    }

    static notFound(resource = 'Resource'): ApiError {
        return new ApiError(404, `${resource} not found`);
    }

    static conflict(message: string): ApiError {
        return new ApiError(409, message);
    }

    static internal(message = 'Internal server error'): ApiError {
        return new ApiError(500, message, [], false);
    }
}
