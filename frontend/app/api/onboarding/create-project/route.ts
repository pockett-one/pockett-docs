import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { projectService } from '@/lib/services/project.service'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { SampleFileService, DEFAULT_SAMPLE_FILES, SANDBOX_PROJECT_DATA } from '@/lib/services/sample-file-service'
import { createGoogleDriveAdapter } from '@/lib/connectors/adapters/google-drive-adapter'
import { safeInngestSend } from '@/lib/inngest/client'

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
        const { organizationId, clientId, name, sandboxOnly } = body

        if (!organizationId || !clientId || !name?.trim()) {
            return NextResponse.json({ error: 'Missing organizationId, clientId, or name' }, { status: 400 })
        }

        // Verify membership (V2)
        const membership = await (prisma as any).orgMember.findFirst({
            where: { userId: user.id, organizationId }
        })
        if (!membership) {
            return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 403 })
        }

        // 1. Create Project via projectService (Platform Schema)
        const project = await projectService.createProject(
            organizationId,
            clientId,
            name.trim(),
            user.id,
            '', // No description for now
            !!sandboxOnly
        )

        // 2. --- GOOGLE DRIVE FOLDER RESOLUTION & SETUP ---
        try {
            // Fetch client and organization in parallel (independent queries)
            const [clientRecord, organization] = await Promise.all([
                (prisma as any).client.findUnique({
                    where: { id: clientId },
                    select: { driveFolderId: true, organizationId: true, name: true, slug: true }
                }),
                (prisma as any).organization.findUnique({
                    where: { id: organizationId },
                    select: { connectorId: true }
                })
            ])

            if (clientRecord && organization?.connectorId) {
                const connectionId = organization.connectorId

                logger.info('Ensuring Drive folder structure for Project', { projectName: project.name, clientName: clientRecord.name })

                // Create adapter once and reuse for both ensureAppFolderStructure and sample files
                const adapter = await googleDriveConnector.createGoogleDriveAdapter(connectionId)

                const folderIds = await googleDriveConnector.ensureAppFolderStructure(
                    connectionId,
                    clientRecord.name,
                    clientRecord.slug,
                    adapter,
                    organizationId,
                    {
                        projectName: project.name,
                        projectSlug: project.slug
                    }
                )

                // Trigger Indexing Scan (fire-and-forget)
                safeInngestSend('project.index.scan.requested', {
                    organizationId,
                    projectId: project.id,
                    connectorId: connectionId,
                    rootFolderIds: [folderIds.projectId],
                }).catch((indexError: Error) => logger.warn('Failed to trigger indexing scan', indexError))

                // Create sample files in all subfolders in parallel
                if (sandboxOnly) {
                    const subfoldersMap: Array<{ subName: string; subId: string | null }> = [
                        { subName: 'General', subId: folderIds.generalFolderId || null },
                        { subName: 'Staging', subId: folderIds.stagingFolderId || null },
                        { subName: 'Confidential', subId: folderIds.confidentialFolderId || null },
                    ]

                    await Promise.all(
                        subfoldersMap
                            .filter(({ subId }) => !!subId)
                            .map(async ({ subName, subId }) => {
                                try {
                                    const structure = SANDBOX_PROJECT_DATA[name]?.[subName]
                                    if (structure) {
                                        await SampleFileService.createFolderStructure(adapter, connectionId, subId!, structure)
                                    } else if (DEFAULT_SAMPLE_FILES[subName]) {
                                        await SampleFileService.createSampleFiles(adapter, connectionId, subId!, DEFAULT_SAMPLE_FILES[subName])
                                    }
                                } catch (subError) {
                                    logger.error(`Failed to create sample structure for ${subName}`, subError as Error)
                                }
                            })
                    )
                }
            }
        } catch (error) {
            logger.error('Failed to ensure Drive folder structure for Project', error as Error)
        }
        // ------------------------------------

        logger.info('Project created during onboarding (V2)', { projectId: project.id, clientId, organizationId })

        // Invalidate cache
        await invalidateUserSettingsPlus(user.id)

        return NextResponse.json({
            success: true,
            projectId: project.id,
            projectSlug: project.slug,
            projectName: project.name
        })
    } catch (error) {
        logger.error('Error creating project during onboarding (V2)', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create project' },
            { status: 500 }
        )
    }
}
