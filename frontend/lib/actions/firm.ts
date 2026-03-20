'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

/**
 * Get the current user's role in the firm.
 * Returns simplified role: "firm_member"
 */
export async function getFirmRole(firmSlug: string): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const membership = await prisma.firmMember.findFirst({
        where: {
            firm: { slug: firmSlug },
            userId: user.id
        },
    })

    if (!membership) return null

    if (membership.role === 'firm_admin') return 'FIRM_ADMIN'
    return 'ORG_MEMBER'
}
