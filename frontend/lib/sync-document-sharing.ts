import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'

/**
 * Sync document sharing permissions for a specific project document (grant/revoke EC users).
 */
export async function syncDocumentSharingUsers(projectDocumentId: string) {
  try {
    const doc = await (prisma as any).projectDocument.findUnique({
      where: { id: projectDocumentId },
      include: {
        sharingUsers: true,
        project: true,
      },
    })

    if (!doc) return

    const isExternalCollaboratorEnabled = (doc.settings as any)?.share?.externalCollaborator?.enabled === true
    const projectId = doc.projectId
    const externalId = doc.externalId

    let connectorId = doc.connectorId
    if (!connectorId && doc.project?.organizationId) {
      const org = await (prisma as any).organization.findUnique({
        where: { id: doc.project.organizationId },
        select: { connectorId: true },
      })
      connectorId = org?.connectorId
    }

    if (!connectorId) {
      logger.error('No active Google Drive connector found for organization', undefined, undefined, { organizationId: doc.project?.organizationId })
      return
    }

    if (!isExternalCollaboratorEnabled) {
      for (const user of doc.sharingUsers) {
        if (user.googlePermissionId && externalId) {
          try {
            await googleDriveConnector.revokePermission(connectorId, externalId, user.googlePermissionId)
          } catch (e) {
            logger.error('Failed to revoke Drive permission on sync', e as Error)
          }
        }
      }

      await (prisma as any).projectDocumentSharingUser.deleteMany({
        where: { projectDocumentId },
      })
      return
    }

    const externalCollaborators = await (prisma as any).projectMember.findMany({
      where: {
        projectId,
        role: 'proj_ext_collaborator',
      },
    })

    if (externalCollaborators.length === 0) return

    const userIds = externalCollaborators.map((m: any) => m.userId)
    const authUsers = await prisma.$queryRawUnsafe<Array<{ id: string; email: string }>>(
      `SELECT id::text, email FROM auth.users WHERE id IN (${userIds.map((id: string) => `'${id}'`).join(',')})`
    )

    const userEmailMap = new Map(authUsers.map(u => [u.id, u.email]))

    for (const member of externalCollaborators) {
      const email = userEmailMap.get(member.userId)
      if (!email) continue

      const existingUserShare = doc.sharingUsers.find((u: any) => u.userId === member.userId)
      if (existingUserShare) continue

      try {
        if (!externalId) continue
        const message = `You've been granted access to "${doc.fileName || 'a document'}" in Pockett.`
        const permissionId = await googleDriveConnector.grantFolderPermission(connectorId, externalId, email, 'writer')

        await (prisma as any).projectDocumentSharingUser.create({
          data: {
            projectDocumentId,
            projectId,
            userId: member.userId,
            email,
            googlePermissionId: permissionId,
          },
        })
      } catch (e) {
        logger.error(`Failed to grant drive permission to ${email}`, e as Error)
      }
    }

    const validUserIds = new Set(externalCollaborators.map((m: any) => m.userId))
    const usersToRemove = doc.sharingUsers.filter((u: any) => !validUserIds.has(u.userId))

    for (const userToRemove of usersToRemove) {
      if (userToRemove.googlePermissionId && externalId) {
        try {
          await googleDriveConnector.revokePermission(connectorId, externalId, userToRemove.googlePermissionId)
        } catch (e) {
          logger.error('Failed to revoke permission for removed member', e as Error)
        }
      }
      await (prisma as any).projectDocumentSharingUser.delete({
        where: { id: userToRemove.id },
      })
    }
  } catch (error) {
    logger.error('Error in syncDocumentSharingUsers (V2)', error as Error)
  }
}
