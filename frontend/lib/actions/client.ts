'use server'

import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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
                select: { role: true }
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

    // Only Owners/Members can add clients? (Guests should probably not)
    // For now, allow OWNER and MEMBER.
    if (membership.role === 'ORG_GUEST') {
        throw new Error('Insufficient permissions')
    }

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

    // 2. Generate Slug
    let slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    // Handle duplicates simply by appending random string if needed, 
    // or relying on unique constraint failure to retry (better UX is random suffix if collision)
    // For MVP, let's append a short random suffix to ensure uniqueness unless it's very clean.
    // Actually, clean slugs are better. Let's try clean first, if fail, we catch error?
    // Let's just append 4 random chars to guarantee uniqueness for now, or check existence.
    // Checking existence is better for clean URLs.

    const existing = await prisma.client.findUnique({
        where: {
            organizationId_slug: {
                organizationId: organization.id,
                slug
            }
        }
    })

    if (existing) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
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
