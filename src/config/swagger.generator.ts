/**
 * Generates OpenAPI 3.0 spec from api.registry + Joi validators.
 * Change a Joi schema → docs update automatically. Add a route → add one entry to the registry.
 */
import parse from 'joi-to-json';
import { apiRegistry, type RouteSpec } from './api.registry';

const BASE_SPEC = {
    openapi: '3.0.0',
    info: {
        title: 'Procurement Management API',
        version: '1.0.0',
        description:
            'REST API for procurement orders, checklists, and inspection workflows. Authenticate via POST /api/v1/auth/login, then use the token in Authorization: Bearer <token>.',
    },
    servers: [
        { url: 'http://localhost:5000', description: 'Development' },
        { url: '/', description: 'Current host' },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'JWT from POST /api/v1/auth/login',
            },
        },
        schemas: {
            PaginationMeta: {
                type: 'object',
                properties: {
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    total: { type: 'integer' },
                    totalPages: { type: 'integer' },
                },
            },
        },
    },
    security: [{ bearerAuth: [] }],
};

function joiToOpenApiSchema(joiSchema: unknown): Record<string, unknown> | null {
    try {
        const result = parse(joiSchema as import('joi').Schema, 'open-api');
        if (result && typeof result === 'object' && !Array.isArray(result)) {
            return result as Record<string, unknown>;
        }
        return null;
    } catch {
        return null;
    }
}

function routeToPathItem(route: RouteSpec, schemaName: string | null): Record<string, unknown> {
    const op: Record<string, unknown> = {
        summary: route.summary,
        tags: route.tags,
        responses: {},
    };
    if (route.description) op.description = route.description;
    if (route.security === 'none') {
        op.security = [];
    }
    const responses = route.responses || { '200': 'Success' };
    for (const [code, desc] of Object.entries(responses)) {
        (op.responses as Record<string, unknown>)[code] = { description: desc };
    }
    if (route.parameters?.length) {
        op.parameters = route.parameters.map((p) => ({
            name: p.name,
            in: p.in,
            required: p.required ?? (p.in === 'path'),
            schema: p.schema || { type: 'string' },
            description: p.description,
        }));
    }
    if (route.requestBodySchema && schemaName) {
        op.requestBody = {
            required: true,
            content: {
                'application/json': {
                    schema: { $ref: `#/components/schemas/${schemaName}` },
                },
            },
        };
    }
    return op;
}

export function generateSwaggerSpec(): Record<string, unknown> {
    const paths: Record<string, Record<string, unknown>> = {};
    const schemas: Record<string, unknown> = {
        ...(BASE_SPEC.components?.schemas as Record<string, unknown>),
    };

    let schemaIndex = 0;
    for (const route of apiRegistry) {
        let schemaName: string | null = null;
        if (route.requestBodySchema) {
            const converted = joiToOpenApiSchema(route.requestBodySchema);
            if (converted) {
                schemaName = `RequestBody_${route.method}_${schemaIndex}`;
                schemas[schemaName] = converted;
                schemaIndex += 1;
            }
        }

        const pathKey = route.path.replace(/\{([^}]+)\}/g, '{$1}');
        if (!paths[pathKey]) paths[pathKey] = {};
        (paths[pathKey] as Record<string, unknown>)[route.method] = routeToPathItem(
            route,
            schemaName,
        );
    }

    return {
        ...BASE_SPEC,
        components: {
            ...BASE_SPEC.components,
            schemas,
        },
        paths,
    };
}

/** Cached spec (generated once at startup; validators are the source of truth). */
let cachedSpec: Record<string, unknown> | null = null;

export function getSwaggerSpec(): Record<string, unknown> {
    if (!cachedSpec) cachedSpec = generateSwaggerSpec();
    return cachedSpec;
}
