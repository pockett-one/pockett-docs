import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ClientService } from '@/lib/services/client.service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { organizationId, name, sandboxOnly } = body

        if (!organizationId || !name?.trim()) {
            return NextResponse.json({ error: 'Missing organizationId or name' }, { status: 400 })
        }

        // Verify the user is a member of this organization (V2)
        const membership = await (prisma as any).orgMember.findFirst({
            where: { userId: user.id, organizationId }
        })
        if (!membership) {
            return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 403 })
        }

        // 1. Create Client via ClientService (Platform Schema)
        const client = await ClientService.createClient({
            organizationId,
            name: name.trim(),
            creatorUserId: user.id,
            sandboxOnly: !!sandboxOnly
        })

        // 2. --- GOOGLE DRIVE FOLDER CREATION ---
        try {
            // Check Organization for Drive folder info
            const organization = await (prisma as any).organization.findUnique({
                where: { id: organizationId },
                select: { orgFolderId: true, connectorId: true }
            })

            if (organization?.orgFolderId && organization?.connectorId) {
                const { googleDriveConnector } = require('@/lib/google-drive-connector')
                const accessToken = await googleDriveConnector.getAccessToken(organization.connectorId)

                if (accessToken) {
                    logger.info('Creating Drive folder for Client', { clientName: client.name, parentFolderId: organization.orgFolderId })
                    const folder = await googleDriveConnector.createDriveFile(accessToken, {
                        name: client.name.trim(),
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [organization.orgFolderId]
                    })

                    if (folder?.id) {
                        logger.info('Client Drive folder created', { folderId: folder.id })
                        // Update client with driveFolderId directly in column
                        await (prisma as any).client.update({
                            where: { id: client.id },
                            data: {
                                driveFolderId: folder.id,
                                settings: {
                                    ...(client.settings as any || {}),
                                    driveFolderId: folder.id // Sync to settings for legacy compatibility
                                }
                            }
                        })
                    }
                }
            }
        } catch (error) {
            logger.error('Failed to create Drive folder for Client (V2)', error as Error)
        }
        // ------------------------------------

        logger.info('Client created during onboarding (V2)', { clientId: client.id, organizationId })

        // Invalidate cache
        await invalidateUserSettingsPlus(user.id)

        return NextResponse.json({
            success: true,
            clientId: client.id,
            clientSlug: client.slug,
            clientName: client.name
        })
    } catch (error) {
        logger.error('Error creating client during onboarding (V2)', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create client' },
            { status: 500 }
        )
    }
}
