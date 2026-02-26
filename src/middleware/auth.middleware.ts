import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { IUserPayload } from '../types/user.types';
import { isRevoked } from '../utils/jwtBlacklist';

export const authenticate = (
    req: Request,
    _res: Response,
    next: NextFunction,
): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(ApiError.unauthorized('No token provided. Please log in.'));
    }

    const token = authHeader.split(' ')[1];

    if (isRevoked(token)) {
        return next(ApiError.unauthorized('Token has been revoked. Please log in again.'));
    }

    try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as IUserPayload & { type?: string };
        if (decoded.type === 'refresh') {
            return next(ApiError.unauthorized('Use the refresh token endpoint to get a new access token'));
        }
        req.user = decoded as IUserPayload;
        next();
    } catch {
        next(ApiError.unauthorized('Invalid or expired token'));
    }
};
