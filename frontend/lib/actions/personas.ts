'use server'

import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { ProjectPersona } from "@prisma/client"
import { logger } from "@/lib/logger"

/**
 * Get organization's project personas
 * Returns org-specific personas linked to global RBAC personas
 */
export async function getOrganizationPersonas(orgSlug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Get Organization ID
    const org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true }
    })

    if (!org) {
        throw new Error("Organization not found")
    }

    // Fetch project-level personas for the first project in this org (legacy: getOrganizationPersonas by org slug).
    // Prefer getProjectPersonas(projectId) when you have a project context.
    const firstProject = await prisma.project.findFirst({
        where: { organizationId: org.id },
        select: { id: true }
    })
    if (!firstProject) return []
    return getProjectPersonas(firstProject.id)
}

/**
 * Get project personas for a project (project-level persona set).
 */
export async function getProjectPersonas(projectId: string) {
    const personas = await prisma.projectPersona.findMany({
        where: { projectId },
        include: {
            rbacPersona: {
                include: {
                    role: true,
                    grants: {
                        include: {
                            scope: true,
                            privilege: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    })
    return personas
}

/**
 * Ensure portal.project_personas rows exist for a project (replicate proj_* from rbac.personas).
 * Idempotent: uses upsert. Call when creating a new project so the project has its own persona set.
 * RLS on project_personas is by projectId (user sees personas for projects they are a member of).
 */
export async function ensureProjectPersonasForProject(projectId: string) {
    const rbacProjectPersonas = await prisma.rbacPersona.findMany({
        where: { slug: { startsWith: 'proj_' } },
        orderBy: { slug: 'asc' }
    })

    logger.info(`Ensuring ${rbacProjectPersonas.length} project personas for project ${projectId}`)

    const result = []
    for (const rbacPersona of rbacProjectPersonas) {
        const p = await prisma.projectPersona.upsert({
            where: {
                projectId_rbacPersonaId: {
                    projectId,
                    rbacPersonaId: rbacPersona.id
                }
            },
            create: {
                projectId,
                rbacPersonaId: rbacPersona.id,
                displayName: rbacPersona.displayName,
                description: rbacPersona.description ?? undefined
            },
            update: {
                displayName: rbacPersona.displayName,
                description: rbacPersona.description ?? undefined
            },
            include: {
                rbacPersona: {
                    include: {
                        role: true,
                        grants: {
                            include: {
                                scope: true,
                                privilege: true
                            }
                        }
                    }
                }
            }
        })
        logger.debug(`Project persona ensured: ${rbacPersona.slug} -> ${p.id}`)
        result.push(p)
    }
    return result
}

/**
 * Create a new project persona (links to RBAC persona) for a project.
 */
export async function createPersona(projectId: string, data: {
    displayName: string,
    description?: string,
    rbacPersonaSlug: string  // e.g., 'proj_admin', 'proj_member'
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { id: true }
    })
    if (!project) throw new Error("Project not found")

    const rbacPersona = await prisma.rbacPersona.findUnique({
        where: { slug: data.rbacPersonaSlug }
    })
    if (!rbacPersona) throw new Error("Invalid RBAC persona")

    const existing = await prisma.projectPersona.findUnique({
        where: {
            projectId_rbacPersonaId: {
                projectId,
                rbacPersonaId: rbacPersona.id
            }
        }
    })
    if (existing) throw new Error("Persona already exists for this project")

    return await prisma.projectPersona.create({
        data: {
            projectId,
            rbacPersonaId: rbacPersona.id,
            displayName: data.displayName,
            description: data.description
        },
        include: {
            rbacPersona: {
                include: {
                    role: true,
                    grants: {
                        include: {
                            scope: true,
                            privilege: true
                        }
                    }
                }
            }
        }
    })
}

/**
 * Update persona display name/description (grants come from RBAC persona)
 */
export async function updatePersona(personaId: string, data: {
    displayName?: string,
    description?: string
}) {
    return await prisma.projectPersona.update({
        where: { id: personaId },
        data: {
            displayName: data.displayName,
            description: data.description
        },
        include: {
            rbacPersona: {
                include: {
                    role: true,
                    grants: {
                        include: {
                            scope: true,
                            privilege: true
                        }
                    }
                }
            }
        }
    })
}

/** Seed default personas for a project (delegates to ensureProjectPersonasForProject). */
async function seedDefaultPersonas(projectId: string) {
    return ensureProjectPersonasForProject(projectId)
}
