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

    // 2. Generate Slug with strict length limit (12 chars total)
    const { generateClientSlug } = await import('@/lib/slug-utils')
    let slug = generateClientSlug(data.name)

    // Check for duplicates and append random suffix if needed
    const existing = await prisma.client.findUnique({
        where: {
            organizationId_slug: {
                organizationId: organization.id,
                slug
            }
        }
    })

    if (existing) {
        // Append random suffix if duplicate found
        // Ensure total length is exactly 12: base (max 7) + '-' + suffix (4) = 12
        const baseSlug = slug.length > 7 ? slug.substring(0, 7).replace(/-$/, '') : slug
        const randomSuffix = Math.random().toString(36).substring(2, 6)
        slug = `${baseSlug}-${randomSuffix}`
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
        const connector = await prisma.connector.findFirst({
            where: {
                organizationId: organization.id,
                type: 'GOOGLE_DRIVE',
                status: 'ACTIVE'
            }
        })

        if (connector) {
            const { GoogleDriveConnector } = require('@/lib/google-drive-connector')
            await GoogleDriveConnector.getInstance().ensureAppFolderStructure(
                connector.id,
                newClient.name
            )
        }
    } catch (e) {
        console.error("Failed to create Google Drive folder for client", e)
    }

    revalidatePath(`/o/${organizationSlug}`)
    return newClient
}
