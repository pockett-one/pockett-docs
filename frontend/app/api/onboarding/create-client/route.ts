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
        const { firmId, organizationId, name, sandboxOnly } = body
        const resolvedFirmId = (firmId || organizationId) as string | undefined

        if (!resolvedFirmId || !name?.trim()) {
            return NextResponse.json({ error: 'Missing firmId (or organizationId) or name' }, { status: 400 })
        }

        // Verify the user is a member of this firm (V2)
        const membership = await (prisma as any).firmMember.findFirst({
            where: { userId: user.id, firmId: resolvedFirmId }
        })
        if (!membership) {
            return NextResponse.json({ error: 'Firm not found or access denied' }, { status: 403 })
        }

        // 1. Create Client via ClientService (Platform Schema)
        const client = await ClientService.createClient({
            firmId: resolvedFirmId,
            name: name.trim(),
            creatorUserId: user.id,
            sandboxOnly: !!sandboxOnly
        })

        // 2. --- GOOGLE DRIVE FOLDER CREATION (The Better Way: Unified Service) ---
        try {
            // Check Firm for Drive folder info
            const firm = await (prisma as any).firm.findUnique({
                where: { id: resolvedFirmId },
                select: { connectorId: true }
            })

            if (firm?.connectorId) {
                logger.info('Ensuring Drive folder structure for Client', { clientName: client.name, firmId: resolvedFirmId })

                // ensureAppFolderStructure handles:
                // 1. Finding/creating client folder
                // 2. Writing .pockett/meta.json (type: client)
                // 3. Updating connector.settings
                // 4. Updating client.driveFolderId in DB
                await googleDriveConnector.ensureAppFolderStructure(
                    firm.connectorId,
                    client.name,
                    client.slug,
                    await googleDriveConnector.createGoogleDriveAdapter(firm.connectorId),
                    resolvedFirmId
                )

                logger.info('Client Drive setup complete')
            }
        } catch (error) {
            logger.error('Failed to setup Drive folder for Client', error as Error)
        }
        // ------------------------------------

        logger.info('Client created during onboarding (V2)', { clientId: client.id, firmId: resolvedFirmId })

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
        const msg = error instanceof Error ? error.message : 'Failed to create client'
        const isDbUnreachable = /can't reach database|P1001|connection refused|could not get access token/i.test(msg)
        return NextResponse.json(
            {
                error: isDbUnreachable
                    ? 'Database is unreachable. For local dev, run supabase start and ensure DATABASE_URL is set.'
                    : msg
            },
            { status: 500 }
        )
    }
}
