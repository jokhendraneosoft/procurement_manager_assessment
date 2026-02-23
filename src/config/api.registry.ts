/**
 * API route registry: single source of truth for OpenAPI path definitions.
 * When you add or change a route, update this file. Request body schemas
 * are taken from your Joi validators and converted to OpenAPI automatically.
 */
import type { Schema } from 'joi';
import { loginSchema } from '../validators/auth.validator';
import {
    createUserSchema,
    assignPmSchema,
    updateStatusSchema,
} from '../validators/user.validator';
import {
    createOrderSchema,
    updateOrderStatusSchema,
    linkChecklistSchema,
} from '../validators/order.validator';
import {
    createChecklistSchema,
    updateChecklistSchema,
} from '../validators/checklist.validator';
import { startAnswerSchema, submitAnswerSchema } from '../validators/answer.validator';

export interface RouteSpec {
    method: 'get' | 'post' | 'put' | 'patch' | 'delete';
    path: string;
    summary: string;
    tags: string[];
    description?: string;
    /** Set to [] for public endpoints (e.g. login) */
    security?: 'bearer' | 'none';
    /** Joi schema for request body - converted to OpenAPI automatically */
    requestBodySchema?: Schema;
    parameters?: Array<{
        name: string;
        in: 'path' | 'query';
        required?: boolean;
        schema?: { type: string; default?: number };
        description?: string;
    }>;
    responses?: Record<string, string>;
}

const defaultResponses: Record<string, string> = {
    '200': 'Success',
    '201': 'Created',
    '400': 'Bad request',
    '401': 'Unauthorized',
    '403': 'Forbidden',
    '404': 'Not found',
};

