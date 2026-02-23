import { Request, Response, NextFunction } from 'express';
import { loginService } from './auth.service';
import { ApiResponse } from '../../utils/ApiResponse';
import { asyncHandler } from '../../utils/asyncHandler';
import { revokeToken } from '../../utils/jwtBlacklist';

export const login = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const result = await loginService(req.body);

        res.status(200).json(
            new ApiResponse(200, 'Login successful', result),
        );
    },
);

export const logout = asyncHandler(
    async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            revokeToken(token);
        }
        res.status(200).json(
            new ApiResponse(200, 'Logged out successfully', { loggedOut: true }),
        );
    },
);
