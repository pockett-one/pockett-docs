'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { findOrganizationInPermissions, findClientInPermissions, findProjectInPermissions } from '@/lib/permission-helpers'

export type HierarchyClient = {
    id: string
    name: string
    slug: string
    organizationId?: string // Include orgId for permission checks
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
        driveFolderId: string | null
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
 * Fetch Organization Hierarchy (Clients -> Projects)
 * Uses cached permissions - no DB queries for permission checks
 */
export async function getOrganizationHierarchy(organizationSlug: string): Promise<HierarchyClient[]> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        const isRetryable = error?.message?.includes('AuthRetryableFetchError') ||
            (error as { status?: number })?.status === 504
        console.error(
            'hierarchy.ts: Server-side User Auth Failed:',
            error,
            isRetryable
                ? '\n→ Supabase may be unreachable (e.g. local 127.0.0.1:54321 not running). Set NEXT_PUBLIC_SUPABASE_URL to your project URL if using hosted Supabase.'
                : ''
        )
        redirect('/signin')
    }

    // 0. Resolve Slug to ID
    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true }
    })

    if (!organization) {
        throw new Error('Organization not found')
    }

    const organizationId = organization.id

    // 1. Verify User Access to Organization
    const membership = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId: user.id
            }
        },
        include: {
            organizationPersona: {
                include: {
                    rbacPersona: {
                        include: { role: true }
                    }
                }
            }
        }
    })

    if (!membership) {
        throw new Error('Unauthorized')
    }

    // 2. Get cached permissions (no DB query for permissions)
    const settings = await userSettingsPlus.getUserSettingsPlus(user.id)
    const orgPerms = findOrganizationInPermissions(settings.permissions, organizationId)
    
    // Check if user is org owner (has org_owner persona or can_manage on organization scope)
    const isOwner = orgPerms?.personas.includes('org_owner') || 
                    orgPerms?.scopes.organization?.includes('can_manage') || false

    // 3. Fetch Hierarchy (RLS will filter based on user's access)
    const clients = await prisma.client.findMany({
        where: {
            organizationId
        },
        include: {
            projects: {
                where: {
                    isDeleted: false
                    // RLS will filter projects user has access to
                },
                include: {
                    members: {
                        where: { userId: user.id },
                        select: {
                            userId: true,
                            persona: {
                                select: {
                                    rbacPersona: {
                                        select: {
                                            slug: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            }
        },
        orderBy: { name: 'asc' }
    })

    return clients.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        organizationId: organizationId, // Include orgId for permission checks
        industry: c.industry,
        sector: c.sector,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        projects: c.projects.map((p) => {
            const member = p.members[0]
            const projectPerms = findProjectInPermissions(
                settings.permissions,
                organizationId,
                c.id,
                p.id
            )

            // Get permissions from cached structure
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
                driveFolderId: p.driveFolderId,
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

/** Whether the current user is an org internal member (ORG_OWNER or ORG_MEMBER). */
export async function getIsOrgInternal(organizationSlug: string): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true }
    })
    if (!organization) return false

    const membership = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: organization.id,
                userId: user.id
            }
        },
        include: {
            organizationPersona: {
                include: {
                    rbacPersona: {
                        include: { role: true }
                    }
                }
            }
        }
    })
    if (!membership) return false
    
    const roleSlug = membership.organizationPersona?.rbacPersona?.role?.slug || 'org_member'
    return roleSlug === 'org_member' || roleSlug === 'sys_manager'
}

export async function getOrganizationName(organizationSlug: string): Promise<string> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return 'Organization'

    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true, name: true }
    })

    if (!organization) return 'Organization'

    // Verify Member (RLS will handle this, but we check explicitly)
    const membership = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: organization.id,
                userId: user.id
            }
        }
    })

    if (!membership) return 'Organization'

    return organization.name
}
