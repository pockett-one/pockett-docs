import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { OrganizationService } from '@/lib/organization-service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = user.id
        const body = await request.json()
        const { connectionId, name, sandboxOnly } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Missing organization name' }, { status: 400 })
        }

        logger.info('Creating organization (V2)', {
            userId,
            connectionId,
            newOrgName: name,
            sandboxOnly: !!sandboxOnly
        })

        // 1. Initial creation via OrganizationService (Platform Schema)
        const organization = await OrganizationService.createOrganizationWithMember({
            userId,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            organizationName: name.trim(),
            connectorId: connectionId,
            allowDomainAccess: false, // Default for onboarding
            sandboxOnly: !!sandboxOnly
        })

        // 2. Update connector with onboarding progress
        if (connectionId) {
            const connector = await (prisma as any).connector.findUnique({ where: { id: connectionId } })
            if (connector) {
                const currentSettings = (connector.settings as any) || {}
                await (prisma as any).connector.update({
                    where: { id: connectionId },
                    data: {
                        settings: {
                            ...currentSettings,
                            onboarding: {
                                currentStep: !!sandboxOnly ? 3 : 4,
                                isComplete: !sandboxOnly,
                                driveConnected: true,
                                testOrgCreated: !!sandboxOnly,
                                orgsImported: [],
                                defaultOrgSlug: '',
                                lastUpdated: new Date().toISOString()
                            }
                        }
                    }
                })
            }
        }

        // 3. Set this organization as default
        await OrganizationService.setDefaultOrganization(userId, organization.id)

        // 4. --- GOOGLE DRIVE FOLDER CREATION ---
        let finalOrgFolderId: string | null = null
        if (connectionId) {
            try {
                const { googleDriveConnector } = require('@/lib/google-drive-connector')
                const connectorForDrive = await (prisma as any).connector.findUnique({
                    where: { id: connectionId }
                })

                if (connectorForDrive && connectorForDrive.status === 'ACTIVE') {
                    const driveSettings = (connectorForDrive.settings as any) || {}
                    const driveRootFolderId = driveSettings.rootFolderId || 'root'

                    const accessToken = await googleDriveConnector.getAccessToken(connectorForDrive.id)
                    if (accessToken) {
                        logger.info('Creating Drive folder for Organization', { orgName: organization.name, rootFolderId: driveRootFolderId })
                        const folder = await googleDriveConnector.createDriveFile(accessToken, {
                            name: organization.name.trim(),
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [driveRootFolderId]
                        })

                        if (folder?.id) {
                            finalOrgFolderId = folder.id
                            logger.info('Drive folder created successfully', { folderId: folder.id })

                            // Update the Organization with the folder ID
                            await (prisma as any).organization.update({
                                where: { id: organization.id },
                                data: { orgFolderId: folder.id }
                            })
                        }
                    }
                }
            } catch (driveError) {
                logger.error('Failed to create Drive folder for Organization', driveError as Error)
            }
        }

        // Invalidate cache
        await invalidateUserSettingsPlus(userId)

        return NextResponse.json({
            success: true,
            organizationId: organization.id,
            organizationSlug: organization.slug,
            organizationName: organization.name,
            orgFolderId: finalOrgFolderId
        })
    } catch (error) {
        logger.error('Error creating organization (V2)', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create organization' },
            { status: 500 }
        )
    }
}
