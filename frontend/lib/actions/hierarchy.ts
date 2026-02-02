'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ROLES } from '@/lib/roles'
import { PERMISSIONS } from '@/lib/permissions'

export type HierarchyClient = {
    id: string
    name: string
    slug: string
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
 * Securely checks user permissions.
 */
export async function getOrganizationHierarchy(organizationSlug: string): Promise<HierarchyClient[]> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        console.error('hierarchy.ts: Server-side User Auth Failed:', error)
        redirect('/signin')
    }

    // Fetch Permission IDs
    const permissions = await prisma.permission.findMany({
        where: { name: { in: [PERMISSIONS.CAN_VIEW, PERMISSIONS.CAN_EDIT, PERMISSIONS.CAN_MANAGE] } }
    })
    const viewId = permissions.find(p => p.name === PERMISSIONS.CAN_VIEW)?.id
    const editId = permissions.find(p => p.name === PERMISSIONS.CAN_EDIT)?.id
    const manageId = permissions.find(p => p.name === PERMISSIONS.CAN_MANAGE)?.id

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
        include: { role: true }
    })

    if (!membership) {
        throw new Error('Unauthorized')
    }

    // 2. Fetch Hierarchy
    const isOwner = membership.role.name === ROLES.ORG_OWNER

    const clients = await prisma.client.findMany({
        where: {
            organizationId
        },
        include: {
            projects: {
                where: {
                    isDeleted: false,
                    ...(isOwner ? {} : {
                        members: {
                            some: {
                                userId: user.id,
                                persona: {
                                    permissions: {
                                        path: ['can_view'],
                                        equals: true
                                    }
                                }
                            }
                        }
                    })
                },
                include: {
                    members: {
                        where: { userId: user.id },
                        select: {
                            userId: true,
                            persona: {
                                select: { permissions: true }
                            }
                        }
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
        industry: c.industry,
        sector: c.sector,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        projects: c.projects.map((p: any) => {
            const member = p.members[0]
            const perms = (member?.persona?.permissions as any) || {}

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
                    canView: isOwner || !!perms.can_view,
                    canEdit: isOwner || !!perms.can_edit,
                    canManage: isOwner || !!perms.can_manage
                }]
            }
        })
    }))
}

/** Whether the current user is an org internal member (ORG_OWNER or ORG_MEMBER). Used to show/hide member bubbles on project cards. */
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
        include: { role: true }
    })
    if (!membership) return false
    const name = membership.role.name
    return name === ROLES.ORG_OWNER || name === ROLES.ORG_MEMBER
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

    // Verify Member
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
