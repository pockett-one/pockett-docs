'use server'

import { createClient } from '@/utils/supabase/server'
import { OrganizationService } from '@/lib/organization-service'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export interface OrganizationOption {
    id: string
    name: string
    slug: string
    isDefault: boolean
}

/**
 * Get all organizations that the current user belongs to
 */
export async function getUserOrganizations(): Promise<OrganizationOption[]> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    const organizations = await OrganizationService.getUserOrganizations(user.id)
    
    // Get user's memberships to access isDefault flag
    const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        select: {
            organizationId: true,
            isDefault: true
        }
    })
    
    // Create a map of organizationId -> isDefault
    const membershipMap = new Map(memberships.map(m => [m.organizationId, m.isDefault]))
    
    return organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        isDefault: membershipMap.get(org.id) || false
    }))
}
