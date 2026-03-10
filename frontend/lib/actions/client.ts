'use server'

import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'

export interface CreateClientData {
    name: string
    industry?: string
    sector?: string
}

/**
 * Create a new client (V2)
 */
export async function createClient(organizationSlug: string, data: CreateClientData) {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // 1. Resolve Org & Check Permissions (V2)
    const organization = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: {
                where: { userId: user.id },
                include: { persona: true }
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

    // 2. Check for duplicate Name (V2)
    const existingName = await (prisma as any).client.findFirst({
        where: {
            organizationId: organization.id,
            name: {
                equals: data.name,
                mode: 'insensitive'
            }
        }
    })

    if (existingName) {
        throw new Error('A client with this name already exists')
    }

    // 3. Generate Slug and ensure uniqueness (V2)
    const { generateClientSlug } = await import('@/lib/slug-utils')
    const MAX_SLUG_ATTEMPTS = 10
    let slug = generateClientSlug(data.name)
    let attempts = 0
    while (attempts < MAX_SLUG_ATTEMPTS) {
        const existing = await (prisma as any).client.findUnique({
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

    // 4. Create Client record + ClientMember for creator (V2)
    const projectAdminPersona = await (prisma as any).persona.findUnique({
        where: { slug: 'project_admin' }
    })

    const newClient = await (prisma as any).$transaction(async (tx: any) => {
        const client = await tx.client.create({
            data: {
                organizationId: organization.id,
                name: data.name,
                slug: slug,
                industry: data.industry,
                sector: data.sector
            }
        })

        if (projectAdminPersona) {
            await tx.clientMember.create({
                data: {
                    clientId: client.id,
                    userId: user.id,
                    personaId: projectAdminPersona.id
                }
            })
        }

        return client
    })

    // 5. Create Drive Folder Structure if connected (V2)
    try {
        const connectorId = organization.connectorId
        if (connectorId) {
            await googleDriveConnector.ensureAppFolderStructure(
                connectorId,
                newClient.name,
                newClient.slug,
                await googleDriveConnector.createGoogleDriveAdapter(connectorId),
                organization.id
            )
        }
    } catch (e) {
        logger.error("Failed to create Google Drive folder for client (V2)", e as Error)
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
 * Update client details (V2)
 */
export async function updateClient(
    organizationSlug: string,
    clientSlug: string,
    data: UpdateClientData
): Promise<void> {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const organization = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: { where: { userId: user.id } },
            clients: { where: { slug: clientSlug }, select: { id: true, name: true } }
        }
    })
    if (!organization || organization.members.length === 0) throw new Error('Unauthorized')
    const client = organization.clients[0]
    if (!client) throw new Error('Client not found')

    // Permission check: org_owner or project_admin or has can_manage on client
    // Simplified for V2 migration: if org member, check if allowed via permission helper
    const { canManageClient } = await import('@/lib/permission-helpers')
    const canManage = await canManageClient(organization.id, client.id)
    if (!canManage) throw new Error('Insufficient permissions')

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.industry !== undefined) updateData.industry = data.industry
    if (data.sector !== undefined) updateData.sector = data.sector
    if (Object.keys(updateData).length === 0) return

    await (prisma as any).client.update({
        where: { id: client.id },
        data: updateData
    })

    revalidatePath(`/d/o/${organizationSlug}`)
    revalidatePath(`/d/o/${organizationSlug}/c/${clientSlug}`)
}

/**
 * Delete client (V2)
 */
export async function deleteClient(organizationSlug: string, clientSlug: string): Promise<void> {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const organization = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: {
                where: { userId: user.id },
                include: { persona: true }
            },
            clients: { where: { slug: clientSlug }, select: { id: true } }
        }
    })

    if (!organization || organization.members.length === 0) throw new Error('Unauthorized')

    // Only org_owner can delete clients in V2 by default
    const personaSlug = organization.members[0].persona?.slug
    if (personaSlug !== 'org_owner') throw new Error('Only organization owners can delete a client')

    const client = organization.clients[0]
    if (!client) throw new Error('Client not found')

    await (prisma as any).client.delete({
        where: { id: client.id }
    })

    revalidatePath(`/d/o/${organizationSlug}`)
}
