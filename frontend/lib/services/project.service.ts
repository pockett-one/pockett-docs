import { prisma } from '@/lib/prisma'
import { generateProjectSlug } from '@/lib/slug-utils'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'

/**
 * Service for managing projects in the V2 Platform schema.
 * Note: Projects now belong to Clients (Client -> Organization).
 */
export const projectService = {
    /**
     * Create a new project and ensure default members (Creator + Org Owner)
     */
    async createProject(
        organizationId: string,
        clientId: string,
        name: string,
        creatorUserId: string,
        description?: string,
        sandboxOnly?: boolean,
        skipDriveStructure?: boolean
    ) {
        // 1. Generate unique slug
        const MAX_SLUG_ATTEMPTS = 10
        let slug = generateProjectSlug(name)
        let attempts = 0
        while (attempts < MAX_SLUG_ATTEMPTS) {
            const existing = await (prisma as any).project.findUnique({
                where: { clientId_slug: { clientId, slug } }
            })
            if (!existing) break
            slug = generateProjectSlug(name)
            attempts++
        }
        if (attempts >= MAX_SLUG_ATTEMPTS) {
            throw new Error('Could not generate a unique project slug. Please try again.')
        }

        // 2. Execute creation in transaction (RBAC v2: use role enum)
        const result = await (prisma as any).$transaction(async (tx: any) => {
            const project = await tx.project.create({
                data: {
                    organizationId,
                    name,
                    slug,
                    description,
                    clientId,
                    sandboxOnly: !!sandboxOnly
                }
            })

            await tx.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: creatorUserId,
                    role: 'proj_admin'
                }
            })

            const orgAdmin = await tx.orgMember.findFirst({
                where: { organizationId, role: 'org_admin' }
            })
            if (orgAdmin && orgAdmin.userId !== creatorUserId) {
                await tx.projectMember.create({
                    data: {
                        projectId: project.id,
                        userId: orgAdmin.userId,
                        role: 'proj_admin'
                    }
                })
            }

            return project
        })

        // 4. Create Drive Folder Structure (V2 - Automated); skip when building sandbox in one batch (Option B)
        let folderStructure: { projectId?: string; generalFolderId?: string; confidentialFolderId?: string; stagingFolderId?: string } | null = null
        if (!skipDriveStructure) {
        try {
            const org = await (prisma as any).organization.findUnique({
                where: { id: organizationId },
                select: { connectorId: true }
            })

            const connectorId = org?.connectorId
            if (connectorId) {
                const client = await (prisma as any).client.findUnique({
                    where: { id: clientId },
                    select: { name: true, slug: true }
                })

                if (client) {
                    const fs = await googleDriveConnector.ensureAppFolderStructure(
                        connectorId,
                        client.name,
                        client.slug,
                        await googleDriveConnector.createGoogleDriveAdapter(connectorId),
                        organizationId,
                        {
                            projectName: result.name,
                            projectSlug: result.slug
                        }
                    )

                    if (fs.projectId) {
                        result.connectorRootFolderId = fs.projectId
                    }
                    folderStructure = {
                        projectId: fs.projectId,
                        generalFolderId: fs.generalFolderId,
                        confidentialFolderId: fs.confidentialFolderId,
                        stagingFolderId: fs.stagingFolderId
                    }
                }
            }
        } catch (e) {
            logger.error("Failed to create/register Google Drive folders in projectService", e as Error)
        }
        }

        return { project: result, folderStructure }
    },
}
