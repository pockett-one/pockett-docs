'use server'

import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { ProjectPersona } from "@prisma/client"

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

    // Fetch Personas
    const personas = await prisma.projectPersona.findMany({
        where: { organizationId: org.id },
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

    // Seed if empty
    if (personas.length === 0) {
        return await ensureProjectPersonasForOrganization(org.id)
    }

    return personas
}

/**
 * Ensure portal.project_personas rows exist for an organization (only proj_* from rbac.personas).
 * Idempotent: uses upsert so safe to call on every project creation.
 * Call this when creating a new project so seed records always exist.
 */
export async function ensureProjectPersonasForOrganization(organizationId: string) {
    const rbacProjectPersonas = await prisma.rbacPersona.findMany({
        where: { slug: { startsWith: 'proj_' } },
        orderBy: { slug: 'asc' }
    })

    const result = []
    for (const rbacPersona of rbacProjectPersonas) {
        const p = await prisma.projectPersona.upsert({
            where: {
                organizationId_rbacPersonaId: {
                    organizationId,
                    rbacPersonaId: rbacPersona.id
                }
            },
            create: {
                organizationId,
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
        result.push(p)
    }
    return result
}

/**
 * Create a new persona (links to RBAC persona)
 */
export async function createPersona(orgSlug: string, data: {
    displayName: string,
    description?: string,
    rbacPersonaSlug: string  // e.g., 'proj_admin', 'proj_member'
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true }
    })
    if (!org) throw new Error("Organization not found")

    // Find RBAC persona by slug
    const rbacPersona = await prisma.rbacPersona.findUnique({
        where: { slug: data.rbacPersonaSlug }
    })
    if (!rbacPersona) throw new Error("Invalid RBAC persona")

    // Check if persona already exists for this org
    const existing = await prisma.projectPersona.findUnique({
        where: {
            organizationId_rbacPersonaId: {
                organizationId: org.id,
                rbacPersonaId: rbacPersona.id
            }
        }
    })
    if (existing) throw new Error("Persona already exists for this organization")

    return await prisma.projectPersona.create({
        data: {
            organizationId: org.id,
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

/** Seed default personas (delegates to ensureProjectPersonasForOrganization). */
async function seedDefaultPersonas(organizationId: string) {
    return ensureProjectPersonasForOrganization(organizationId)
}
