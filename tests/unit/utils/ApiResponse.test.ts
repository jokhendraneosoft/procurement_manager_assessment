import { ApiResponse } from '@/utils/ApiResponse';

describe('ApiResponse', () => {
    it('should create response with statusCode, message, and data', () => {
        const data = { id: '1', name: 'Test' };
        const res = new ApiResponse(200, 'Success', data);
        expect(res.success).toBe(true);
        expect(res.statusCode).toBe(200);
        expect(res.message).toBe('Success');
        expect(res.data).toEqual(data);
        expect(res.timestamp).toBeDefined();
        expect(new Date(res.timestamp).getTime()).not.toBeNaN();
    });

    it('should set success to true by default', () => {
        const res = new ApiResponse(201, 'Created', { id: '1' });
        expect(res.success).toBe(true);
    });

    it('should accept any data type', () => {
        const res = new ApiResponse(200, 'OK', null);
        expect(res.data).toBeNull();
    });
});
