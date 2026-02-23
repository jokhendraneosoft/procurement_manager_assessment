import { Request, Response, NextFunction } from 'express';

type AsyncController = (
    req: Request,
    res: Response,
    next: NextFunction,
) => Promise<void | Response>;

/**
 * Wraps an async route handler to automatically catch errors
 * and forward them to the global error middleware.
 *
 * Note: Express 5 handles async errors natively, but this wrapper
 * gives explicit, typed control and keeps all handlers consistent.
 */
export const asyncHandler =
    (fn: AsyncController) =>
        (req: Request, res: Response, next: NextFunction): void => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
