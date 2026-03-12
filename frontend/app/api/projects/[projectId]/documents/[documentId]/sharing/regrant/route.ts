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

        let sharingUser = await (prisma as any).projectDocumentSharingUser.findFirst({
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
            // Determine if the user is authorized via org membership or project persona
            const [orgMember, projectMember] = await Promise.all([
                (prisma as any).orgMember.findFirst({
                    where: { organizationId: fileInfo.organizationId, userId: user.id }
                }),
                prisma.projectMember.findFirst({
                    where: { projectId, userId: user.id }
                })
            ])

            const projectPersonaSlug = projectMember?.role
            const isExternalRole = ['proj_ext_collaborator', 'proj_viewer'].includes(projectPersonaSlug || '')

            // Must be either an internal org member or an EC/Guest on the project
            if (!orgMember && !isExternalRole) {
                return NextResponse.json({ error: 'Not authorized for secure access' }, { status: 403 })
            }

            // Find the master sharing record
            const sharing = await (prisma as any).projectDocumentSharing.findUnique({
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
            })

            if (!sharing) {
                return NextResponse.json({ error: 'Sharing record not found' }, { status: 404 })
            }

            // For EC/Guest users, verify the sharing settings still have their access enabled
            if (!orgMember && isExternalRole) {
                const isExtCollab = (sharing.settings as any)?.share?.externalCollaborator?.enabled
                const isGuest = (sharing.settings as any)?.share?.guest?.enabled

                if (!isExtCollab && !isGuest) {
                    return NextResponse.json({ error: 'File is not shared with external users' }, { status: 403 })
                }
            }

            // Create the tracking row for this user
            sharingUser = await (prisma as any).projectDocumentSharingUser.create({
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
            // Query the organization with its connector
            const organizationId = sharingUser.sharing.organizationId
            if (organizationId) {
                const org = await (prisma as any).organization.findUnique({
                    where: { id: organizationId },
                    include: { connector: true }
                })
                if (org?.connector?.type === 'GOOGLE_DRIVE' && org.connector.status === 'ACTIVE') {
                    connectorId = org.connector.id
                }
            }
        }

        if (!connectorId) {
            return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 500 })
        }

        const drive = GoogleDriveConnector.getInstance()

        // 1. Revoke the existing permission if any
        if (sharingUser.googlePermissionId) {
            await drive.revokePermission(connectorId, fileInfo.externalId, sharingUser.googlePermissionId)
            // Clear just in case the ensuing grant fails
            await (prisma as any).projectDocumentSharingUser.update({
                where: { id: sharingUser.id },
                data: { googlePermissionId: null }
            })
        }

        // 2. Determine role:
        //    - Guest (proj_viewer) → reader (view only)
        //    - Everyone else (org member, EC, team member, project lead) → writer (edit)
        const projectMemberForRole = await prisma.projectMember.findFirst({
            where: { projectId, userId: user.id }
        })

        const isGuest = projectMemberForRole?.role === 'proj_viewer'
        const role: 'writer' | 'reader' = isGuest ? 'reader' : 'writer'

        const fileName = sharingUser.sharing.searchIndex?.fileName || 'a document'
        const message = `POCKETT SECURE ACCESS\n\nYou have requested to open "${fileName}". For your security, Google Drive requires a one-time email verification. Please click the "Open" button below to receive your one-time passcode and access the document.`
        const options = { rm: 'minimal', ui: '2', sendNotificationEmail: 'true' }
        const permissionId = await drive.grantFilePermission(connectorId, fileInfo.externalId, email, role, message, options)

        if (!permissionId) {
            return NextResponse.json({ error: 'Failed to re-grant Google Drive permission' }, { status: 500 })
        }

        // 3. Update with the fresh permission ID
        await (prisma as any).projectDocumentSharingUser.update({
            where: { id: sharingUser.id },
            data: { googlePermissionId: permissionId }
        })

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('POST regrant sharing error', e)
        return NextResponse.json({ error: 'Failed to authenticate editor access' }, { status: 500 })
    }
}
