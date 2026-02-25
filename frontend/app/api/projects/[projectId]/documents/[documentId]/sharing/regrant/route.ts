import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleDriveConnector } from '@/lib/google-drive-connector'
import { createClient } from '@/utils/supabase/server'
import { getFileInfo } from '@/lib/file-utils'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string; documentId: string }> }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || (!user.email && !user.user_metadata?.email)) {
            return NextResponse.json({ error: 'Unauthorized or missing email' }, { status: 401 })
        }

        const email = user.email || user.user_metadata?.email
        const { projectId, documentId: documentIdParam } = await params

        const fileInfo = await getFileInfo(projectId, documentIdParam)
        if (!fileInfo) return NextResponse.json({ error: 'File not found' }, { status: 404 })

        let sharingUser = await prisma.projectDocumentSharingUser.findFirst({
            where: {
                projectId,
                userId: user.id,
                sharing: {
                    organizationId: fileInfo.organizationId,
                    externalId: fileInfo.externalId
                }
            },
            include: {
                sharing: {
                    include: {
                        searchIndex: { select: { connectorId: true, fileName: true } }
                    }
                }
            }
        })

        if (!sharingUser) {
            // Check if the user is actually an External Collaborator on this project
            const member = await prisma.projectMember.findUnique({
                where: { projectId_userId: { projectId, userId: user.id } },
                include: {
                    persona: {
                        include: { rbacPersona: true }
                    }
                }
            });

            if (!['proj_ext_collaborator', 'proj_guest'].includes(member?.persona?.rbacPersona?.slug || '')) {
                return NextResponse.json({ error: 'Not authorized for secure access' }, { status: 403 })
            }

            // User is a valid EC, but the syncing job missed them. Let's find the master sharing record.
            const sharing = await prisma.projectDocumentSharing.findUnique({
                where: {
                    projectId_organizationId_externalId: {
                        projectId,
                        organizationId: fileInfo.organizationId,
                        externalId: fileInfo.externalId
                    }
                },
                include: {
                    searchIndex: { select: { connectorId: true, fileName: true } }
                }
            });

            if (!sharing) {
                return NextResponse.json({ error: 'Sharing record not found' }, { status: 404 })
            }

            const isExtCollab = (sharing.settings as any)?.share?.externalCollaborator?.enabled
            const isGuest = (sharing.settings as any)?.share?.guest?.enabled

            if (!isExtCollab && !isGuest) {
                return NextResponse.json({ error: 'File is not shared with external users' }, { status: 403 })
            }

            // Create the missing tracking row
            sharingUser = await prisma.projectDocumentSharingUser.create({
                data: {
                    projectId,
                    sharingId: sharing.id,
                    userId: user.id,
                    email
                },
                include: {
                    sharing: {
                        include: { searchIndex: { select: { connectorId: true } } }
                    }
                }
            })
        }

        let connectorId = sharingUser.sharing.searchIndex?.connectorId
        if (!connectorId) {
            const connector = await prisma.connector.findFirst({
                where: { organizationId: sharingUser.sharing.organizationId, type: 'GOOGLE_DRIVE', status: 'ACTIVE' },
                orderBy: { createdAt: 'desc' }
            })
            if (connector) connectorId = connector.id
        }

        if (!connectorId) {
            return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 500 })
        }

        const drive = GoogleDriveConnector.getInstance()

        // 1. Revoke the existing permission if any
        if (sharingUser.googlePermissionId) {
            await drive.revokePermission(connectorId, fileInfo.externalId, sharingUser.googlePermissionId)
            // Clear just in case the ensuing grant fails
            await prisma.projectDocumentSharingUser.update({
                where: { id: sharingUser.id },
                data: { googlePermissionId: null }
            })
        }

        // 2. Grant a new permission. This forces Google to send a brand new "Visitor Sharing" email
        // Determine role based on project member persona (member was found in the first check)
        const member = await prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: user.id } },
            include: { persona: { include: { rbacPersona: true } } }
        });
        const personaSlug = member?.persona?.rbacPersona?.slug || 'proj_guest'
        const role = personaSlug === 'proj_ext_collaborator' ? 'writer' : 'reader'

        const fileName = sharingUser.sharing.searchIndex?.fileName || 'a document'
        const message = `POCKETT SECURE ACCESS\n\nYou have requested to open "${fileName}". For your security, Google Drive requires a one-time email verification. Please click the "Open" button below to receive your one-time passcode and access the document.`
        const options = { rm: 'minimal', ui: '2', sendNotificationEmail: 'true' }
        const permissionId = await drive.grantFilePermission(connectorId, fileInfo.externalId, email, role, message, options)

        if (!permissionId) {
            return NextResponse.json({ error: 'Failed to re-grant Google Drive permission' }, { status: 500 })
        }

        // 3. Update with the fresh permission ID
        await prisma.projectDocumentSharingUser.update({
            where: { id: sharingUser.id },
            data: { googlePermissionId: permissionId }
        })

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('POST regrant sharing error', e)
        return NextResponse.json({ error: 'Failed to authenticate editor access' }, { status: 500 })
    }
}
