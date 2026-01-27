
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('--- Organizations ---')
    const orgs = await prisma.organization.findMany({
        include: {
            members: true
        }
    })
    console.log(JSON.stringify(orgs, null, 2))

    console.log('\n--- Connectors ---')
    const connectors = await prisma.connector.findMany()
    console.log(JSON.stringify(connectors, null, 2))

    console.log('\n--- Linked Files ---')
    const files = await prisma.linkedFile.findMany()
    console.log(JSON.stringify(files, null, 2))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
