const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // Use raw query or try catch because the model might not exist in the generated client yet 
    // if the client is old, but the DB has the table.
    // Actually, the client IS old (pointing to CustomerSuccess).
    // So we can use prisma.customerSuccess.deleteMany()

    try {
        console.log('Deleting all customer_success records...')
        // @ts-ignore
        await prisma.customerSuccess.deleteMany({})
        console.log('Deleted.')
    } catch (e) {
        console.error('Error deleting:', e)
        // If model not found, try raw query
        try {
            await prisma.$executeRawUnsafe(`DELETE FROM "customer_success";`)
            console.log('Deleted via raw query.')
        } catch (e2) {
            console.error("Raw query failed too", e2)
        }
    }
}

main()
    .catch((e) => {
        throw e
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
