import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { createTestOrganization } from '@/lib/services/test-org-generator'
import { createGoogleDriveAdapter } from '@/lib/connectors/adapters/google-drive-adapter'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'
import { ensureProjectPersonasForProject } from '@/lib/actions/personas'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'

export async function POST(request: NextRequest) {
    try {
        // Get user from authorization header
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
        const { connectionId, organizationId } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        if (!organizationId) {
            return NextResponse.json({ error: 'Missing organizationId' }, { status: 400 })
        }

        logger.info('Creating test data', { userId, connectionId, organizationId })

        const prisma = new PrismaClient()

        try {
            // Verify organization exists and user has access
            const organization = await prisma.organization.findFirst({
                where: {
                    id: organizationId,
                    members: {
                        some: {
                            userId: userId,
                        },
                    },
                },
            })

            if (!organization) {
                return NextResponse.json(
                    { error: 'Organization not found or access denied' },
                    { status: 404 }
                )
            }

            // Create adapter for Google Drive
            const adapter = createGoogleDriveAdapter(async () => {
                const token = await googleDriveConnector.getAccessToken(connectionId)
                if (!token) throw new Error('Could not get access token')
                return token
            })

            // Create test organization in Google Drive
            const testOrgResult = await createTestOrganization(
                adapter,
                connectionId,
                'root' // parent folder is root
            )

            // Create test client in database under the real organization
            const testClient = await prisma.client.create({
                data: {
                    name: 'Sample Client',
                    slug: 'sample-client-' + Math.random().toString(36).substring(2, 6),
                    organizationId: organizationId,
                    settings: {
                        connectorRootFolderId: testOrgResult.clientFolderId
                    }
                },
            })

            // Create test projects under the test client linking to generated folders
            const testProjects = await Promise.all(testOrgResult.projects.map(async (p) => {
                const projectSlug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.random().toString(36).substring(2, 6);
                const project = await prisma.project.create({
                    data: {
                        name: p.name,
                        slug: projectSlug,
                        clientId: testClient.id,
                        organizationId: organizationId,
                        connectorRootFolderId: p.folderId,
                    },
                });

                // 1. Ensure project personas exist (replicated from RBAC)
                await ensureProjectPersonasForProject(project.id);

                // 2. Add user as Project Lead (proj_admin)
                const projAdminRbacPersona = await prisma.rbacPersona.findUnique({
                    where: { slug: 'proj_admin' }
                });

                if (projAdminRbacPersona) {
                    const projectLeadPersona = await prisma.projectPersona.findFirst({
                        where: {
                            projectId: project.id,
                            rbacPersonaId: projAdminRbacPersona.id
                        }
                    });

                    if (projectLeadPersona) {
                        await prisma.projectMember.create({
                            data: {
                                projectId: project.id,
                                userId: userId,
                                personaId: projectLeadPersona.id
                            }
                        });
                    }
                }

                return project;
            }))

            // Invalidate permissions cache for the user immediately
            await invalidateUserSettingsPlus(userId);

            logger.info('Test data created', {
                orgName: testOrgResult.orgName,
                clientName: testOrgResult.clientName,
                clientId: testClient.id,
                projectIds: testProjects.map(p => p.id),
                totalFiles: testOrgResult.totalFiles
            })

            return NextResponse.json({
                success: true,
                clientId: testClient.id,
                projectIds: testProjects.map(p => p.id),
                orgName: testOrgResult.orgName,
                clientName: testOrgResult.clientName,
                orgFolderId: testOrgResult.orgFolderId,
                clientFolderId: testOrgResult.clientFolderId,
                projects: testOrgResult.projects,
                totalFiles: testOrgResult.totalFiles
            })
        } finally {
            await prisma.$disconnect()
        }
    } catch (error) {
        logger.error('Error creating test organization', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to create test organization' },
            { status: 500 }
        )
    }
}
