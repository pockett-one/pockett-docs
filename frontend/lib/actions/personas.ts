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
        return await seedDefaultPersonas(org.id)
    }

    return personas
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

/**
 * Seed default personas for an organization
 * Creates org-specific personas linked to global RBAC personas
 */
async function seedDefaultPersonas(organizationId: string) {
    // Map of default persona display names to RBAC persona slugs
    const defaultPersonas = [
        {
            displayName: "Project Lead",
            description: "Internal team member responsible for project oversight. Can manage members, invite collaborators, and perform all document operations including deletions. Full administrative access to the project.",
            rbacPersonaSlug: "proj_admin"
        },
        {
            displayName: "Team Member",
            description: "Internal staff member with full project access. Can create, edit, and manage documents. Can invite team members and collaborate on all project activities.",
            rbacPersonaSlug: "proj_member"
        },
        {
            displayName: "External Collaborator",
            description: "External partner, contractor, or vendor working on the project. Can view and edit documents but cannot manage project settings or delete content. Access is typically project-scoped & on need to know basis.",
            rbacPersonaSlug: "proj_ext_collaborator"
        },
        {
            displayName: "Client Contact",
            description: "Client stakeholder or project sponsor with view-only access. Can review documents, provide feedback, and track project progress. Cannot edit or manage project content.",
            rbacPersonaSlug: "proj_guest"
        }
    ]

    const seeded = []
    for (const d of defaultPersonas) {
        // Find RBAC persona
        const rbacPersona = await prisma.rbacPersona.findUnique({
            where: { slug: d.rbacPersonaSlug }
        })

        if (!rbacPersona) {
            console.warn(`RBAC persona ${d.rbacPersonaSlug} not found, skipping`)
            continue
        }

        // Create org-specific persona
        const p = await prisma.projectPersona.create({
            data: {
                organizationId,
                rbacPersonaId: rbacPersona.id,
                displayName: d.displayName,
                description: d.description
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
        seeded.push(p)
    }
    return seeded
}
