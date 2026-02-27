import { prisma } from '@/lib/prisma'
import { GoogleDriveConnector } from '@/lib/google-drive-connector'

export async function syncDocumentSharingUsers(sharingId: string) {
  try {
    const sharing = await prisma.projectDocumentSharing.findUnique({
      where: { id: sharingId },
      include: {
        users: true,
        project: {
          select: {
            clientId: true,
            organizationId: true
          }
        },
        searchIndex: {
          select: {
            connectorId: true,
            fileName: true
          }
        }
      }
    })

    if (!sharing) return

    const isExternalCollaboratorEnabled = (sharing.settings as any)?.share?.externalCollaborator?.enabled === true
    const projectId = sharing.projectId
    const externalId = sharing.externalId

    // Find the right connector to use
    let connectorId = sharing.searchIndex?.connectorId
    if (!connectorId) {
      const connector = await prisma.connector.findFirst({
        where: { organizationId: sharing.organizationId, type: 'GOOGLE_DRIVE', status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' }
      })
      if (connector) connectorId = connector.id
    }

    if (!connectorId) {
      console.error('[syncDocumentSharingUsers] No active Google Drive connector found for organization')
      return
    }

    const drive = GoogleDriveConnector.getInstance()

    if (!isExternalCollaboratorEnabled) {
      // Revoke all existing permissions
      const userIds: string[] = []
      for (const user of sharing.users) {
        if (user.googlePermissionId) {
          await drive.revokePermission(connectorId, externalId, user.googlePermissionId)
        }
        userIds.push(user.id)
      }

      // Clear googlePermissionId for audit trail
      if (userIds.length > 0) {
        await prisma.projectDocumentSharingUser.updateMany({
          where: { id: { in: userIds } },
          data: { googlePermissionId: null }
        })
      }

      // Delete from DB
      await prisma.projectDocumentSharingUser.deleteMany({
        where: { sharingId }
      })
      return
    }

    // 1. Fetch all project members with "External Collaborator" persona
    const externalCollaborators = await prisma.projectMember.findMany({
      where: {
        projectId,
        persona: {
          rbacPersona: { slug: 'proj_ext_collaborator' } // Adjust slug if different
        }
      },
      include: {
        persona: {
          include: { rbacPersona: true }
        }
      }
    })

    if (externalCollaborators.length === 0) return

    // Better: let's query the auth.users table directly bypassing Prisma since it's in a different schema, or use Supabase admin client.
    // Given 'project_members' only has userId. Let's fetch emails using a direct Postgres query to auth.users.

    const userIds = externalCollaborators.map(m => m.userId)
    const authUsers = await prisma.$queryRawUnsafe<Array<{ id: string; email: string }>>(
      `SELECT id::text, email FROM auth.users WHERE id IN (${userIds.map(id => `'${id}'`).join(',')})`
    )

    const userEmailMap = new Map(authUsers.map(u => [u.id, u.email]))

    // 3. Grant permissions for those lacking it
    for (const member of externalCollaborators) {
      const email = userEmailMap.get(member.userId)
      if (!email) continue // Could not resolve email

      const existingUserShare = sharing.users.find(u => u.userId === member.userId)
      if (existingUserShare) continue // Already synced

      try {
        const message = `You've been granted access to "${sharing.searchIndex?.fileName || 'a document'}" in Pockett. You can view and edit it directly in Google Drive.`
        const permissionId = await drive.grantFilePermission(connectorId, externalId, email, 'writer', message)

        await prisma.projectDocumentSharingUser.create({
          data: {
            sharingId,
            projectId,
            userId: member.userId,
            email,
            googlePermissionId: permissionId
          }
        })
      } catch (e) {
        console.error(`[syncDocumentSharingUsers] Failed to grant drive permission to ${email}`, e)
      }
    }

    // 4. Revoke permissions for users who are no longer External Collaborators in this project
    const validUserIds = new Set(externalCollaborators.map(m => m.userId))
    const usersToRemove = sharing.users.filter(u => !validUserIds.has(u.userId))

    for (const userToRemove of usersToRemove) {
      if (userToRemove.googlePermissionId) {
        await drive.revokePermission(connectorId, externalId, userToRemove.googlePermissionId)
      }
      await prisma.projectDocumentSharingUser.delete({
        where: { id: userToRemove.id }
      })
    }

  } catch (error) {
    console.error('[syncDocumentSharingUsers] Error:', error)
  }
}
