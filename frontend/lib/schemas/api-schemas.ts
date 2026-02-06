/**
 * Zod schemas for API validation
 * Provides type-safe validation for API requests and responses
 */

import { z } from 'zod'

/**
 * Common validation schemas
 */
export const commonSchemas = {
    uuid: z.string().uuid('Invalid UUID format'),
    email: z.string().email('Invalid email address'),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
    url: z.string().url('Invalid URL format'),
    nonEmptyString: z.string().min(1, 'This field is required'),
}

/**
 * Pagination schemas
 */
export const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationParams = z.infer<typeof paginationSchema>

/**
 * Organization schemas
 */
export const createOrganizationSchema = z.object({
    name: commonSchemas.nonEmptyString,
    slug: commonSchemas.slug.optional(),
})

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>

/**
 * Project schemas
 */
export const createProjectSchema = z.object({
    name: commonSchemas.nonEmptyString,
    description: z.string().optional(),
    clientId: commonSchemas.uuid,
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

/**
 * Invitation schemas
 */
export const createInvitationSchema = z.object({
    email: commonSchemas.email,
    personaId: commonSchemas.uuid,
    projectId: commonSchemas.uuid,
})

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>

/**
 * Member schemas
 */
export const updateMemberRoleSchema = z.object({
    memberId: commonSchemas.uuid,
    personaId: commonSchemas.uuid,
})

export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>

/**
 * Helper function for safe parsing with better error messages
 */
export function safeParse<T>(schema: z.ZodSchema<T>, data: unknown) {
    const result = schema.safeParse(data)

    if (!result.success) {
        throw result.error
    }

    return result.data
}

/**
 * Helper to validate request body
 */
export async function validateRequestBody<T>(
    req: Request,
    schema: z.ZodSchema<T>
): Promise<T> {
    const body = await req.json()
    return safeParse(schema, body)
}

/**
 * Helper to validate search params
 */
export function validateSearchParams<T>(
    searchParams: URLSearchParams,
    schema: z.ZodSchema<T>
): T {
    const params = Object.fromEntries(searchParams.entries())
    return safeParse(schema, params)
}
