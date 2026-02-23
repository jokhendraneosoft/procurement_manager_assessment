/**
 * Standard API success response wrapper.
 *
 * Shape:
 * {
 *   success: true,
 *   statusCode: number,
 *   message: string,
 *   data: T
 * }
 */
export class ApiResponse<T = unknown> {
    public readonly success: boolean = true;
    public readonly statusCode: number;
    public readonly message: string;
    public readonly data: T;
    public readonly timestamp: string;

    constructor(statusCode: number, message: string, data: T) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.timestamp = new Date().toISOString();
    }
}
