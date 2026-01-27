import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'

export const projectService = {
    /**
     * Create a new project and ensure default members (Creator + Org Owner)
     */
    async createProject(
        organizationId: string,
        clientId: string,
        name: string,
        creatorUserId: string,
        description?: string
    ) {
        // Generate Slug
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '') + '-' + Math.random().toString(36).substring(2, 7)

        // 1. Transaction to create Project and Members
        const result = await prisma.$transaction(async (tx) => {
            // Create Project
            const project = await tx.project.create({
                data: {
                    name,
                    slug,
                    description,
                    organizationId,
                    clientId
                }
            })

            // Add Creator as Member (Full Capability)
            await tx.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: creatorUserId,
                    canView: true,
                    canEdit: true,
                    canManage: true
                }
            })

            // Find Organization Owner
            const orgOwner = await tx.organizationMember.findFirst({
                where: {
                    organizationId,
                    role: 'ORG_OWNER'
                }
            })

            // Add Org Owner if different from Creator
            if (orgOwner && orgOwner.userId !== creatorUserId) {
                await tx.projectMember.create({
                    data: {
                        projectId: project.id,
                        userId: orgOwner.userId,
                        canView: true,
                        canEdit: true,
                        canManage: true
                    }
                })
            }

            return project
        })

        // 2. Connector Integration (Async - don't block return?)
        // If we want to create a folder in Drive immediately:
        // We need to know which connector to use. Usually inferred from Org or User context.
        // For now, we'll leave this hooks-based or explicit. 
        // If there is an active Drive connector for this Org, we should probably create the folder.

        // TODO: Trigger Drive Folder Creation if configured.
        // const connector = await prisma.connector.findFirst({ where: { organizationId, type: 'GOOGLE_DRIVE' } })
        // if (connector) {
        //    // googleDriveConnector.ensureProjectFolder(...)
        // }

        return result
    },

    /**
     * Assign a document to a project (Tagging)
     */
    async assignDocumentToProject(documentId: string, projectId: string) {
        return prisma.document.update({
            where: { id: documentId },
            data: { projectId }
        })
    }

}
