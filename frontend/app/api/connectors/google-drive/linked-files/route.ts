import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { getViewAsPersonaFromCookie } from '@/lib/view-as-server'
import { canAccessRbacAdmin } from '@/lib/permission-helpers'
import { getSharedAndAncestorIdsForPersona, isFolderUnderSharedFolder } from '@/lib/project-sharing-ids'
import { safeInngestSend } from '@/lib/inngest/client'
import { logger } from '@/lib/logger'

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
        const linkedFilesDb = await prisma.connectorLinkedFile.findMany({
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
        await prisma.connectorLinkedFile.update({
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

        // Remove from project search index
        // We look up the organizationId from the organization that owns this connector
        const connector = await prisma.connector.findUnique({
            where: { id: connectionId }
        })
        if (connector) {
            const org = await prisma.organization.findFirst({
                where: { connectorId: connector.id }
            })
            if (org) {
                await safeInngestSend('file.delete.requested', {
                    organizationId: org.id,
                    externalId: id
                })
            }
        }

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
            (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Request (guard against empty or invalid JSON)
        let body: Record<string, unknown> = {}
        try {
            const text = await request.text()
            body = text ? JSON.parse(text) : {}
        } catch {
            return NextResponse.json({ error: 'Invalid or empty JSON body' }, { status: 400 })
        }
        const { action, folderId, projectId: bodyProjectId, viewAsPersonaSlug: bodyViewAs, pageSize: bodyPageSize } = body

        console.log(`[API] linked-files POST action=${action} folderId=${folderId} projectId=${bodyProjectId ?? '(none)'}`)

        if (action === 'list') {
            if (typeof folderId !== 'string' || !folderId) {
                return NextResponse.json({ error: 'Missing folderId' }, { status: 400 })
            }

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')
            type ProjectContext = {
                projectId: string
                clientId: string | null
                generalFolderId: string | null
                confidentialFolderId: string | null
                personaName: string | null
                personaSlug?: string | null
                organizationId?: string | null
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
                                        connector: true
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
                    connector = project.client.organization.connector ?? null
                    if (connector) {
                        const folderIds = await googleDriveConnector.getProjectFolderIds(connector.id, project.slug, {
                            projectName: project.name,
                            clientSlug: project.client.slug,
                            clientName: project.client.name,
                            projectFolderId: project.connectorRootFolderId
                        })
                        const userMember = project.members[0]
                        const persona = userMember?.persona
                        projectContext = {
                            projectId: project.id,
                            clientId: project.clientId,
                            generalFolderId: folderIds.generalFolderId,
                            confidentialFolderId: folderIds.confidentialFolderId,
                            personaName: persona?.displayName?.toLowerCase() ?? null,
                            personaSlug: persona?.rbacPersona?.slug ?? null,
                            organizationId: project.organizationId
                        }
                    }
                }
            }

            // Fallback: search across all RELATIONSHIPS (Org, Client, Project) for an active connector
            if (!connector) {
                const orgMemberships = await prisma.organizationMember.findMany({
                    where: { userId: user.id },
                    select: { organizationId: true, isDefault: true }
                })

                const clientMemberships = await prisma.clientMember.findMany({
                    where: { userId: user.id },
                    include: { client: { select: { organizationId: true } } }
                })

                const projectMemberships = await prisma.projectMember.findMany({
                    where: { userId: user.id },
                    include: { project: { select: { organizationId: true } } }
                })

                const allOrgIds = Array.from(new Set([
                    ...orgMemberships.map(m => m.organizationId),
                    ...clientMemberships.map(m => m.client.organizationId),
                    ...projectMemberships.map(m => m.project.organizationId)
                ]))

                // Find organizations with active GOOGLE_DRIVE connectors
                const orgsWithConnectors = await prisma.organization.findMany({
                    where: {
                        id: { in: allOrgIds },
                        connector: {
                            type: 'GOOGLE_DRIVE',
                            status: 'ACTIVE'
                        }
                    },
                    include: { connector: true }
                })

                // Prioritize connector from default membership if it exists
                const defaultOrgId = orgMemberships.find(m => m.isDefault)?.organizationId
                if (defaultOrgId) {
                    const defaultOrgWithConnector = orgsWithConnectors.find(o => o.id === defaultOrgId)
                    connector = defaultOrgWithConnector?.connector ?? orgsWithConnectors[0]?.connector ?? null
                } else {
                    connector = orgsWithConnectors[0]?.connector ?? null
                }
                logger.debug('[API] linked-files: Fallback connector search complete', {
                    found: !!connector,
                    orgsWithConnectorsCount: orgsWithConnectors.length,
                    defaultOrgId,
                    resolvedConnectorId: connector?.id
                })
            }

            if (!connector) {
                return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 })
            }

            // If we don't have projectContext yet (no bodyProjectId or project not found), resolve from folderId
            if (!projectContext) {
                const project = await prisma.project.findFirst({
                    where: { connectorRootFolderId: folderId },
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
                        clientId: project.clientId,
                        generalFolderId: folderIds.generalFolderId,
                        confidentialFolderId: folderIds.confidentialFolderId,
                        personaName: persona?.displayName?.toLowerCase() ?? null,
                        personaSlug: persona?.rbacPersona?.slug ?? null,
                        organizationId: project.organizationId
                    }
                } else {
                    try {
                        const fileMetadata = await googleDriveConnector.getFileMetadata(connector.id, folderId)
                        if (fileMetadata?.parents?.length) {
                            const parentFolderId = fileMetadata.parents[0]
                            const parentProject = await prisma.project.findFirst({
                                where: { connectorRootFolderId: parentFolderId },
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
                                    clientId: parentProject.clientId,
                                    generalFolderId: folderIds.generalFolderId,
                                    confidentialFolderId: folderIds.confidentialFolderId,
                                    personaName: persona?.displayName?.toLowerCase() ?? null,
                                    personaSlug: persona?.rbacPersona?.slug ?? null,
                                    organizationId: parentProject.organizationId
                                }
                            }
                        }
                    } catch {
                        // continue without project context
                    }
                }
            }

            const userEmail = user.email || undefined
            const listLimit = typeof bodyPageSize === 'number' && bodyPageSize > 0 ? Math.min(500, bodyPageSize) : 100
            logger.debug('[API] linked-files: Calling listFiles', {
                connectorId: connector.id,
                folderId,
                listLimit,
                hasProjectContext: !!projectContext
            })
            let files = await googleDriveConnector.listFiles(
                connector.id,
                folderId,
                listLimit,
                userEmail,
                projectContext
            )
            logger.debug('[API] linked-files: listFiles returned', { count: files.length })

            // When projectId is set, filter to shared-only when viewing as or actually being EC/Guest.
            // Prefer body viewAsPersonaSlug (from frontend View As) when user has RBAC admin, so filtering works even if cookie isn't sent/read.
            if (bodyProjectId) {
                const cookieViewAs = await getViewAsPersonaFromCookie()
                const canUseViewAs = await canAccessRbacAdmin(user.id)
                const viewAsSlug = (canUseViewAs && (bodyViewAs === 'proj_ext_collaborator' || bodyViewAs === 'proj_guest') ? bodyViewAs : null) ?? (canUseViewAs && cookieViewAs ? cookieViewAs : null)
                const personaSlugToFilter =
                    viewAsSlug === 'proj_ext_collaborator' || viewAsSlug === 'proj_guest'
                        ? viewAsSlug
                        : (projectContext?.personaSlug === 'proj_ext_collaborator' || projectContext?.personaSlug === 'proj_guest')
                            ? projectContext.personaSlug
                            : null
                if (personaSlugToFilter && projectContext) {
                    const { sharedIds, ancestorIds } = await getSharedAndAncestorIdsForPersona(projectContext.projectId, personaSlugToFilter, { skipDescendants: true })
                    const allowSet = new Set([...sharedIds, ...ancestorIds])
                    const folderInShared = sharedIds.includes(folderId)
                    const folderUnderShared = !folderInShared && sharedIds.length > 0 && await isFolderUnderSharedFolder(folderId, sharedIds, connector.id, googleDriveConnector)
                    if (!folderInShared && !folderUnderShared) {
                        files = files.filter((f: { id: string }) => allowSet.has(f.id))
                    }
                    // If folder listing returned nothing but we have shared docs, fetch them so Files tab shows shared items (e.g. list was filtered by Drive permissions or folder doesn't contain ancestors)
                    if (files.length === 0 && sharedIds.length > 0) {
                        const sharedMeta = await googleDriveConnector.getFilesMetadata(connector.id, sharedIds)
                        files = sharedMeta.filter((f: { id?: string }) => f?.id) as typeof files
                    }
                }
            }

            // When projectId is set, filter to shared-only when viewing as or actually being EC/Guest.
            // Prefer body viewAsPersonaSlug (from frontend View As) when user has RBAC admin, so filtering works even if cookie isn't sent/read.
            if (bodyProjectId) {
                const cookieViewAs = await getViewAsPersonaFromCookie()
                const canUseViewAs = await canAccessRbacAdmin(user.id)
                const viewAsSlug = (canUseViewAs && (bodyViewAs === 'proj_ext_collaborator' || bodyViewAs === 'proj_guest') ? bodyViewAs : null) ?? (canUseViewAs && cookieViewAs ? cookieViewAs : null)
                const personaSlugToFilter =
                    viewAsSlug === 'proj_ext_collaborator' || viewAsSlug === 'proj_guest'
                        ? viewAsSlug
                        : (projectContext?.personaSlug === 'proj_ext_collaborator' || projectContext?.personaSlug === 'proj_guest')
                            ? projectContext.personaSlug
                            : null
                if (personaSlugToFilter && projectContext) {
                    const { sharedIds, ancestorIds } = await getSharedAndAncestorIdsForPersona(projectContext.projectId, personaSlugToFilter, { skipDescendants: true })
                    const allowSet = new Set([...sharedIds, ...ancestorIds])
                    const folderInShared = sharedIds.includes(folderId)
                    const folderUnderShared = !folderInShared && sharedIds.length > 0 && await isFolderUnderSharedFolder(folderId, sharedIds, connector.id, googleDriveConnector)
                    if (!folderInShared && !folderUnderShared) {
                        files = files.filter((f: { id: string }) => allowSet.has(f.id))
                    }
                    // If folder listing returned nothing but we have shared docs, fetch them so Files tab shows shared items (e.g. list was filtered by Drive permissions or folder doesn't contain ancestors)
                    if (files.length === 0 && sharedIds.length > 0) {
                        const sharedMeta = await googleDriveConnector.getFilesMetadata(connector.id, sharedIds)
                        files = sharedMeta.filter((f: { id?: string }) => f?.id) as typeof files
                    }
                }
            }

            return NextResponse.json({ files })
        }

        if (action === 'create-folder') {
            const { name, mimeType } = body
            if (typeof folderId !== 'string' || !folderId || typeof name !== 'string' || !name) {
                return NextResponse.json({ error: 'Missing folderId or name' }, { status: 400 })
            }

            const membership = await prisma.organizationMember.findFirst({
                where: { userId: user.id },
                orderBy: { isDefault: 'desc' },
                include: {
                    organization: {
                        include: {
                            connector: true
                        }
                    }
                }
            })
            const connector = membership?.organization.connector
            if (!connector) return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 })

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')

            // Get decrypted access token (handles refresh if needed)
            const accessToken = await googleDriveConnector.getAccessToken(connector.id)
            if (!accessToken) {
                return NextResponse.json({ error: 'Failed to get access token' }, { status: 500 })
            }

            const mimeTypeStr = typeof mimeType === 'string' ? mimeType : 'application/vnd.google-apps.folder'
            const newFile = await googleDriveConnector.createDriveFile(accessToken, {
                name,
                mimeType: mimeTypeStr,
                parents: [folderId]
            })

            // Note: Files and folders inherit permissions from parent project folder automatically
            // No need to restrict them - they will inherit whatever permissions the project folder has
            // (which includes Project Lead & Team Member access if granted)

            // Index the newly created folder
            if (newFile && typeof newFile === 'object' && 'id' in newFile) {
                // Resolve context for indexing
                let project = await prisma.project.findFirst({
                    where: { connectorRootFolderId: folderId },
                    select: { id: true, clientId: true, organizationId: true }
                })

                if (!project && bodyProjectId) {
                    project = await prisma.project.findUnique({
                        where: { id: bodyProjectId as string },
                        select: { id: true, clientId: true, organizationId: true }
                    })
                }

                const orgId = project?.organizationId || membership?.organizationId
                if (orgId) {
                    await safeInngestSend('file.index.requested', {
                        organizationId: orgId,
                        clientId: project?.clientId ?? null,
                        projectId: project?.id ?? (bodyProjectId as string) ?? null,
                        externalId: newFile.id as string,
                        fileName: name,
                    })
                }
            }

            return NextResponse.json(newFile)
        }

        if (action === 'duplicate') {
            const { fileId } = body
            if (typeof bodyProjectId !== 'string' || !bodyProjectId || typeof fileId !== 'string' || !fileId) {
                return NextResponse.json({ error: 'Missing projectId or fileId' }, { status: 400 })
            }
            const project = await prisma.project.findFirst({
                where: { id: bodyProjectId, isDeleted: false },
                include: {
                    client: {
                        include: {
                            organization: {
                                include: {
                                    connector: true
                                }
                            }
                        }
                    }
                }
            })
            const connector = project?.client?.organization?.connector
            if (!connector) return NextResponse.json({ error: 'Project or connector not found' }, { status: 404 })

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')
            const meta = await googleDriveConnector.getFileMetadata(connector.id, fileId)
            if (!meta?.name) return NextResponse.json({ error: 'File not found' }, { status: 404 })
            const parentId = meta.parents?.[0]
            if (!parentId) return NextResponse.json({ error: 'File has no parent folder' }, { status: 400 })

            const { randomBytes } = await import('crypto')
            const randomSuffix = Array.from(randomBytes(6), (b: number) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('')
            const base = meta.name
            const lastDot = base.lastIndexOf('.')
            const newName = lastDot > 0 ? `${base.slice(0, lastDot)}_${randomSuffix}${base.slice(lastDot)}` : `${base}_${randomSuffix}`

            const result = await googleDriveConnector.copyFile(connector.id, fileId, parentId, newName)
            if (!result) return NextResponse.json({ error: 'Failed to duplicate file' }, { status: 500 })

            // Index the duplicated file
            await safeInngestSend('file.index.requested', {
                organizationId: project.organizationId,
                clientId: project.clientId,
                projectId: project.id,
                externalId: result.id,
                fileName: newName,
            })

            return NextResponse.json({ success: true, id: result.id, name: newName })
        }

        if (action === 'copy' || action === 'move') {
            const { fileId, destinationFolderId } = body
            if (typeof bodyProjectId !== 'string' || !bodyProjectId || typeof fileId !== 'string' || !fileId || typeof destinationFolderId !== 'string' || !destinationFolderId) {
                return NextResponse.json({ error: 'Missing projectId, fileId, or destinationFolderId' }, { status: 400 })
            }

            const project = await prisma.project.findFirst({
                where: { id: bodyProjectId, isDeleted: false },
                include: {
                    client: {
                        include: {
                            organization: {
                                include: {
                                    connector: true
                                }
                            }
                        }
                    }
                }
            })
            const connector = project?.client?.organization?.connector
            if (!connector) return NextResponse.json({ error: 'Project or connector not found' }, { status: 404 })

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')
            if (action === 'copy') {
                const keepBoth = body.keepBoth !== false
                const meta = await googleDriveConnector.getFileMetadata(connector.id, fileId)
                const sourceName = meta?.name ?? 'copy'
                let copyName: string | undefined
                if (keepBoth) {
                    const { randomBytes } = await import('crypto')
                    const suffix = Array.from(randomBytes(6), (b: number) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('')
                    const lastDot = sourceName.lastIndexOf('.')
                    copyName = lastDot > 0 ? `${sourceName.slice(0, lastDot)}_${suffix}${sourceName.slice(lastDot)}` : `${sourceName}_${suffix}`
                } else {
                    const existing = await googleDriveConnector.listFiles(connector.id, destinationFolderId, 500)
                    const sameName = existing.find((f: { name: string }) => f.name === sourceName)
                    if (sameName) {
                        await googleDriveConnector.trashFile(connector.id, sameName.id)
                        await safeInngestSend('file.delete.requested', {
                            organizationId: project.organizationId,
                            externalId: sameName.id
                        })
                    }
                    copyName = sourceName
                }
                const result = await googleDriveConnector.copyFile(connector.id, fileId, destinationFolderId, copyName)
                if (!result) return NextResponse.json({ error: 'Failed to copy file' }, { status: 500 })

                // Index the copied file
                await safeInngestSend('file.index.requested', {
                    organizationId: project.organizationId,
                    clientId: project.clientId,
                    projectId: project.id,
                    externalId: result.id,
                    fileName: copyName || sourceName,
                })

                return NextResponse.json({ success: true, id: result.id })
            }
            const result = await googleDriveConnector.moveFile(connector.id, fileId, destinationFolderId)
            if (!result) return NextResponse.json({ error: 'Failed to move file' }, { status: 500 })

            // Update index for moved file (parentId may have changed)
            const meta = await googleDriveConnector.getFileMetadata(connector.id, fileId)
            if (meta?.name) {
                await safeInngestSend('file.index.requested', {
                    organizationId: project.organizationId,
                    clientId: project.clientId,
                    projectId: project.id,
                    externalId: fileId,
                    fileName: meta.name,
                    parentId: meta.parents?.[0] ?? null,
                })
            }

            return NextResponse.json({ success: true, id: result.id })
        }

        if (action === 'move-tree') {
            const { fileId, targetRoot } = body
            if (typeof bodyProjectId !== 'string' || !bodyProjectId || typeof fileId !== 'string' || !fileId || typeof targetRoot !== 'string') {
                return NextResponse.json({ error: 'Missing projectId, fileId, or targetRoot' }, { status: 400 })
            }
            if (!['general', 'confidential', 'staging'].includes(targetRoot)) {
                return NextResponse.json({ error: 'Invalid targetRoot' }, { status: 400 })
            }

            const { canManageProject } = await import('@/lib/permission-helpers')
            const project = await prisma.project.findFirst({
                where: { id: bodyProjectId, isDeleted: false },
                include: {
                    client: {
                        include: {
                            organization: {
                                include: {
                                    connector: true
                                }
                            }
                        }
                    }
                }
            })
            if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
            const canManage = await canManageProject(project.organizationId, project.clientId, project.id)
            if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

            const connector = project.client.organization.connector
            if (!connector) return NextResponse.json({ error: 'Connector not found' }, { status: 404 })

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')
            const folderIds = await googleDriveConnector.getProjectFolderIds(connector.id, project.slug, {
                projectName: project.name,
                clientSlug: project.client.slug,
                clientName: project.client.name
            })
            const generalFolderId = folderIds.generalFolderId
            const confidentialFolderId = folderIds.confidentialFolderId
            const stagingFolderId = folderIds.stagingFolderId
            const destRootId = targetRoot === 'general' ? generalFolderId
                : targetRoot === 'confidential' ? confidentialFolderId
                    : stagingFolderId
            if (!destRootId) return NextResponse.json({ error: `Target folder (${targetRoot}) not configured` }, { status: 400 })

            // Build path from file's parent up to source root so we can replicate under target root
            const fileMeta = await googleDriveConnector.getFileMetadata(connector.id, fileId)
            let destFolderId = destRootId
            if (fileMeta?.parents?.length) {
                const pathNames: string[] = []
                const MAX_DEPTH = 20
                let currentId: string | null = fileMeta.parents[0]
                let depth = 0
                let foundSourceRoot = false
                while (currentId && depth < MAX_DEPTH) {
                    if (currentId === generalFolderId || currentId === confidentialFolderId || currentId === stagingFolderId) {
                        foundSourceRoot = true
                        break
                    }
                    const meta = await googleDriveConnector.getFileMetadata(connector.id, currentId)
                    if (!meta?.name) break
                    pathNames.unshift(meta.name)
                    if (!meta.parents?.length) break
                    currentId = meta.parents[0]
                    depth++
                }
                if (foundSourceRoot && pathNames.length > 0) {
                    const resolved = await googleDriveConnector.ensureFolderPath(connector.id, destRootId, pathNames)
                    if (resolved) destFolderId = resolved
                }
            }

            const result = await googleDriveConnector.moveFile(connector.id, fileId, destFolderId)
            if (!result) return NextResponse.json({ error: 'Failed to move' }, { status: 500 })

            // Index the moved item
            await safeInngestSend('file.index.requested', {
                organizationId: project.organizationId,
                clientId: project.clientId,
                projectId: project.id,
                externalId: fileId,
                fileName: fileMeta?.name || 'Moved Folder',
                parentId: destFolderId,
            })

            return NextResponse.json({ success: true, id: result.id })
        }

        if (action === 'rename') {
            const { fileId, name: newName } = body
            if (typeof bodyProjectId !== 'string' || !bodyProjectId || typeof fileId !== 'string' || !fileId || typeof newName !== 'string' || !newName.trim()) {
                return NextResponse.json({ error: 'Missing projectId, fileId, or name' }, { status: 400 })
            }

            const project = await prisma.project.findFirst({
                where: { id: bodyProjectId, isDeleted: false },
                include: {
                    client: {
                        include: {
                            organization: {
                                include: {
                                    connector: true
                                }
                            }
                        }
                    }
                }
            })
            const connector = project?.client?.organization?.connector
            if (!connector) return NextResponse.json({ error: 'Project or connector not found' }, { status: 404 })

            const { googleDriveConnector } = await import('@/lib/google-drive-connector')
            const result = await googleDriveConnector.renameFile(connector.id, fileId, newName.trim())
            if (!result) return NextResponse.json({ error: 'Failed to rename file' }, { status: 500 })

            // Update vector index with new name
            await safeInngestSend('file.index.requested', {
                organizationId: project.organizationId,
                clientId: project.clientId,
                projectId: project.id,
                externalId: fileId,
                fileName: result.name,
            })

            return NextResponse.json({ success: true, id: result.id, name: result.name })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('Linked Files API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
