import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { ROLES } from '@/lib/roles'
import { PERMISSIONS } from '@/lib/permissions'

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

        // Find Project Admin persona for assigning to creator
        const projAdminPersona = await prisma.rbacPersona.findFirst({
            where: { slug: 'proj_admin' }
        })
        if (!projAdminPersona) throw new Error("System Error: proj_admin persona not found")

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

            // Find or create Project Admin persona for this org
            let projectPersona = await tx.projectPersona.findFirst({
                where: {
                    organizationId,
                    rbacPersonaId: projAdminPersona.id
                }
            })

            if (!projectPersona) {
                projectPersona = await tx.projectPersona.create({
                    data: {
                        organizationId,
                        rbacPersonaId: projAdminPersona.id,
                        displayName: projAdminPersona.displayName,
                        description: projAdminPersona.description ?? undefined
                    }
                })
            }

            // Add Creator as Member with Project Admin persona
            await tx.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: creatorUserId,
                    personaId: projectPersona.id
                }
            })

            // Find Organization Owner (check for org_owner persona, not role)
            const orgOwner = await tx.organizationMember.findFirst({
                where: {
                    organizationId,
                    organizationPersona: {
                        rbacPersona: {
                            slug: 'org_owner'
                        }
                    }
                }
            })

            // Add Org Owner if different from Creator
            if (orgOwner && orgOwner.userId !== creatorUserId) {
                await tx.projectMember.create({
                    data: {
                        projectId: project.id,
                        userId: orgOwner.userId,
                        personaId: projectPersona.id
                    }
                })
            }

            return project
        })

        // 2. Connector Integration (Async - don't block return?)
        // ... (rest is unchanged, not shown in replacement content if not touching it)
        /** But replace_file_content with range usually replaces the block, 
            so I need to be careful not to cut off the rest if `EndLine` is 67.
            Lines 69+ are comments and return.
            Since I'm replacing up to line 67 (end of transaction block), I should output up to line 67.
        */
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
