
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🗑️  Starting Database Reset...')

    // Delete in order of dependency (children first)
    console.log(' - Deleting Linked Files...')
    await prisma.linkedFile.deleteMany()

    console.log(' - Deleting Documents...')
    await prisma.document.deleteMany()

    console.log(' - Deleting Project Members...')
    await prisma.projectMember.deleteMany()

    console.log(' - Deleting Projects...')
    await prisma.project.deleteMany()

    console.log(' - Deleting Clients...')
    await prisma.client.deleteMany()

    console.log(' - Deleting Connectors...')
    await prisma.connector.deleteMany()

    console.log(' - Deleting Organization Members...')
    await prisma.organizationMember.deleteMany()

    console.log(' - Deleting Organizations...')
    await prisma.organization.deleteMany()

    console.log('✅ Database Reset Complete!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
