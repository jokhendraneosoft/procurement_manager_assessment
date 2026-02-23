import Joi from 'joi';
import { UserRole } from '../types/user.types';

const passwordSchema = Joi.string().min(6).required().messages({
    'string.min': 'Password must be at least 6 characters',
    'any.required': 'Password is required',
});

export const createUserSchema = Joi.object({
    name: Joi.string().min(2).max(100).trim().required().messages({
        'string.min': 'Name must be at least 2 characters',
        'any.required': 'Name is required',
    }),
    email: Joi.string().email().lowercase().trim(),
    mobile: Joi.string()
        .pattern(/^\+?[1-9]\d{9,14}$/)
        .trim()
        .messages({
            'string.pattern.base': 'Mobile must be a valid international format (e.g. +91XXXXXXXXXX)',
        }),
    password: passwordSchema,
    role: Joi.string()
        .valid(
            UserRole.ADMIN,
            UserRole.PROCUREMENT_MANAGER,
            UserRole.INSPECTION_MANAGER,
            UserRole.CLIENT,
        )
        .required()
        .messages({
            'any.only': 'Role must be one of: admin, procurement_manager, inspection_manager, client',
            'any.required': 'Role is required',
        }),
});

export const assignPmSchema = Joi.object({
    procurementManagerId: Joi.string()
        .pattern(/^[a-fA-F0-9]{24}$/)
        .allow(null)
        .messages({
            'string.pattern.base': 'procurementManagerId must be a valid MongoDB ObjectId',
        }),
});

export const updateStatusSchema = Joi.object({
    isActive: Joi.boolean().required().messages({
        'any.required': 'isActive (boolean) is required',
    }),
});
