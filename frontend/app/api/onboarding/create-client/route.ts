import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
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

        // Verify the user is a member of this organization
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: user.id, organizationId }
        })
        if (!membership) {
            return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 403 })
        }

        const slug =
            name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
            '-' + Math.random().toString(36).substring(2, 6)

        const client = await prisma.client.create({
            data: { name: name.trim(), slug, organizationId, sandboxOnly: !!sandboxOnly }
        })

        // Create ClientPersona and ClientMember for the user
        const clientAdminRbac = await prisma.rbacPersona.findFirst({
            where: { slug: 'client_admin' }
        })
        if (clientAdminRbac) {
            const clientPersona = await prisma.clientPersona.create({
                data: {
                    clientId: client.id,
                    rbacPersonaId: clientAdminRbac.id,
                    displayName: 'Client Partner'
                }
            })
            await prisma.clientMember.create({
                data: {
                    clientId: client.id,
                    userId: user.id,
                    clientPersonaId: clientPersona.id,
                    isDefault: true
                }
            })
        }

        // --- GOOGLE DRIVE FOLDER CREATION ---
        try {
            const orgConnectorSettings = await prisma.orgConnectorSettings.findUnique({
                where: { organizationId }
            })

            if (orgConnectorSettings?.orgFolderId && orgConnectorSettings?.connectorId) {
                const { googleDriveConnector } = require('@/lib/google-drive-connector')
                const accessToken = await googleDriveConnector.getAccessToken(orgConnectorSettings.connectorId)

                if (accessToken) {
                    logger.info('Creating Drive folder for Client', { clientName: client.name, parentFolderId: orgConnectorSettings.orgFolderId })
                    const folder = await googleDriveConnector.createDriveFile(accessToken, {
                        name: client.name.trim(),
                        mimeType: 'application/vnd.google-apps.folder',
                        parents: [orgConnectorSettings.orgFolderId]
                    })

                    if (folder?.id) {
                        logger.info('Client Drive folder created', { folderId: folder.id })
                        // Update client with folderId in settings
                        await prisma.client.update({
                            where: { id: client.id },
                            data: {
                                settings: {
                                    ...(client.settings as any || {}),
                                    driveFolderId: folder.id
                                }
                            }
                        })
                    }
                }
            }
        } catch (error) {
            logger.error('Failed to create Drive folder for Client', error as Error)
        }
        // ------------------------------------

        logger.info('Client created during onboarding', { clientId: client.id, organizationId })

        // Invalidate cache
        await invalidateUserSettingsPlus(user.id)

        return NextResponse.json({
            success: true,
            clientId: client.id,
            clientSlug: client.slug,
            clientName: client.name
        })
    } catch (error) {
        logger.error('Error creating client during onboarding', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create client' },
            { status: 500 }
        )
    }
}
