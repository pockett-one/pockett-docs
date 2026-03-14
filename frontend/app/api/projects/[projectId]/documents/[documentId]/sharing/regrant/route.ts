import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GoogleDriveConnector } from '@/lib/google-drive-connector'
import { createClient } from '@/utils/supabase/server'
import { getFileInfo } from '@/lib/file-utils'

export async function POST(
    _request: NextRequest,
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

        const document = await (prisma as any).projectDocument.findUnique({
            where: {
                projectId_organizationId_externalId: {
                    projectId,
                    organizationId: fileInfo.organizationId,
                    externalId: fileInfo.externalId,
                },
            },
        })

        if (!document) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

        let sharingUser = await (prisma as any).projectDocumentSharingUser.findFirst({
            where: {
                projectDocumentId: document.id,
                userId: user.id,
            },
            include: { document: true },
        })

        if (!sharingUser) {
            const [orgMember, projectMember] = await Promise.all([
                (prisma as any).orgMember.findFirst({
                    where: { organizationId: fileInfo.organizationId, userId: user.id },
                }),
                prisma.projectMember.findFirst({
                    where: { projectId, userId: user.id },
                }),
            ])

            const projectPersonaSlug = projectMember?.role
            const isExternalRole = ['proj_ext_collaborator', 'proj_viewer'].includes(projectPersonaSlug || '')

            if (!orgMember && !isExternalRole) {
                return NextResponse.json({ error: 'Not authorized for secure access' }, { status: 403 })
            }

            if (!orgMember && isExternalRole) {
                const isExtCollab = (document.settings as any)?.share?.externalCollaborator?.enabled
                const isGuest = (document.settings as any)?.share?.guest?.enabled

                if (!isExtCollab && !isGuest) {
                    return NextResponse.json({ error: 'File is not shared with external users' }, { status: 403 })
                }
            }

            sharingUser = await (prisma as any).projectDocumentSharingUser.create({
                data: {
                    projectDocumentId: document.id,
                    projectId,
                    userId: user.id,
                    email,
                },
                include: { document: true },
            })
        }

        let connectorId = document.connectorId
        if (!connectorId && fileInfo.organizationId) {
            const org = await (prisma as any).organization.findUnique({
                where: { id: fileInfo.organizationId },
                include: { connector: true },
            })
            if (org?.connector?.type === 'GOOGLE_DRIVE' && org.connector.status === 'ACTIVE') {
                connectorId = org.connector.id
            }
        }

        if (!connectorId) {
            return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 500 })
        }

        const drive = GoogleDriveConnector.getInstance()

        if (sharingUser.googlePermissionId) {
            await drive.revokePermission(connectorId, fileInfo.externalId, sharingUser.googlePermissionId)
            await (prisma as any).projectDocumentSharingUser.update({
                where: { id: sharingUser.id },
                data: { googlePermissionId: null },
            })
        }

        const projectMemberForRole = await prisma.projectMember.findFirst({
            where: { projectId, userId: user.id },
        })

        const isGuest = projectMemberForRole?.role === 'proj_viewer'
        const role: 'writer' | 'reader' = isGuest ? 'reader' : 'writer'

        const fileName = document.fileName || 'a document'
        const message = `POCKETT SECURE ACCESS\n\nYou have requested to open "${fileName}". For your security, Google Drive requires a one-time email verification. Please click the "Open" button below to receive your one-time passcode and access the document.`
        const options = { rm: 'minimal', ui: '2', sendNotificationEmail: 'true' }
        const permissionId = await drive.grantFilePermission(connectorId, fileInfo.externalId, email, role, message, options)

        if (!permissionId) {
            return NextResponse.json({ error: 'Failed to re-grant Google Drive permission' }, { status: 500 })
        }

        await (prisma as any).projectDocumentSharingUser.update({
            where: { id: sharingUser.id },
            data: { googlePermissionId: permissionId },
        })

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('POST regrant sharing error', e)
        return NextResponse.json({ error: 'Failed to authenticate editor access' }, { status: 500 })
    }
}
