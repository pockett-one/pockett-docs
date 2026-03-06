import { prisma } from '@/lib/prisma'
import { generateProjectSlug } from '@/lib/slug-utils'

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
        description?: string
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

        // 2. Fetch Project Admin persona
        const projectAdminPersona = await (prisma as any).persona.findUnique({
            where: { slug: 'project_admin' }
        })
        if (!projectAdminPersona) throw new Error("System Error: project_admin persona not found in DB")

        // 3. Execute creation in transaction
        const result = await (prisma as any).$transaction(async (tx: any) => {
            // Create Project record in platform schema
            const project = await tx.project.create({
                data: {
                    organizationId,
                    name,
                    slug,
                    description,
                    clientId
                }
            })

            // Add Creator as Member with Project Admin persona
            await tx.projectMember.create({
                data: {
                    projectId: project.id,
                    userId: creatorUserId,
                    personaId: projectAdminPersona.id
                }
            })

            // Find Organization Owner to add as secondary project lead
            const orgOwner = await tx.orgMember.findFirst({
                where: {
                    organizationId,
                    persona: { slug: 'org_owner' }
                }
            })

            if (orgOwner && orgOwner.userId !== creatorUserId) {
                await tx.projectMember.create({
                    data: {
                        projectId: project.id,
                        userId: orgOwner.userId,
                        personaId: projectAdminPersona.id
                    }
                })
            }

            return project
        })

        return result
    },
}
