'use server'

import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { ProjectPersona } from "@prisma/client"
import { ROLES } from "@/lib/roles"

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
        include: { role: true },
        orderBy: { createdAt: 'asc' }
    })

    // Seed if empty
    if (personas.length === 0) {
        return await seedDefaultPersonas(org.id)
    }

    return personas
}

export async function createPersona(orgSlug: string, data: {
    name: string,
    description?: string,
    roleName: string, // Changed from Enum
    permissions: any
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Unauthorized")

    const org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true }
    })
    if (!org) throw new Error("Organization not found")

    const role = await prisma.role.findUnique({ where: { name: data.roleName } })
    if (!role) throw new Error("Invalid Role")

    return await prisma.projectPersona.create({
        data: {
            organizationId: org.id,
            name: data.name,
            description: data.description,
            roleId: role.id,
            permissions: data.permissions ?? {},
            isDefault: false
        }
    })
}

export async function updatePersona(personaId: string, data: {
    name?: string,
    description?: string
}) {
    // Only update name/description for now.
    return await prisma.projectPersona.update({
        where: { id: personaId },
        data: {
            name: data.name,
            description: data.description
        }
    })
}

async function seedDefaultPersonas(organizationId: string) {
    // Fetch System Roles
    const allRoles = await prisma.role.findMany()
    const getRoleId = (name: string) => {
        const r = allRoles.find(r => r.name === name)
        if (!r) throw new Error(`System Role ${name} not found. db seed missing?`)
        return r.id
    }

    const defaults = [
        {
            name: "Project Lead",
            description: "Internal team member responsible for project oversight. Can manage members, invite collaborators, and perform all document operations including deletions. Full administrative access to the project.",
            roleId: getRoleId(ROLES.ORG_MEMBER), // Leads are Org Members with elevated permissions
            permissions: { can_view: true, can_edit: true, can_manage: true, can_comment: true },
            isDefault: true
        },
        {
            name: "Team Member",
            description: "Internal staff member with full project access. Can create, edit, and manage documents. Can invite team members and collaborate on all project activities.",
            roleId: getRoleId(ROLES.ORG_MEMBER),
            permissions: { can_view: true, can_edit: true, can_manage: true, can_comment: true },
            isDefault: true
        },
        {
            name: "External Collaborator",
            description: "External partner, contractor, or vendor working on the project. Can view and edit documents but cannot manage project settings or delete content. Access is typically project-scoped & on need to know basis.",
            roleId: getRoleId(ROLES.ORG_GUEST),
            permissions: { can_view: true, can_edit: true, can_manage: false, can_comment: true },
            isDefault: true
        },
        {
            name: "Client Contact",
            description: "Client stakeholder or project sponsor with view-only access. Can review documents, provide feedback, and track project progress. Cannot edit or manage project content.",
            roleId: getRoleId(ROLES.ORG_GUEST),
            permissions: { can_view: true, can_edit: false, can_manage: false, can_comment: true },
            isDefault: true
        }
    ]

    const seeded = []
    for (const d of defaults) {
        const p = await prisma.projectPersona.create({
            data: {
                organizationId,
                name: d.name,
                description: d.description,
                roleId: d.roleId,
                permissions: d.permissions,
                isDefault: d.isDefault
            },
            include: { role: true } // Return with role for the UI
        })
        seeded.push(p)
    }
    return seeded
}
