'use server'

import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { MemberRole } from '@prisma/client'

/**
 * Get the current user's role in the organization.
 */
export async function getOrganizationRole(organizationSlug: string): Promise<MemberRole | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true }
    })

    if (!organization) return null

    const membership = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: {
                organizationId: organization.id,
                userId: user.id
            }
        },
        select: { role: true }
    })

    return membership ? membership.role : null
}
