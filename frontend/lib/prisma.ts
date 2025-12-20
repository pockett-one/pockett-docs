import { PrismaClient } from '@prisma/client'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// For Supabase:
// 1. DATABASE_URL: Connect to port 6543 (Transaction Pooler)
//    Format: postgres://[user]:[password]@[host]:6543/[db]?pgbouncer=true&connection_limit=1
// 2. DIRECT_URL: Connect to port 5432 (Session Mode) - used for migrations
//    Format: postgres://[user]:[password]@[host]:5432/[db]

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
