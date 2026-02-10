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

    const membership = await prisma.organizationMember.findFirst({
        where: {
            organization: { slug: organizationSlug },
            userId: user.id
        },
        include: {
            organizationPersona: {
                include: {
                    rbacPersona: {
                        include: { role: true }
                    }
                }
            }
        }
    })

    if (!membership) return null

    // Get role from persona, or default to org_member
    const roleSlug = membership.organizationPersona?.rbacPersona?.role?.slug || 'org_member'
    
    // Map to simplified roles (org_guest removed, all map to org_member)
    return 'org_member' // org_member or sys_manager both map to org_member
}
