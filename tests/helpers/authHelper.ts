import jwt from 'jsonwebtoken';
import { UserRole } from '../../src/types/user.types';

const TEST_JWT_SECRET = 'test-secret-at-least-32-characters-long';

/** Valid 24-char hex ObjectIds for test tokens (required by Types.ObjectId in services). */
export const TEST_IDS = {
    ADMIN: '507f1f77bcf86cd799439011',
    PM: '507f1f77bcf86cd799439012',
} as const;

export function getAuthToken(payload: { _id: string; role: UserRole; name: string }): string {
    return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '1h' });
}

export function getAdminToken(): string {
    return getAuthToken({ _id: TEST_IDS.ADMIN, role: UserRole.ADMIN, name: 'Admin' });
}

export function getPMToken(): string {
    return getAuthToken({ _id: TEST_IDS.PM, role: UserRole.PROCUREMENT_MANAGER, name: 'PM' });
}
