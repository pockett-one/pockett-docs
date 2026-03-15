'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { userSettingsPlus, type UserPermissions } from '@/lib/user-settings-plus'
import { findProjectInPermissions } from '@/lib/permission-helpers'
import { logger } from '@/lib/logger'

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
 * Pure membership-based: a user sees exactly what their ClientMember and ProjectMember rows grant.
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
        // Slug may be stale after sign-in redirect or from a bad link; send user to org list
        redirect('/d')
    }

    const organizationId = organization.id

    // Verify the user has any membership in this org
    const anyMembership = await (prisma as any).orgMember.findFirst({
        where: { userId: user.id, organizationId }
    })

    if (!anyMembership) {
        logger.warn('User has no org membership, returning empty hierarchy', { userId: user.id, organizationId })
        return []
    }

    // Get cached permissions for project scope resolution
    let permissions: UserPermissions = { organizations: [] }
    try {
        const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
        permissions = settings.permissions || { organizations: [] }
    } catch (e) {
        logger.debug('Could not get cached permissions for hierarchy check', e as Error)
    }

    // Pure membership-based fetch (V2)
    // A user sees a client if they have a ClientMember row OR at least one ProjectMember
    // under that client. ProjectMember rows are the single source of truth — no isOwner branching.
    const clients = await (prisma as any).client.findMany({
        where: {
            organizationId,
            OR: [
                { members: { some: { userId: user.id } } },
                { projects: { some: { isDeleted: false, members: { some: { userId: user.id } } } } }
            ]
        },
        include: {
            projects: {
                where: { isDeleted: false, members: { some: { userId: user.id } } },
                include: {
                    members: {
                        where: { userId: user.id }
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
                permissions,
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
                    canView: canView || canManage,
                    canEdit: canEdit || canManage,
                    canManage
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
        where: { organizationId: organization.id, userId: user.id }
    })

    if (!membership) return false

    const personaSlug = membership.role
    return personaSlug === 'org_admin' || personaSlug === 'org_member' || personaSlug === 'sys_admin'
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
