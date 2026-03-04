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
        const { organizationId, clientId, name, sandboxOnly } = body

        if (!organizationId || !clientId || !name?.trim()) {
            return NextResponse.json({ error: 'Missing organizationId, clientId, or name' }, { status: 400 })
        }

        // Verify the user is a member of this organization
        const membership = await prisma.organizationMember.findFirst({
            where: { userId: user.id, organizationId }
        })
        if (!membership) {
            logger.warn('Membership check failed in create-project', { userId: user.id, organizationId })
            return NextResponse.json({ error: 'Organization not found or access denied' }, { status: 403 })
        }

        // Verify the client belongs to this organization
        const clientRecord = await prisma.client.findFirst({
            where: { id: clientId, organizationId }
        })
        if (!clientRecord) {
            logger.warn('Client check failed in create-project', { clientId, organizationId })
            return NextResponse.json({ error: 'Client not found or access denied' }, { status: 403 })
        }

        const slug =
            name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
            '-' + Math.random().toString(36).substring(2, 6)

        const project = await prisma.project.create({
            data: { name: name.trim(), slug, clientId, organizationId, sandboxOnly: !!sandboxOnly }
        })

        // Create ProjectPersona and ProjectMember for the user
        const projAdminRbac = await prisma.rbacPersona.findFirst({
            where: { slug: 'proj_admin' }
        })
        if (projAdminRbac) {
            const { ensureProjectPersonasForProject } = await import('@/lib/actions/personas')
            await ensureProjectPersonasForProject(project.id)
            logger.info('Project personas ensured for new project', { projectId: project.id })

            const projectPersona = await prisma.projectPersona.findFirst({
                where: { projectId: project.id, rbacPersonaId: projAdminRbac.id }
            })
            if (projectPersona) {
                await prisma.projectMember.create({
                    data: {
                        projectId: project.id,
                        userId: user.id,
                        personaId: projectPersona.id
                    }
                })
                logger.info('Project member created for new project', {
                    projectId: project.id,
                    userId: user.id,
                    personaId: projectPersona.id,
                    personaSlug: projAdminRbac.slug
                })
            }
        }

        // --- GOOGLE DRIVE FOLDER CREATION ---
        try {
            const clientRecord = await prisma.client.findUnique({
                where: { id: clientId },
                select: { settings: true, organizationId: true }
            })

            const clientSettings = (clientRecord?.settings as any) || {}
            const clientFolderId = clientSettings.driveFolderId

            if (clientFolderId) {
                const orgConnectorSettings = await prisma.orgConnectorSettings.findUnique({
                    where: { organizationId: clientRecord!.organizationId }
                })

                if (orgConnectorSettings?.connectorId) {
                    const { googleDriveConnector } = require('@/lib/google-drive-connector')
                    const accessToken = await googleDriveConnector.getAccessToken(orgConnectorSettings.connectorId)

                    if (accessToken) {
                        logger.info('Creating Drive folder for Project', { projectName: project.name, parentFolderId: clientFolderId })
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
                            await prisma.project.update({
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
            logger.error('Failed to create Drive folder for Project', error as Error)
        }
        // ------------------------------------

        logger.info('Project created during onboarding', { projectId: project.id, clientId, organizationId })

        // Invalidate cache
        await invalidateUserSettingsPlus(user.id)

        return NextResponse.json({
            success: true,
            projectId: project.id,
            projectSlug: project.slug,
            projectName: project.name
        })
    } catch (error) {
        logger.error('Error creating project during onboarding', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create project' },
            { status: 500 }
        )
    }
}