export const apiRegistry: RouteSpec[] = [
    {
        method: 'get',
        path: '/health',
        summary: 'Health check (liveness)',
        tags: ['Health'],
        security: 'none',
        description: 'Returns 200 if the process is up. Use for liveness probes.',
        responses: { '200': 'API is running' },
    },
    {
        method: 'get',
        path: '/health/ready',
        summary: 'Readiness (DB)',
        tags: ['Health'],
        security: 'none',
        description: 'Returns 200 if MongoDB is connected and pingable; 503 otherwise. Use for readiness probes.',
        responses: { '200': 'Ready', '503': 'Service Unavailable (e.g. DB down)' },
    },
    {
        method: 'post',
        path: '/api/v1/auth/login',
        summary: 'Login',
        tags: ['Auth'],
        description:
            'Admin/PM/Client: email + password. Inspection Manager: mobile + password.',
        security: 'none',
        requestBodySchema: loginSchema,
        responses: { '200': 'Login successful', '401': 'Invalid credentials' },
    },
    {
        method: 'post',
        path: '/api/v1/auth/logout',
        summary: 'Logout (revoke token)',
        tags: ['Auth'],
        description: 'Revokes the current JWT. Requires Authorization: Bearer <token>.',
        responses: { '200': 'Logged out successfully' },
    },
    {
        method: 'post',
        path: '/api/v1/users',
        summary: 'Create user',
        tags: ['Users'],
        description: 'Admin: any role. PM: inspection_manager or client only.',
        requestBodySchema: createUserSchema,
        responses: { '201': 'User created', '403': 'Forbidden' },
    },
    {
        method: 'get',
        path: '/api/v1/users',
        summary: 'List all users',
        tags: ['Users'],
        description: 'Admin only. Paginated.',
        parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': 'Paginated users' },
    },
    {
        method: 'get',
        path: '/api/v1/users/my-team',
        summary: 'List my team (IMs)',
        tags: ['Users'],
        description: 'PM only.',
        responses: { '200': 'List of users' },
    },
    {
        method: 'get',
        path: '/api/v1/users/my-clients',
        summary: 'List clients',
        tags: ['Users'],
        description: 'PM only.',
        responses: { '200': 'List of clients' },
    },
    {
        method: 'get',
        path: '/api/v1/users/{id}',
        summary: 'Get user by ID',
        tags: ['Users'],
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': 'User', '403': 'Not in your team' },
    },
    {
        method: 'patch',
        path: '/api/users/{id}/assign-pm',
        summary: 'Assign or unassign IM to PM',
        tags: ['Users'],
        description: 'Admin only. Send procurementManagerId: null to unassign.',
        parameters: [{ name: 'id', in: 'path', required: true }],
        requestBodySchema: assignPmSchema,
        responses: { '200': 'Updated' },
    },
    {
        method: 'patch',
        path: '/api/users/{id}/status',
        summary: 'Activate or deactivate user',
        tags: ['Users'],
        description: 'Admin only.',
        parameters: [{ name: 'id', in: 'path', required: true }],
        requestBodySchema: updateStatusSchema,
        responses: { '200': 'Updated' },
    },
    {
        method: 'post',
        path: '/api/v1/orders',
        summary: 'Create order',
        tags: ['Orders'],
        description: 'PM or Admin.',
        requestBodySchema: createOrderSchema,
        responses: { '201': 'Order created' },
    },
    {
        method: 'get',
        path: '/api/v1/orders',
        summary: 'List orders',
        tags: ['Orders'],
        description: 'Scoped by role. Paginated.',
        parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': 'Paginated orders' },
    },
    {
        method: 'get',
        path: '/api/v1/orders/{id}',
        summary: 'Get order by ID',
        tags: ['Orders'],
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': 'Order', '403': 'Forbidden' },
    },
    {
        method: 'patch',
        path: '/api/v1/orders/{id}/status',
        summary: 'Update order status',
        tags: ['Orders'],
        description: 'PM, IM, or Admin. Client cannot.',
        parameters: [{ name: 'id', in: 'path', required: true }],
        requestBodySchema: updateOrderStatusSchema,
        responses: { '200': 'Updated' },
    },
    {
        method: 'patch',
        path: '/api/v1/orders/{id}/checklist',
        summary: 'Link checklist to order',
        tags: ['Orders'],
        description: 'PM or Admin.',
        parameters: [{ name: 'id', in: 'path', required: true }],
        requestBodySchema: linkChecklistSchema,
        responses: { '200': 'Checklist linked' },
    },
    {
        method: 'post',
        path: '/api/v1/checklists',
        summary: 'Create checklist',
        tags: ['Checklists'],
        description: 'PM or Admin.',
        requestBodySchema: createChecklistSchema,
        responses: { '201': 'Checklist created' },
    },
    {
        method: 'get',
        path: '/api/v1/checklists',
        summary: 'List checklists',
        tags: ['Checklists'],
        description: 'Scoped by role. Paginated.',
        parameters: [
            { name: 'client', in: 'query', description: 'Filter by client ID' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': 'Paginated checklists' },
    },
    {
        method: 'get',
        path: '/api/v1/checklists/{id}',
        summary: 'Get checklist by ID',
        tags: ['Checklists'],
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': 'Checklist' },
    },
    {
        method: 'put',
        path: '/api/v1/checklists/{id}',
        summary: 'Update checklist (new version)',
        tags: ['Checklists'],
        description: 'PM or Admin. Creates a new version.',
        parameters: [{ name: 'id', in: 'path', required: true }],
        requestBodySchema: updateChecklistSchema,
        responses: { '200': 'New version created' },
    },
    {
        method: 'post',
        path: '/api/v1/answers',
        summary: 'Start or get draft answer',
        tags: ['Answers'],
        description: 'IM only. Body: { orderId }.',
        requestBodySchema: startAnswerSchema,
        responses: { '200': 'Answer sheet' },
    },
    {
        method: 'patch',
        path: '/api/v1/answers/{id}',
        summary: 'Update answer responses',
        tags: ['Answers'],
        description: 'IM only.',
        parameters: [{ name: 'id', in: 'path', required: true }],
        requestBodySchema: submitAnswerSchema,
        responses: { '200': 'Updated' },
    },
    {
        method: 'patch',
        path: '/api/answers/{id}/submit',
        summary: 'Submit checklist (finalize)',
        tags: ['Answers'],
        description: 'IM only.',
        parameters: [{ name: 'id', in: 'path', required: true }],
        responses: { '200': 'Submitted' },
    },
    {
        method: 'get',
        path: '/api/v1/answers/{orderId}',
        summary: 'Get answer by order ID',
        tags: ['Answers'],
        description: 'Admin, PM, IM, or Client (scoped).',
        parameters: [{ name: 'orderId', in: 'path', required: true }],
        responses: { '200': 'Answer sheet' },
    },
    {
        method: 'post',
        path: '/api/v1/uploads',
        summary: 'Upload file',
        tags: ['Uploads'],
        description: 'Any authenticated user. Multipart form field: file. Allowed: JPEG, PNG, GIF, WebP only; validated by magic bytes.',
        responses: { '201': 'File URL returned' },
    },
];
