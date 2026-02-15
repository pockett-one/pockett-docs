import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'

// GET: List linked files for a connector
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const connectionId = searchParams.get('connectionId')

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        // Fetch linked files (Unique constraint ensures one per file)
        // Filter for isGrantRevoked: false to return only active grants
        const linkedFilesDb = await prisma.linkedFile.findMany({
            where: {
                connectorId: connectionId,
                isGrantRevoked: false
            },
            orderBy: { linkedAt: 'desc' }
        })

        if (linkedFilesDb.length === 0) {
            return NextResponse.json({ files: [] })
        }

        // Fetch real-time metadata for fileIds
        const fileIds = linkedFilesDb.map(f => f.fileId)

        const { googleDriveConnector } = await import('@/lib/google-drive-connector')
        const driveFiles = await googleDriveConnector.getFilesMetadata(connectionId, fileIds)
        const driveFileMap = new Map(driveFiles.map(f => [f.id, f]))

        // Merge DB data with Drive data
        const mergedFiles = linkedFilesDb.map(dbFile => {
            const driveFile = driveFileMap.get(dbFile.fileId)

            return {
                id: dbFile.fileId, // Use fileId as key for frontend actions
                fileId: dbFile.fileId,
                name: driveFile?.name || 'Unknown File',
                mimeType: driveFile?.mimeType || 'unknown',
                size: driveFile?.size ? driveFile.size.toString() : '0',
                linkedAt: dbFile.linkedAt,
                isGrantRevoked: dbFile.isGrantRevoked, // Return boolean flag
                webViewLink: driveFile?.webViewLink
            }
        })

        return NextResponse.json({ files: mergedFiles })
    } catch (error) {
        console.error('Fetch Linked Files Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE: "Revoke" access (Mutable Soft Delete via Update)
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, connectionId } = body // id here corresponds to fileId

        if (!id || !connectionId) {
            return NextResponse.json({ error: 'Missing file ID or connection ID' }, { status: 400 })
        }

        // Update existing record to REVOKED
        await prisma.linkedFile.update({
            where: {
                connectorId_fileId: {
                    connectorId: connectionId,
                    fileId: id
                }
            },
            data: {
                isGrantRevoked: true
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Revoke Linked File Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: List files or Create Folder in a Google Drive folder
export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Request
        const body = await request.json()
        const { action, folderId, projectId: bodyProjectId } = body

        console.log(`[API] linked-files POST action=${action} folderId=${folderId} projectId=${bodyProjectId ?? '(none)'}`)

        if (action === 'list') {
            if (!folderId) {
                return NextResponse.json({ error: 'Missing folderId' }, { status: 400 })
            }

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')
            type ProjectContext = {
                projectId: string
                generalFolderId: string | null
                confidentialFolderId: string | null
                personaName: string | null
                personaSlug?: string | null
            }

            let connector: { id: string; accessToken: string } | null = null
            let projectContext: ProjectContext | null = null

            // When projectId is provided, use the project's org connector and build context from project membership (proj_admin / proj_member see files)
            if (bodyProjectId) {
                const project = await prisma.project.findFirst({
                    where: { id: bodyProjectId, isDeleted: false },
                    include: {
                        client: {
                            include: {
                                organization: {
                                    include: {
                                        connectors: {
                                            where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' },
                                            take: 1
                                        }
                                    }
                                }
                            }
                        },
                        members: {
                            where: { userId: user.id },
                            include: {
                                persona: { include: { rbacPersona: { select: { slug: true } } } }
                            }
                        }
                    }
                })
                if (project) {
                    connector = project.client.organization.connectors[0] ?? null
                    if (connector) {
                        const folderIds = await googleDriveConnector.getProjectFolderIds(connector.id, project.slug)
                        const userMember = project.members[0]
                        const persona = userMember?.persona
                        projectContext = {
                            projectId: project.id,
                            generalFolderId: folderIds.generalFolderId,
                            confidentialFolderId: folderIds.confidentialFolderId,
                            personaName: persona?.displayName?.toLowerCase() ?? null,
                            personaSlug: persona?.rbacPersona?.slug ?? null
                        }
                    }
                }
            }

            // Fallback: user's default org connector and resolve project from folderId
            if (!connector) {
                const membership = await prisma.organizationMember.findFirst({
                    where: { userId: user.id },
                    orderBy: { isDefault: 'desc' },
                    include: {
                        organization: {
                            include: {
                                connectors: {
                                    where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' }
                                }
                            }
                        }
                    }
                })
                connector = membership?.organization.connectors[0] ?? null
            }

            if (!connector) {
                return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 })
            }

            // If we don't have projectContext yet (no bodyProjectId or project not found), resolve from folderId
            if (!projectContext) {
                const project = await prisma.project.findFirst({
                    where: { driveFolderId: folderId },
                    include: {
                        members: {
                            where: { userId: user.id },
                            include: {
                                persona: { include: { rbacPersona: { select: { slug: true } } } }
                            }
                        }
                    }
                })
                if (project) {
                    const folderIds = await googleDriveConnector.getProjectFolderIds(connector.id, project.slug)
                    const userMember = project.members[0]
                    const persona = userMember?.persona
                    projectContext = {
                        projectId: project.id,
                        generalFolderId: folderIds.generalFolderId,
                        confidentialFolderId: folderIds.confidentialFolderId,
                        personaName: persona?.displayName?.toLowerCase() ?? null,
                        personaSlug: persona?.rbacPersona?.slug ?? null
                    }
                } else {
                    try {
                        const fileMetadata = await googleDriveConnector.getFileMetadata(connector.id, folderId)
                        if (fileMetadata?.parents?.length) {
                            const parentFolderId = fileMetadata.parents[0]
                            const parentProject = await prisma.project.findFirst({
                                where: { driveFolderId: parentFolderId },
                                include: {
                                    members: {
                                        where: { userId: user.id },
                                        include: {
                                            persona: { include: { rbacPersona: { select: { slug: true } } } }
                                        }
                                    }
                                }
                            })
                            if (parentProject) {
                                const folderIds = await googleDriveConnector.getProjectFolderIds(connector.id, parentProject.slug)
                                const userMember = parentProject.members[0]
                                const persona = userMember?.persona
                                projectContext = {
                                    projectId: parentProject.id,
                                    generalFolderId: folderIds.generalFolderId,
                                    confidentialFolderId: folderIds.confidentialFolderId,
                                    personaName: persona?.displayName?.toLowerCase() ?? null,
                                    personaSlug: persona?.rbacPersona?.slug ?? null
                                }
                            }
                        }
                    } catch {
                        // continue without project context
                    }
                }
            }

            const userEmail = user.email || undefined
            const files = await googleDriveConnector.listFiles(
                connector.id,
                folderId,
                100,
                userEmail,
                projectContext
            )

            return NextResponse.json({ files })
        }

        if (action === 'create-folder') {
            const { name, mimeType } = body
            if (!folderId || !name) {
                return NextResponse.json({ error: 'Missing folderId or name' }, { status: 400 })
            }

            const membership = await prisma.organizationMember.findFirst({
                where: { userId: user.id },
                orderBy: { isDefault: 'desc' },
                include: {
                    organization: {
                        include: {
                            connectors: {
                                where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' }
                            }
                        }
                    }
                }
            })
            const connector = membership?.organization.connectors[0]
            if (!connector) return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 })

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')

            // Get decrypted access token (handles refresh if needed)
            const accessToken = await googleDriveConnector.getAccessToken(connector.id)
            if (!accessToken) {
                return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
            }

            const newFile = await googleDriveConnector.createDriveFile(accessToken, {
                name,
                mimeType: mimeType || 'application/vnd.google-apps.folder',
                parents: [folderId]
            })

            // Note: Files and folders inherit permissions from parent project folder automatically
            // No need to restrict them - they will inherit whatever permissions the project folder has
            // (which includes Project Lead & Team Member access if granted)

            return NextResponse.json(newFile)
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('Linked Files API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
