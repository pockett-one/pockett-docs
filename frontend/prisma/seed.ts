import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding baseline data (Simplified RBAC)...')

    // 1. Seed Personas (Platform Schema)
    // RBAC v2: scope-based roles (org + project)
    const personas = [
        { slug: 'org_admin', displayName: 'Organization Administrator' },
        { slug: 'org_member', displayName: 'Organization Member' },
        { slug: 'proj_admin', displayName: 'Project Lead' },
        { slug: 'proj_member', displayName: 'Contributor (Internal)' },
        { slug: 'proj_ext_collaborator', displayName: 'Contributor (External)' },
        { slug: 'proj_viewer', displayName: 'Guest (External)' },
        { slug: 'sys_admin', displayName: 'System Administrator' },
    ]

    for (const persona of personas) {
        await (prisma as any).persona.upsert({
            where: { slug: persona.slug },
            update: { displayName: persona.displayName },
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
