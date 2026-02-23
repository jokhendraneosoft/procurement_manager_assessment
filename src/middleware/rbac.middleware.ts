import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '../types/user.types';

/**
 * RBAC middleware factory.
 * Usage: authorize(UserRole.ADMIN, UserRole.PROCUREMENT_MANAGER)
 *
 * Must be used AFTER the `authenticate` middleware.
 */
export const authorize =
    (...allowedRoles: UserRole[]) =>
        (req: Request, _res: Response, next: NextFunction): void => {
            if (!req.user) {
                return next(ApiError.unauthorized());
            }

            if (!allowedRoles.includes(req.user.role as UserRole)) {
                return next(
                    ApiError.forbidden(
                        `Role '${req.user.role}' is not allowed to access this resource`,
                    ),
                );
            }

            next();
        };
