import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { projectService } from '@/lib/services/project.service'
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
            '' // No description for now
        )

        // 2. --- GOOGLE DRIVE FOLDER CREATION ---
        try {
            const clientRecord = await (prisma as any).client.findUnique({
                where: { id: clientId },
                select: { driveFolderId: true, organizationId: true }
            })

            const clientFolderId = clientRecord?.driveFolderId

            if (clientFolderId) {
                // Get Connector from Organization
                const organization = await (prisma as any).organization.findUnique({
                    where: { id: organizationId },
                    select: { connectorId: true }
                })

                if (organization?.connectorId) {
                    const { googleDriveConnector } = require('@/lib/google-drive-connector')
                    const accessToken = await googleDriveConnector.getAccessToken(organization.connectorId)

                    if (accessToken) {
                        logger.info('Creating Drive folder for Project (V2)', { projectName: project.name, parentFolderId: clientFolderId })
                        const folder = await googleDriveConnector.createDriveFile(accessToken, {
                            name: project.name.trim(),
                            mimeType: 'application/vnd.google-apps.folder',
                            parents: [clientFolderId],
                            appProperties: {
                                pockettType: 'PROJECT',
                                projectSlug: project.slug
                            }
                        })

                        if (folder?.id) {
                            logger.info('Project Drive folder created', { folderId: folder.id })
                            await (prisma as any).project.update({
                                where: { id: project.id },
                                data: { connectorRootFolderId: folder.id }
                            })

                            // Create subfolders: General, Staging, Confidential
                            const subfolders = ['General', 'Staging', 'Confidential']
                            for (const subName of subfolders) {
                                try {
                                    await googleDriveConnector.createDriveFile(accessToken, {
                                        name: subName,
                                        mimeType: 'application/vnd.google-apps.folder',
                                        parents: [folder.id],
                                        appProperties: {
                                            pockettType: 'POCKETT_INTERNAL',
                                            pockettFolderType: subName.toUpperCase()
                                        }
                                    })
                                } catch (subError) {
                                    logger.error(`Failed to create subfolder ${subName}`, subError as Error)
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            logger.error('Failed to create Drive folder for Project (V2)', error as Error)
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
