const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

console.log('Available propertes on prisma instance:')
// Inspect the instance to see if customerRequest is there
// Note: Lazy loading might hide it from Object.keys, but checking distinct property helps
const models = Object.getOwnPropertyNames(prisma).filter(p => !p.startsWith('_') && !p.startsWith('$'))
console.log('Models found:', models)

// Explicit check
if (prisma.customerRequest) {
    console.log('✅ prisma.customerRequest exists')
} else {
    console.log('❌ prisma.customerRequest is MISSING')
    // Check for old name
    if (prisma.customerSuccess) {
        console.log('⚠️ prisma.customerSuccess found instead (Stale Client)')
    }
}

prisma.$disconnect()
