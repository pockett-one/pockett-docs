'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export type HierarchyClient = {
    id: string
    name: string
    slug: string
    projects: {
        id: string
        clientId: string
        name: string
        slug: string
        description: string | null
        updatedAt: Date
        driveFolderId: string | null
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
        select: { role: true }
    })

    if (!membership) {
        throw new Error('Unauthorized')
    }

    // 2. Fetch Hierarchy
    const isOwner = membership.role === 'ORG_OWNER'

    const clients = await prisma.client.findMany({
        where: {
            organizationId
        },
        include: {
            projects: {
                where: isOwner ? {} : {
                    members: {
                        some: {
                            userId: user.id,
                            canView: true // Must have at least view access
                        }
                    }
                },
                include: {
                    members: {
                        where: { userId: user.id },
                        select: {
                            userId: true,
                            canView: true,
                            canEdit: true,
                            canManage: true
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
        projects: c.projects.map((p: any) => ({
            ...p,
            clientId: p.clientId,
            slug: p.slug
        }))
    }))
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
