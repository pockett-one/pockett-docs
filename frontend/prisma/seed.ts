import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding baseline data (Simplified RBAC)...')

    // 1. Seed Personas (Platform Schema)
    // Only the essential 6 personas used by the application logic
    const personas = [
        { slug: 'org_owner', displayName: 'Organization Owner' },
        { slug: 'org_member', displayName: 'Organization Member' },
        { slug: 'project_admin', displayName: 'Project Administrator' },
        { slug: 'project_editor', displayName: 'Project Editor' },
        { slug: 'project_viewer', displayName: 'Project Viewer' },
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
