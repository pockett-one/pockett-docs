import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'

/**
 * Sync document sharing permissions for a specific sharing record (V2)
 */
export async function syncDocumentSharingUsers(sharingId: string) {
  try {
    const sharing = await (prisma as any).projectDocumentSharing.findUnique({
      where: { id: sharingId },
      include: {
        users: true,
        project: true,
        searchIndex: true
      }
    })

    if (!sharing) return

    const isExternalCollaboratorEnabled = (sharing.settings as any)?.share?.externalCollaborator?.enabled === true
    const projectId = sharing.projectId
    const externalId = sharing.externalId || sharing.searchIndex?.externalId

    // Find the right connector (V2: organization has connectorId)
    let connectorId = sharing.searchIndex?.connectorId
    if (!connectorId && sharing.project?.organizationId) {
      const org = await (prisma as any).organization.findUnique({
        where: { id: sharing.project.organizationId },
        select: { connectorId: true }
      })
      connectorId = org?.connectorId
    }

    if (!connectorId) {
      logger.error('No active Google Drive connector found for organization', undefined, undefined, { organizationId: sharing.project?.organizationId })
      return
    }

    if (!isExternalCollaboratorEnabled) {
      // Revoke all existing permissions (V2)
      for (const user of sharing.users) {
        if (user.googlePermissionId && externalId) {
          try {
            await googleDriveConnector.revokePermission(connectorId, externalId, user.googlePermissionId)
          } catch (e) {
            logger.error('Failed to revoke Drive permission on sync', e as Error)
          }
        }
      }

      await (prisma as any).projectDocumentSharingUser.deleteMany({
        where: { sharingId }
      })
      return
    }

    // 1. Fetch all project members with External Collaborator role (RBAC v2)
    const externalCollaborators = await (prisma as any).projectMember.findMany({
      where: {
        projectId,
        role: 'proj_ext_collaborator'
      }
    })

    if (externalCollaborators.length === 0) return

    // 2. Fetch emails for members (V2: using queryRaw for auth.users)
    const userIds = externalCollaborators.map((m: any) => m.userId)
    const authUsers = await prisma.$queryRawUnsafe<Array<{ id: string; email: string }>>(
      `SELECT id::text, email FROM auth.users WHERE id IN (${userIds.map((id: string) => `'${id}'`).join(',')})`
    )

    const userEmailMap = new Map(authUsers.map(u => [u.id, u.email]))

    // 3. Grant permissions for those lacking it (V2)
    for (const member of externalCollaborators) {
      const email = userEmailMap.get(member.userId)
      if (!email) continue

      const existingUserShare = sharing.users.find((u: any) => u.userId === member.userId)
      if (existingUserShare) continue

      try {
        if (!externalId) continue
        const message = `You've been granted access to "${sharing.searchIndex?.fileName || 'a document'}" in Pockett.`
        const permissionId = await googleDriveConnector.grantFolderPermission(connectorId, externalId, email, 'writer') // or grantFilePermission if it exists

        await (prisma as any).projectDocumentSharingUser.create({
          data: {
            sharingId,
            projectId,
            userId: member.userId,
            email,
            googlePermissionId: permissionId
          }
        })
      } catch (e) {
        logger.error(`Failed to grant drive permission to ${email}`, e as Error)
      }
    }

    // 4. Revoke permissions for users who are no longer External Editors (V2)
    const validUserIds = new Set(externalCollaborators.map((m: any) => m.userId))
    const usersToRemove = sharing.users.filter((u: any) => !validUserIds.has(u.userId))

    for (const userToRemove of usersToRemove) {
      if (userToRemove.googlePermissionId && externalId) {
        try {
          await googleDriveConnector.revokePermission(connectorId, externalId, userToRemove.googlePermissionId)
        } catch (e) {
          logger.error('Failed to revoke permission for removed member', e as Error)
        }
      }
      await (prisma as any).projectDocumentSharingUser.delete({
        where: { id: userToRemove.id }
      })
    }

  } catch (error) {
    logger.error('Error in syncDocumentSharingUsers (V2)', error as Error)
  }
}
