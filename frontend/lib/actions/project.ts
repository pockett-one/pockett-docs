'use server'

import { prisma } from '@/lib/prisma'
import { createClient as createSupabaseClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreateProjectData {
    name: string
    description?: string
}

export async function createProject(organizationSlug: string, clientSlug: string, data: CreateProjectData) {
    const supabase = await createSupabaseClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // 1. Resolve Org & Check Permissions
    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: {
            id: true,
            members: {
                where: { userId: user.id },
                include: { role: true }
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

    if (membership.role.name === 'ORG_GUEST') {
        throw new Error('Insufficient permissions')
    }

    // 2. Resolve Client
    const client = await prisma.client.findFirst({
        where: {
            organizationId: organization.id,
            slug: clientSlug
        }
    })

    if (!client) {
        throw new Error('Client not found')
    }

    // 3. Check for duplicate Project Name
    const existingName = await prisma.project.findFirst({
        where: {
            clientId: client.id,
            name: {
                equals: data.name,
                mode: 'insensitive'
            }
        }
    })

    if (existingName) {
        throw new Error('A project with this name already exists for this client')
    }

    // 4. Generate Slug
    let slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    const existingSlug = await prisma.project.findUnique({
        where: {
            clientId_slug: {
                clientId: client.id,
                slug
            }
        }
    })

    if (existingSlug) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`
    }

    // 5. Create Project Record
    const newProject = await prisma.project.create({
        data: {
            organizationId: organization.id,
            clientId: client.id,
            name: data.name,
            slug: slug,
            description: data.description
        }
    })

    // 6. Create Drive Folder Structure
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

            // Note: We need clientName for ensureAppFolderStructure
            const result = await GoogleDriveConnector.getInstance().ensureAppFolderStructure(
                connector.id,
                client.name,
                newProject.name
            )

            // Update Project with Drive Folder ID
            if (result.projectId) {
                await prisma.project.update({
                    where: { id: newProject.id },
                    data: { driveFolderId: result.projectId }
                })
            }
        }
    } catch (e) {
        console.error("Failed to create Google Drive folder for project", e)
        // Don't fail the request, just log it. Folder can be created/synced later or manually.
    }

    revalidatePath(`/o/${organizationSlug}/c/${clientSlug}`)
    return newProject
}
