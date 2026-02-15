import { PrismaClient } from '@prisma/client'
import { encrypt, decrypt } from './encryption'

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
//
// For Supabase:
// 1. DATABASE_URL: Connect to port 6543 (Transaction Pooler)
//    Format: postgres://[user]:[password]@[host]:6543/[db]?pgbouncer=true&connection_limit=1
// 2. DIRECT_URL: Connect to port 5432 (Session Mode) - used for migrations
//    Format: postgres://[user]:[password]@[host]:5432/[db]

/**
 * Extended Prisma Client with automatic encryption/decryption for sensitive fields.
 * 
 * Connector model:
 * - accessToken, refreshToken: Stored encrypted in DB
 * - accessTokenDecrypted, refreshTokenDecrypted: Virtual computed fields (plaintext)
 * 
 * Usage:
 * - READ: Use `connector.accessTokenDecrypted` to get plaintext
 * - WRITE: Pass plaintext to create/update - encryption is automatic
 */
function createExtendedPrismaClient() {
  const basePrisma = new PrismaClient()

  return basePrisma.$extends({
    result: {
      connector: {
        /**
         * Decrypted access token (plaintext) - use this for API calls
         */
        accessTokenDecrypted: {
          needs: { accessToken: true },
          compute(connector): string {
            if (!connector.accessToken) return ''
            try {
              return decrypt(connector.accessToken)
            } catch (e) {
              // If decryption fails (e.g., legacy unencrypted data), return as-is
              console.warn('Failed to decrypt accessToken, returning raw value')
              return connector.accessToken
            }
          }
        },
        /**
         * Decrypted refresh token (plaintext) - use this for token refresh
         */
        refreshTokenDecrypted: {
          needs: { refreshToken: true },
          compute(connector): string | null {
            if (!connector.refreshToken) return null
            try {
              return decrypt(connector.refreshToken)
            } catch (e) {
              // If decryption fails (e.g., legacy unencrypted data), return as-is
              console.warn('Failed to decrypt refreshToken, returning raw value')
              return connector.refreshToken
            }
          }
        }
      }
    },
    query: {
      connector: {
        /**
         * Encrypt tokens before creating a connector
         */
        async create({ args, query }) {
          if (args.data.accessToken) {
            args.data.accessToken = encrypt(args.data.accessToken)
          }
          if (args.data.refreshToken) {
            args.data.refreshToken = encrypt(args.data.refreshToken)
          }
          return query(args)
        },
        /**
         * Encrypt tokens before updating a connector
         */
        async update({ args, query }) {
          if (typeof args.data.accessToken === 'string') {
            args.data.accessToken = encrypt(args.data.accessToken)
          }
          if (typeof args.data.refreshToken === 'string') {
            args.data.refreshToken = encrypt(args.data.refreshToken)
          }
          return query(args)
        },
        /**
         * Encrypt tokens for upsert operations
         */
        async upsert({ args, query }) {
          // Encrypt create data
          if (args.create.accessToken) {
            args.create.accessToken = encrypt(args.create.accessToken)
          }
          if (args.create.refreshToken) {
            args.create.refreshToken = encrypt(args.create.refreshToken)
          }
          // Encrypt update data
          if (typeof args.update.accessToken === 'string') {
            args.update.accessToken = encrypt(args.update.accessToken)
          }
          if (typeof args.update.refreshToken === 'string') {
            args.update.refreshToken = encrypt(args.update.refreshToken)
          }
          return query(args)
        }
      }
    }
  })
}

// Type for the extended client
export type ExtendedPrismaClient = ReturnType<typeof createExtendedPrismaClient>

const globalForPrisma = globalThis as unknown as {
  prisma: ExtendedPrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? createExtendedPrismaClient()

// In development, store prisma on global to prevent connection exhaustion during hot reloads
if (process.env.NODE_ENV === 'development') globalForPrisma.prisma = prisma
