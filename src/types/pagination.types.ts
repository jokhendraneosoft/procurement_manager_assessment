/**
 * Pagination request (query params) and response shape.
 */
export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedResult<T> {
    items: T[];
    pagination: PaginationMeta;
}

/** Default limit and max for list endpoints */
export const PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
} as const;

export function parsePaginationParams(query: { page?: string; limit?: string }): PaginationParams {
    const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
    const rawLimit = parseInt(String(query.limit ?? PAGINATION.DEFAULT_LIMIT), 10) || PAGINATION.DEFAULT_LIMIT;
    const limit = Math.min(Math.max(1, rawLimit), PAGINATION.MAX_LIMIT);
    return { page, limit };
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
    };
}
