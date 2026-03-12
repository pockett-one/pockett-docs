import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding baseline data (Simplified RBAC)...')

    // Seed Personas (Platform Schema)
    const personas = [
        { slug: 'sys_admin', displayName: 'System Administrator', description: 'Platform-level administrator with full control across all organizations. Can manage system configuration, users, organizations, billing settings, and platform-wide policies. Typically reserved for the SaaS operator or internal platform team.' },
        { slug: 'org_admin', displayName: 'Organization Administrator', description: 'Manages a specific organization within the platform. Can manage organization members, create and manage projects, configure organization settings, and control access for users within their organization.' },
        { slug: 'org_member', displayName: 'Organization Member', description: 'Full-time internal member of the organization with access to organization resources and projects they are assigned to. Typically employees or full-time team members.' },
        { slug: 'proj_admin', displayName: 'Project Lead', description: 'Responsible for managing a specific project. Can manage project members, update project content, and oversee collaboration within the project workspace. Usually a project manager, engagement lead, or team lead.' },
        { slug: 'proj_member', displayName: 'Contributor (Internal)', description: 'Internal team member contributing to project work. Can create and edit project content, collaborate with team members, and participate in discussions within assigned projects. Typically full-time employees or core project team members.' },
        { slug: 'proj_ext_collaborator', displayName: 'Contributor (External)', description: 'External collaborator invited to contribute to a project. Can create or edit content within the project but has limited access outside the project scope. Typically contractors, consultants, vendors, or agency partners.' },
        { slug: 'proj_viewer', displayName: 'Guest (External)', description: 'External stakeholder with read-only access to project content. Cannot modify content but can review materials and stay informed. Typically clients, sponsors, or external stakeholders.' },
    ]
    for (const persona of personas) {
        await (prisma as any).persona.upsert({
            where: { slug: persona.slug },
            update: { displayName: persona.displayName, description: persona.description },
            create: persona,
        })
    }
    console.log(`Seeded ${personas.length} essential personas.`)

    console.log('Seed completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
