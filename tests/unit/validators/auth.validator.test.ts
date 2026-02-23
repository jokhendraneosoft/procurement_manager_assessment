import { loginSchema } from '@/validators/auth.validator';

describe('auth.validator - loginSchema', () => {
    describe('valid inputs', () => {
        it('should accept email + password', () => {
            const { error, value } = loginSchema.validate({
                email: 'user@example.com',
                password: 'secret123',
            });
            expect(error).toBeUndefined();
            expect(value.email).toBe('user@example.com');
            expect(value.password).toBe('secret123');
        });

        it('should accept mobile + password', () => {
            const { error, value } = loginSchema.validate({
                mobile: '+1234567890',
                password: 'secret123',
            });
            expect(error).toBeUndefined();
            expect(value.mobile).toBe('+1234567890');
            expect(value.password).toBe('secret123');
        });

        it('should trim and lowercase email', () => {
            const { error, value } = loginSchema.validate({
                email: '  User@Example.COM  ',
                password: 'secret123',
            });
            expect(error).toBeUndefined();
            expect(value.email).toBe('user@example.com');
        });
    });

    describe('invalid inputs', () => {
        it('should reject when both email and mobile provided', () => {
            const { error } = loginSchema.validate({
                email: 'user@example.com',
                mobile: '+1234567890',
                password: 'secret123',
            });
            expect(error).toBeDefined();
            expect(error?.message).toMatch(/either email or mobile|xor/i);
        });

        it('should reject when neither email nor mobile provided', () => {
            const { error } = loginSchema.validate({
                password: 'secret123',
            });
            expect(error).toBeDefined();
            expect(error?.message).toMatch(/either email or mobile|required/i);
        });

        it('should reject short password', () => {
            const { error } = loginSchema.validate({
                email: 'user@example.com',
                password: 'short',
            });
            expect(error).toBeDefined();
            expect(error?.message).toMatch(/6 characters|min/i);
        });

        it('should reject missing password', () => {
            const { error } = loginSchema.validate({
                email: 'user@example.com',
            });
            expect(error).toBeDefined();
            expect(error?.message).toMatch(/password|required/i);
        });

        it('should reject invalid email', () => {
            const { error } = loginSchema.validate({
                email: 'not-an-email',
                password: 'secret123',
            });
            expect(error).toBeDefined();
        });

        it('should reject invalid mobile format', () => {
            const { error } = loginSchema.validate({
                mobile: '123',
                password: 'secret123',
            });
            expect(error).toBeDefined();
            expect(error?.message).toMatch(/mobile|international|pattern/i);
        });
    });
});
