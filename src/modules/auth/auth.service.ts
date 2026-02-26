import jwt from 'jsonwebtoken';
import { userRepository } from '../users/user.repository';
import { ApiError } from '../../utils/ApiError';
import { env } from '../../config/env';
import { IUserPayload, UserRole } from '../../types/user.types';

interface LoginInput {
    email?: string;
    mobile?: string;
    password: string;
}

export interface LoginResult {
    token: string;
    refreshToken: string;
    user: {
        _id: string;
        name: string;
        role: string;
        email?: string;
        mobile?: string;
    };
}

/** Payload for refresh (reference) token – must not be accepted as access token. */
interface IRefreshPayload extends IUserPayload {
    type: 'refresh';
}

export const loginService = async (input: LoginInput): Promise<LoginResult> => {
    const { email, mobile, password } = input;

    let user;

    if (email) {
        user = await userRepository.findByEmailActive(email);
        if (!user) throw ApiError.unauthorized('Invalid email or password');
        if (user.role === UserRole.INSPECTION_MANAGER) {
            throw ApiError.badRequest('Inspection managers must log in with mobile number');
        }
    } else if (mobile) {
        user = await userRepository.findByMobileActive(mobile);
        if (!user) throw ApiError.unauthorized('Invalid mobile number or password');
        if (user.role !== UserRole.INSPECTION_MANAGER) {
            throw ApiError.badRequest('Only inspection managers can log in with mobile number');
        }
    }

    if (!user) throw ApiError.unauthorized('Invalid credentials');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

    // ── Generate JWT ──────────────────────────────────────────────────────────
    const payload: IUserPayload = {
        _id: user._id.toString(),
        role: user.role as UserRole,
        name: user.name,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshPayload: IRefreshPayload = { ...payload, type: 'refresh' };
    const refreshToken = jwt.sign(refreshPayload, env.JWT_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
        token,
        refreshToken,
        user: {
            _id: user._id.toString(),
            name: user.name,
            role: user.role,
            email: user.email,
            mobile: user.mobile,
        },
    };
};

/**
 * Exchange a valid refresh (reference) token for a new access token and user.
 * Refresh token is revoked after use (one-time use; client must store and send it).
 */
export const refreshService = async (refreshToken: string): Promise<LoginResult> => {
    const { isRevoked, revokeToken } = await import('../../utils/jwtBlacklist');
    if (isRevoked(refreshToken)) {
        throw ApiError.unauthorized('Refresh token has been revoked');
    }

    let decoded: IRefreshPayload;
    try {
        decoded = jwt.verify(refreshToken, env.JWT_SECRET) as IRefreshPayload;
    } catch {
        throw ApiError.unauthorized('Invalid or expired refresh token');
    }
    if (decoded.type !== 'refresh') {
        throw ApiError.unauthorized('Invalid refresh token');
    }

    const user = await userRepository.findById(decoded._id, { populate: false });
    if (!user) throw ApiError.unauthorized('User no longer exists');
    if (!user.isActive) throw ApiError.unauthorized('Account is inactive');

    revokeToken(refreshToken);

    const payload: IUserPayload = {
        _id: decoded._id,
        role: decoded.role,
        name: decoded.name,
    };
    const token = jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });
    const refreshPayload: IRefreshPayload = { ...payload, type: 'refresh' };
    const newRefreshToken = jwt.sign(refreshPayload, env.JWT_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    return {
        token,
        refreshToken: newRefreshToken,
        user: {
            _id: user._id.toString(),
            name: user.name,
            role: user.role,
            email: user.email,
            mobile: user.mobile,
        },
    };
};
