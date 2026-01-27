
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const { GoogleDriveConnector } = require('./lib/google-drive-connector')

async function main() {
    const orgId = "9854fb29-acbd-4754-8ef0-d6ea4ab6c6c0"
    console.log(`Fetching connections for Org: ${orgId}`)

    const connector = GoogleDriveConnector.getInstance()
    const connections = await connector.getConnections(orgId)

    console.log('Result:', JSON.stringify(connections, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
