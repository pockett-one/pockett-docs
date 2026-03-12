import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient } from '@supabase/supabase-js'
import { OrganizationService } from '@/lib/organization-service'
import { ClientService } from '@/lib/services/client.service'
import { projectService } from '@/lib/services/project.service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { googleDriveConnector } from '@/lib/google-drive-connector'
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
                user_metadata: {
                    ...user.user_metadata,
                    active_org_id: organization.id,
                    active_org_slug: organization.slug,
                    active_persona: 'org_admin',
                },
                app_metadata: { active_org_id: organization.id, active_persona: 'org_admin' }
            }).catch((e: Error) => logger.error('JWT metadata injection failed', e)),
            invalidateUserSettingsPlus(userId),
        ])

        const orgId = organization.id
        const connectionIdVal = connectionId
        const adapter = await googleDriveConnector.createGoogleDriveAdapter(connectionIdVal)

        // 2. Create clients sequentially to reduce connection pool pressure (avoids "Unable to start a transaction in the given time" on Supavisor)
        const clientResults: { client: Awaited<ReturnType<typeof ClientService.createClient>>; projects: typeof SANDBOX_HIERARCHY[0]['projects'] }[] = []
        for (const clientEntry of SANDBOX_HIERARCHY) {
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
            clientResults.push({ client, projects: clientEntry.projects })
        }

        // 3. Create projects sequentially (connector settings race). Sample files + indexing moved to Inngest to stay under 30s and avoid timeouts.
        const populatePayload: { projectId: string; projectName: string; rootFolderId: string; generalFolderId?: string; stagingFolderId?: string; confidentialFolderId?: string }[] = []
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
                    populatePayload.push({
                        projectId: project.id,
                        projectName: projectEntry.name,
                        rootFolderId: folderStructure.projectId,
                        generalFolderId: folderStructure.generalFolderId ?? undefined,
                        stagingFolderId: folderStructure.stagingFolderId ?? undefined,
                        confidentialFolderId: folderStructure.confidentialFolderId ?? undefined,
                    })
                }
            }
        }

        if (populatePayload.length > 0) {
            safeInngestSend('sandbox.populate.sample-files.requested', {
                organizationId: orgId,
                connectionId: connectionIdVal,
                projects: populatePayload,
            }).catch((e: Error) => logger.warn('Failed to trigger sandbox populate', e))
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
