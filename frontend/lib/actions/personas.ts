'use server'

import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { logger } from "@/lib/logger"

/**
 * Get all available personas (V2)
 */
export async function getPersonas() {
    return await (prisma as any).persona.findMany({
        include: {
            grants: {
                include: {
                    scope: true,
                    privilege: true
                }
            }
        },
        orderBy: { slug: 'asc' }
    })
}

/**
 * Get personas filtered for projects (V2)
 */
export async function getProjectPersonas() {
    return await (prisma as any).persona.findMany({
        where: { slug: { startsWith: 'project_' } },
        include: {
            grants: {
                include: {
                    scope: true,
                    privilege: true
                }
            }
        },
        orderBy: { slug: 'asc' }
    })
}

/**
 * Get personas filtered for organizations (V2)
 */
export async function getOrganizationPersonas() {
    return await (prisma as any).persona.findMany({
        where: { slug: { startsWith: 'org_' } },
        include: {
            grants: {
                include: {
                    scope: true,
                    privilege: true
                }
            }
        },
        orderBy: { slug: 'asc' }
    })
}

/**
 * Legacy compatibility: ensure personas exist (V2)
 * In V2, we use global personas seeded in platform.personas.
 */
export async function ensureProjectPersonasForProject(_projectId: string) {
    logger.debug('ensureProjectPersonasForProject is now a no-op in V2 as we use global personas.')
    return []
}
