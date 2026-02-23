import Joi from 'joi';

export const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().trim(),
    mobile: Joi.string()
        .pattern(/^\+?[1-9]\d{9,14}$/)
        .trim()
        .messages({
            'string.pattern.base': 'Mobile number must be a valid international format',
        }),
    password: Joi.string().min(6).required().messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required',
    }),
})
    .xor('email', 'mobile')
    .messages({
        'object.xor': 'Provide either email or mobile number, not both',
        'object.missing': 'Either email or mobile number is required',
    });
