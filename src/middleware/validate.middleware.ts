import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Joi request validation middleware factory.
 * Usage: validate(schema) — validates req.body by default
 *        validate(schema, 'params') — validates req.params
 *
 * On failure: throws ApiError(400) with all Joi error messages as `errors[]`
 */
export const validate =
    (schema: Joi.ObjectSchema, target: ValidationTarget = 'body') =>
        (req: Request, _res: Response, next: NextFunction): void => {
            const { error, value } = schema.validate(req[target], {
                abortEarly: false,    // Collect ALL errors, not just first
                stripUnknown: true,   // Remove fields not in schema
                convert: true,        // Auto-convert types (string → number etc.)
            });

            if (error) {
                const messages = error.details.map((d) =>
                    d.message.replace(/['"]/g, ''),
                );
                return next(ApiError.badRequest('Validation failed', messages));
            }

            // Replace req[target] with sanitized value
            if (target === 'body') req.body = value;
            else if (target === 'query') req.query = value;
            // params are typically not replaced as they're readonly

            next();
        };
