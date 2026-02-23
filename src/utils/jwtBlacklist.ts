import { createHash } from 'crypto';

/**
 * In-memory token blacklist for logout / invalidation.
 * In production with multiple instances, use Redis or a shared store.
 */
const revoked = new Set<string>();

function hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function revokeToken(token: string): void {
    revoked.add(hashToken(token));
}

export function isRevoked(token: string): boolean {
    return revoked.has(hashToken(token));
}
