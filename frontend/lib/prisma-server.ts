import { createClient } from '@/utils/supabase/server'
import { getPrismaWithRls } from './prisma'

/**
 * SCAFFOLDING — DB-level RLS policies are NOT yet defined.
 *
 * Convenience helper for Next.js Server Components and API Routes that sets the
 * Supabase JWT claims context on the Prisma connection. This is the correct
 * pattern for Supabase RLS, but has no enforcement effect until `CREATE POLICY`
 * rules are added to the database tables.
 *
 * Current access control is enforced entirely at the application layer (explicit
 * `WHERE userId = ...` filters). See getPrismaWithRls in lib/prisma.ts for details.
 *
 * DO NOT use this as a substitute for application-layer access checks.
 */
export async function getRlsPrisma() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    return getPrismaWithRls(session?.access_token)
}
