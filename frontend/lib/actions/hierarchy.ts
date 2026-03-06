'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { findOrganizationInPermissions, findProjectInPermissions } from '@/lib/permission-helpers'

export type HierarchyClient = {
    id: string
    name: string
    slug: string
    organizationId?: string
    industry: string | null
    sector: string | null
    status: string | null
    createdAt: Date
    updatedAt: Date
    projects: {
        id: string
        clientId: string
        name: string
        slug: string
        description: string | null
        updatedAt: Date
        connectorRootFolderId: string | null
        isClosed: boolean
        members: {
            userId: string
            canView: boolean
            canEdit: boolean
            canManage: boolean
        }[]
    }[]
}

/**
 * Fetch Organization Hierarchy (V2)
 */
export async function getOrganizationHierarchy(organizationSlug: string): Promise<HierarchyClient[]> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    const organization = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true }
    })

    if (!organization) {
        throw new Error('Organization not found')
    }

    const organizationId = organization.id

    // 1. Verify Member (V2)
    const membership = await (prisma as any).orgMember.findUnique({
        where: {
            userId_organizationId_personaId: {
                userId: user.id,
                organizationId,
                personaId: (await (prisma as any).persona.findUnique({ where: { slug: 'org_owner' } }))?.id || ''
                // Wait, findUnique with userId_organizationId_personaId needs all three.
                // Better use findFirst if we don't know the personaId.
            }
        }
    }).catch(() => null)

    // Actually, let's just find any membership for the user in this org
    const anyMembership = await (prisma as any).orgMember.findFirst({
        where: { userId: user.id, organizationId }
    })

    if (!anyMembership) {
        throw new Error('Unauthorized')
    }

    // 2. Get cached permissions
    const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
    const orgPerms = findOrganizationInPermissions(settings.permissions, organizationId)

    const isOwner = orgPerms?.personas.includes('org_owner') ||
        orgPerms?.scopes.organization?.includes('can_manage') || false

    // 3. Fetch Hierarchy (V2)
    const clients = await (prisma as any).client.findMany({
        where: { organizationId },
        include: {
            projects: {
                where: { isDeleted: false },
                include: {
                    members: {
                        where: { userId: user.id },
                        include: { persona: true }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            }
        },
        orderBy: { name: 'asc' }
    })

    return clients.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        organizationId: organizationId,
        industry: c.industry,
        sector: c.sector,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        projects: c.projects.map((p: any) => {
            const projectPerms = findProjectInPermissions(
                settings.permissions,
                organizationId,
                c.id,
                p.id
            )

            const canView = projectPerms?.scopes.project?.includes('can_view') || false
            const canEdit = projectPerms?.scopes.project?.includes('can_edit') || false
            const canManage = projectPerms?.scopes.project?.includes('can_manage') || false

            return {
                id: p.id,
                clientId: p.clientId,
                name: p.name,
                slug: p.slug,
                description: p.description,
                updatedAt: p.updatedAt,
                connectorRootFolderId: p.connectorRootFolderId,
                isClosed: p.isClosed ?? false,
                members: [{
                    userId: user.id,
                    canView: isOwner || canView,
                    canEdit: isOwner || canEdit,
                    canManage: isOwner || canManage
                }]
            }
        })
    }))
}

/**
 * Whether the current user is an org internal member (V2)
 */
export async function getIsOrgInternal(organizationSlug: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const organization = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true }
    })
    if (!organization) return false

    const membership = await (prisma as any).orgMember.findFirst({
        where: { organizationId: organization.id, userId: user.id },
        include: { persona: true }
    })

    if (!membership) return false

    const personaSlug = membership.persona?.slug
    return personaSlug === 'org_owner' || personaSlug === 'org_member' || personaSlug === 'sys_admin'
}

/**
 * Get organization name (V2)
 */
export async function getOrganizationName(organizationSlug: string): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 'Organization'

    const organization = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true, name: true }
    })

    if (!organization) return 'Organization'

    const membership = await (prisma as any).orgMember.findFirst({
        where: { organizationId: organization.id, userId: user.id }
    })

    if (!membership) return 'Organization'

    return organization.name
}
