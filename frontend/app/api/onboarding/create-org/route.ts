import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { OrganizationService } from '@/lib/organization-service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = user.id
        const body = await request.json()
        const { connectionId, name, sandboxOnly, allowDomainAccess } = body

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
            allowDomainAccess: sandboxOnly ? false : (allowDomainAccess ?? true),
            sandboxOnly: !!sandboxOnly
        })

        // 2. Update connector with onboarding progress (fetch once, reuse below for Drive setup)
        let connector: { status: string; settings: unknown } | null = null
        if (connectionId) {
            connector = await (prisma as any).connector.findUnique({ where: { id: connectionId } })
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

        // 3. Google Drive folder creation + set default org in parallel where possible
        let finalOrgFolderId: string | null = null

        // Drive setup (must happen before JWT so orgFolderId is available)
        if (connectionId && connector && connector.status === 'ACTIVE') {
            try {
                const driveSettings = (connector.settings as any) || {}
                // Use parentFolderId (the user-selected Pockett Workspace folder) as the base for new org folders.
                // rootFolderId points to the .pockett metadata subfolder — using it would create org folders hidden inside .pockett.
                const driveRootFolderId = driveSettings.parentFolderId || driveSettings.rootFolderId || 'root'

                logger.info('Setting up Organization folder using unified service', {
                    orgName: organization.name,
                    rootFolderId: driveRootFolderId
                })

                const setupResult = await googleDriveConnector.setupOrgFolder(
                    connectionId,
                    driveRootFolderId,
                    organization.id,
                    userId
                )

                finalOrgFolderId = setupResult.orgId
                logger.info('Unified Drive setup complete', { orgFolderId: finalOrgFolderId })
            } catch (driveError) {
                logger.error('Failed to setup Drive folder structure', driveError as Error)
                // Drive folder creation is required for all org types — sandbox and custom alike.
                // A Sandbox org without Drive folders is just as broken as a custom org without them.
                return NextResponse.json(
                    { error: 'Failed to create Google Drive folder structure. Please check your Drive connection and try again.' },
                    { status: 500 }
                )
            }
        }

        // 4+5. Set default org (Sandbox/Import/Custom - later steps override) + JWT update + cache invalidation in parallel
        const adminClient = createAdminClient()
        await Promise.all([
            OrganizationService.setDefaultOrganization(userId, organization.id),
            adminClient.auth.admin.updateUserById(userId, {
                user_metadata: {
                    ...user.user_metadata,
                    active_org_id: organization.id,
                    active_org_slug: organization.slug,
                    active_persona: 'org_admin',
                },
                app_metadata: {
                    active_org_id: organization.id,
                    active_persona: 'org_admin'
                }
            }).then(() => {
                logger.info('JWT metadata injected during onboarding (create-org)', { userId, orgId: organization.id })
            }).catch((jwtError: Error) => {
                logger.error('Failed to inject JWT metadata during onboarding (create-org)', jwtError)
            }),
            invalidateUserSettingsPlus(userId),
        ])

        return NextResponse.json({
            success: true,
            organizationId: organization.id,
            organizationSlug: organization.slug,
            organizationName: organization.name,
            orgFolderId: finalOrgFolderId
        })
    } catch (error) {
        logger.error('Error creating organization (V2)', error as Error)
        const msg = error instanceof Error ? error.message : 'Failed to create organization'
        const isDbUnreachable = /can't reach database|P1001|connection refused/i.test(msg)
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
