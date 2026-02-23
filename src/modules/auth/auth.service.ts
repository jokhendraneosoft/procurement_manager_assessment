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

interface LoginResult {
    token: string;
    user: {
        _id: string;
        name: string;
        role: string;
        email?: string;
        mobile?: string;
    };
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

    return {
        token,
        user: {
            _id: user._id.toString(),
            name: user.name,
            role: user.role,
            email: user.email,
            mobile: user.mobile,
        },
    };
};
