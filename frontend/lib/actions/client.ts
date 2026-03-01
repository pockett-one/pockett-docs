'use server'

import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { ROLES } from '@/lib/roles'

export interface CreateClientData {
    name: string
    industry?: string
    sector?: string
}

export async function createClient(organizationSlug: string, data: CreateClientData) {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // 1. Resolve Org & Check Permissions
    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: {
                where: { userId: user.id },
                include: {
                    organizationPersona: {
                        include: {
                            rbacPersona: {
                                include: { role: true }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!organization) {
        throw new Error('Organization not found')
    }

    const membership = organization.members[0]
    if (!membership) {
        throw new Error('Unauthorized')
    }

    // All users with org membership can create clients (org_guest removed)
    // Additional permission checks happen at client/project level via personas

    // 1.5 Check for duplicate Name (Option A)
    const existingName = await prisma.client.findFirst({
        where: {
            organizationId: organization.id,
            name: {
                equals: data.name,
                mode: 'insensitive' // Case insensitive check
            }
        }
    })

    if (existingName) {
        throw new Error('A client with this name already exists')
    }

    // 2. Generate Slug (12 chars: base 7 + '-' + suffix 4, same as org) and ensure uniqueness within org
    const { generateClientSlug } = await import('@/lib/slug-utils')
    const MAX_SLUG_ATTEMPTS = 10
    let slug = generateClientSlug(data.name)
    let attempts = 0
    while (attempts < MAX_SLUG_ATTEMPTS) {
        const existing = await prisma.client.findUnique({
            where: {
                organizationId_slug: {
                    organizationId: organization.id,
                    slug
                }
            }
        })
        if (!existing) break
        slug = generateClientSlug(data.name)
        attempts++
    }
    if (attempts >= MAX_SLUG_ATTEMPTS) {
        throw new Error('Could not generate a unique client slug. Please try again.')
    }

    // 3. Create Client
    const newClient = await prisma.client.create({
        data: {
            organizationId: organization.id,
            name: data.name,
            slug: slug,
            industry: data.industry,
            sector: data.sector
        }
    })

    // 4. Create Folder Structure if Google Drive connected
    try {
        const org = await prisma.organization.findUnique({
            where: { id: organization.id },
            include: { connector: true }
        })
        const connector = org?.connector?.type === 'GOOGLE_DRIVE' && org.connector?.status === 'ACTIVE'
            ? org.connector
            : null

        if (connector) {
            const { GoogleDriveConnector } = require('@/lib/google-drive-connector')
            await GoogleDriveConnector.getInstance().ensureAppFolderStructure(
                connector.id,
                newClient.name,
                newClient.slug
            )
        }
    } catch (e) {
        console.error("Failed to create Google Drive folder for client", e)
    }

    revalidatePath(`/d/o/${organizationSlug}`)
    return newClient
}

export interface UpdateClientData {
    name?: string
    industry?: string
    sector?: string
}

/**
 * Update client details. Requires can_manage on client (or org_admin).
 */
export async function updateClient(
    organizationSlug: string,
    clientSlug: string,
    data: UpdateClientData
): Promise<void> {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: { where: { userId: user.id } },
            clients: { where: { slug: clientSlug }, select: { id: true, name: true } }
        }
    })
    if (!organization || organization.members.length === 0) throw new Error('Unauthorized')
    const client = organization.clients[0]
    if (!client) throw new Error('Client not found')

    const { canManageClient } = await import('@/lib/permission-helpers')
    const canManage = await canManageClient(organization.id, client.id)
    if (!canManage) throw new Error('Insufficient permissions to update client')

    const updateData: { name?: string; industry?: string; sector?: string } = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.industry !== undefined) updateData.industry = data.industry
    if (data.sector !== undefined) updateData.sector = data.sector
    if (Object.keys(updateData).length === 0) return

    await prisma.client.update({
        where: { id: client.id },
        data: updateData
    })
    revalidatePath(`/d/o/${organizationSlug}`)
    revalidatePath(`/d/o/${organizationSlug}/c/${clientSlug}`)
}

/**
 * Delete client and all associated data (cascade). Org admin only.
 */
export async function deleteClient(organizationSlug: string, clientSlug: string): Promise<void> {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: {
                where: { userId: user.id },
                include: {
                    organizationPersona: {
                        include: { rbacPersona: { select: { slug: true } } }
                    }
                }
            },
            clients: { where: { slug: clientSlug }, select: { id: true } }
        }
    })
    if (!organization || organization.members.length === 0) throw new Error('Unauthorized')
    const personaSlug = organization.members[0].organizationPersona?.rbacPersona?.slug
    if (personaSlug !== 'org_admin') throw new Error('Only organization owners can delete a client')
    const client = organization.clients[0]
    if (!client) throw new Error('Client not found')

    await prisma.client.delete({
        where: { id: client.id }
    })
    revalidatePath(`/d/o/${organizationSlug}`)
}
