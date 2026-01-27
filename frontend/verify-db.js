
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    const orgCount = await prisma.organization.count()
    const connectorCount = await prisma.connector.count()

    console.log(`Organizations: ${orgCount}`)
    console.log(`Connectors: ${connectorCount}`)

    if (orgCount === 0 && connectorCount === 0) {
        console.log("✅ Database is clean (tables exist but are empty).")
    } else {
        console.log("❌ Database still has data.")
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
