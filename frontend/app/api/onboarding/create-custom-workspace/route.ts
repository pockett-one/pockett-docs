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

/**
 * Batched custom workspace creation: org + optional client + optional project in a single API call.
 * Matches Sandbox performance by reducing 3–4 HTTP round-trips to 1.
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
        const { connectionId, orgName, clientName, projectName, allowDomainAccess } = body

        if (!connectionId || !orgName?.trim()) {
            return NextResponse.json({ error: 'Missing connectionId or orgName' }, { status: 400 })
        }

        const name = orgName.trim()
        const hasClient = !!clientName?.trim()
        const hasProject = hasClient && !!projectName?.trim()

        logger.info('Creating custom workspace (batched)', { userId, connectionId, orgName: name, hasClient, hasProject })

        // Verify connector before creating org
        const connector = await (prisma as any).connector.findUnique({ where: { id: connectionId } })
        if (!connector || connector.status !== 'ACTIVE') {
            return NextResponse.json({ error: 'Connector not active' }, { status: 400 })
        }

        // 1. Create Org
        const organization = await OrganizationService.createOrganizationWithMember({
            userId,
            email: user.email || '',
            firstName: user.user_metadata?.first_name || '',
            lastName: user.user_metadata?.last_name || '',
            organizationName: name,
            connectorId: connectionId,
            allowDomainAccess: allowDomainAccess ?? true,
            sandboxOnly: false
        })

        if (connectionId) {
            const currentSettings = (connector.settings as any) || {}
            await (prisma as any).connector.update({
                where: { id: connectionId },
                data: {
                    settings: {
                        ...currentSettings,
                        onboarding: {
                            currentStep: 4,
                            isComplete: true,
                            driveConnected: true,
                            testOrgCreated: currentSettings.onboarding?.testOrgCreated ?? false,
                            orgsImported: [],
                            defaultOrgSlug: organization.slug,
                            lastUpdated: new Date().toISOString()
                        }
                    }
                }
            })
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
        let clientId: string | null = null

        // 2. Create Client (optional)
        if (hasClient) {
            const client = await ClientService.createClient({
                organizationId: orgId,
                name: clientName.trim(),
                creatorUserId: userId,
                sandboxOnly: false
            })
            clientId = client.id
            await googleDriveConnector.ensureAppFolderStructure(
                connectionIdVal,
                client.name,
                client.slug,
                await googleDriveConnector.createGoogleDriveAdapter(connectionIdVal),
                orgId
            )

            // 3. Create Project (optional)
            if (hasProject && clientId) {
                const { project, folderStructure } = await projectService.createProject(
                    orgId,
                    clientId,
                    projectName.trim(),
                    userId,
                    '',
                    false
                )

                if (folderStructure?.projectId) {
                    safeInngestSend('project.index.scan.requested', {
                        organizationId: orgId,
                        projectId: project.id,
                        connectorId: connectionIdVal,
                        rootFolderIds: [folderStructure.projectId],
                    }).catch((e: Error) => logger.warn('Failed to trigger indexing scan', e))
                }
            }
        }

        await invalidateUserSettingsPlus(userId)

        logger.info('Custom workspace created (batched)', { orgId, userId })

        return NextResponse.json({
            success: true,
            organizationId: orgId,
            organizationSlug: organization.slug,
            organizationName: organization.name,
        })
    } catch (error) {
        logger.error('Error creating custom workspace (batched)', error as Error)
        const msg = error instanceof Error ? error.message : 'Failed to create custom workspace'
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
