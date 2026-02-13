import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { ROLES } from '@/lib/roles'
import { PERMISSIONS } from '@/lib/permissions'
import { ensureProjectPersonasForProject } from '@/lib/actions/personas'

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

            return project
        })

        // Replicate personas for this project (project_personas keyed by projectId)
        await ensureProjectPersonasForProject(result.id)

        // Find Project Admin persona for this project (assigned to creator and org owner)
        const projectLeadPersona = await prisma.projectPersona.findFirst({
            where: {
                projectId: result.id,
                rbacPersona: { slug: 'proj_admin' }
            }
        })
        if (!projectLeadPersona) throw new Error("System Error: proj_admin persona not found for project")

        // Add Creator as Member with Project Admin persona
        await prisma.projectMember.create({
            data: {
                projectId: result.id,
                userId: creatorUserId,
                personaId: projectLeadPersona.id
            }
        })

        // Find Organization Owner and add as project member if different from Creator
        const orgOwner = await prisma.organizationMember.findFirst({
            where: {
                organizationId: result.organizationId,
                organizationPersona: {
                    rbacPersona: { slug: 'org_owner' }
                }
            }
        })
        if (orgOwner && orgOwner.userId !== creatorUserId) {
            await prisma.projectMember.create({
                data: {
                    projectId: result.id,
                    userId: orgOwner.userId,
                    personaId: projectLeadPersona.id
                }
            })
        }

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
