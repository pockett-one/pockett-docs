'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

/**
 * Get the current user's role in the organization.
 * Returns simplified role: "org_member" (org_guest removed)
 */
export async function getOrganizationRole(organizationSlug: string): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const membership = await (prisma as any).orgMember.findFirst({
        where: {
            organization: { slug: organizationSlug },
            userId: user.id
        },
    })

    if (!membership) return null

    if (membership.role === 'org_admin') return 'ORG_ADMIN'
    return 'ORG_MEMBER'
}
