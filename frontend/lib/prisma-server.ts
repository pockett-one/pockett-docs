import { createClient } from '@/utils/supabase/server'
import { getPrismaWithRls } from './prisma'

/**
 * Convenience helper for Next.js Server Components and API Routes.
 * It automatically fetches the current Supabase session and returns
 * a Prisma client configured with the user's Row-Level Security (RLS) context.
 */
export async function getRlsPrisma() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    return getPrismaWithRls(session?.access_token)
}
