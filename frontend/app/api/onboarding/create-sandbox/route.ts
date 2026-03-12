import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { OrganizationService } from '@/lib/organization-service'
import { ClientService } from '@/lib/services/client.service'
import { projectService } from '@/lib/services/project.service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { SampleFileService, DEFAULT_SAMPLE_FILES, SANDBOX_PROJECT_DATA } from '@/lib/services/sample-file-service-server'
import { createAdminClient } from '@/utils/supabase/admin'
import { safeInngestSend } from '@/lib/inngest/client'
import { SANDBOX_HIERARCHY } from '@/lib/services/sample-file-service'

/**
 * Batched sandbox creation: org + all clients + all projects in a single API call.
 * Reduces 15 HTTP round-trips to 1. Clients created in parallel, projects sequentially
 * (connector settings updates require sequential to avoid race conditions).
 */
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
        const { connectionId, sandboxOrgName } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        const name = (sandboxOrgName || '').trim() || 'Pockett Inc.'
        logger.info('Creating sandbox (batched)', { userId, connectionId, sandboxOrgName: name })

        // 1. Create Sandbox Org (same logic as create-org)
        const organization = await OrganizationService.createOrganizationWithMember({
            userId,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            organizationName: name,
            connectorId: connectionId,
            allowDomainAccess: false,
            sandboxOnly: true
        })

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
                                currentStep: 3,
                                isComplete: false,
                                driveConnected: true,
                                testOrgCreated: true,
                                orgsImported: [],
                                defaultOrgSlug: '',
                                lastUpdated: new Date().toISOString()
                            }
                        }
                    }
                })
            }
        }

        if (!connectionId || !connector || connector.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Connector not active' }, { status: 400 })
        }

        const driveSettings = (connector.settings as any) || {}
        const driveRootFolderId = driveSettings.parentFolderId || driveSettings.rootFolderId || 'root'

        const setupResult = await googleDriveConnector.setupOrgFolder(
            connectionId,
            driveRootFolderId,
            organization.id,
            userId
        )
        if (!setupResult.orgId) {
            return NextResponse.json(
                { error: 'Failed to create Google Drive folder structure' },
                { status: 500 }
            )
        }

        await Promise.all([
            OrganizationService.setDefaultOrganization(userId, organization.id),
            createAdminClient().auth.admin.updateUserById(userId, {
                app_metadata: { active_org_id: organization.id, active_persona: 'org_admin' }
            }).catch((e: Error) => logger.error('JWT metadata injection failed', e)),
            invalidateUserSettingsPlus(userId),
        ])

        const orgId = organization.id
        const connectionIdVal = connectionId
        const adapter = await googleDriveConnector.createGoogleDriveAdapter(connectionIdVal)

        // 2. Create clients in parallel
        const clientResults = await Promise.all(
            SANDBOX_HIERARCHY.map(async (clientEntry) => {
                const client = await ClientService.createClient({
                    organizationId: orgId,
                    name: clientEntry.clientName,
                    creatorUserId: userId,
                    sandboxOnly: true
                })
                await googleDriveConnector.ensureAppFolderStructure(
                    connectionIdVal,
                    client.name,
                    client.slug,
                    adapter,
                    orgId
                )
                return { client, projects: clientEntry.projects }
            })
        )

        // 3. Create projects sequentially (connector settings race) + sample files
        for (const { client, projects } of clientResults) {
            for (const projectEntry of projects) {
                const { project, folderStructure } = await projectService.createProject(
                    orgId,
                    client.id,
                    projectEntry.name,
                    userId,
                    '',
                    true
                )

                if (folderStructure?.projectId) {
                    safeInngestSend('project.index.scan.requested', {
                        organizationId: orgId,
                        projectId: project.id,
                        connectorId: connectionIdVal,
                        rootFolderIds: [folderStructure.projectId],
                    }).catch((e: Error) => logger.warn('Failed to trigger indexing scan', e))
                }

                if (folderStructure && (folderStructure.generalFolderId || folderStructure.stagingFolderId || folderStructure.confidentialFolderId)) {
                    const subfoldersMap = [
                        { subName: 'General' as const, subId: folderStructure.generalFolderId || null },
                        { subName: 'Staging' as const, subId: folderStructure.stagingFolderId || null },
                        { subName: 'Confidential' as const, subId: folderStructure.confidentialFolderId || null },
                    ]
                    await Promise.all(
                        subfoldersMap
                            .filter((s): s is { subName: 'General' | 'Staging' | 'Confidential'; subId: string } => !!s.subId)
                            .map(async ({ subName, subId }) => {
                                try {
                                    const structure = SANDBOX_PROJECT_DATA[projectEntry.name]?.[subName]
                                    if (structure) {
                                        await SampleFileService.createFolderStructure(adapter, connectionIdVal, subId, structure)
                                    } else if (DEFAULT_SAMPLE_FILES[subName]) {
                                        await SampleFileService.createSampleFiles(adapter, connectionIdVal, subId, DEFAULT_SAMPLE_FILES[subName])
                                    }
                                } catch (e) {
                                    logger.error(`Failed to create sample structure for ${subName}`, e as Error)
                                }
                            })
                    )
                }
            }
        }

        await invalidateUserSettingsPlus(userId)

        logger.info('Sandbox created (batched)', { orgId, userId })

        return NextResponse.json({
            success: true,
            organizationId: orgId,
            organizationSlug: organization.slug,
            organizationName: organization.name,
        })
    } catch (error) {
        logger.error('Error creating sandbox (batched)', error as Error)
        const msg = error instanceof Error ? error.message : 'Failed to create sandbox'
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
