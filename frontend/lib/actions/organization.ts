'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'

/**
 * Get the current user's role in the organization.
 */
export async function getOrganizationRole(organizationSlug: string): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const membership = await prisma.organizationMember.findFirst({
        where: {
            organization: { slug: organizationSlug },
            userId: user.id
        },
        select: { role: true }
    })

    return membership ? membership.role.name : null
}
