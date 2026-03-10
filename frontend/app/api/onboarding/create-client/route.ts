import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { ClientService } from '@/lib/services/client.service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { googleDriveConnector } from '@/lib/google-drive-connector'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
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

        // 2. --- GOOGLE DRIVE FOLDER CREATION (The Better Way: Unified Service) ---
        try {
            // Check Organization for Drive folder info
            const organization = await (prisma as any).organization.findUnique({
                where: { id: organizationId },
                select: { connectorId: true }
            })

            if (organization?.connectorId) {
                logger.info('Ensuring Drive folder structure for Client', { clientName: client.name, orgId: organizationId })

                // ensureAppFolderStructure handles:
                // 1. Finding/creating client folder
                // 2. Writing .pockett/meta.json (type: client)
                // 3. Updating connector.settings
                // 4. Updating client.driveFolderId in DB
                await googleDriveConnector.ensureAppFolderStructure(
                    organization.connectorId,
                    client.name,
                    client.slug,
                    await googleDriveConnector.createGoogleDriveAdapter(organization.connectorId),
                    organizationId
                )

                logger.info('Client Drive setup complete')
            }
        } catch (error) {
            logger.error('Failed to setup Drive folder for Client', error as Error)
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
