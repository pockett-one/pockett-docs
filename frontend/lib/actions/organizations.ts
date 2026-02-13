'use server'

import { createClient } from '@/utils/supabase/server'
import { OrganizationService } from '@/lib/organization-service'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export interface OrganizationOption {
    id: string
    name: string
    slug: string
    isDefault: boolean
    createdAt: string
}

export interface CreateOrganizationData {
    name: string
    allowDomainAccess?: boolean
    allowedEmailDomain?: string | null
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
    
    // Get user's memberships to access isDefault flag and organization createdAt
    const memberships = await prisma.organizationMember.findMany({
        where: { userId: user.id },
        select: {
            organizationId: true,
            isDefault: true,
            organization: {
                select: { createdAt: true }
            }
        }
    })
    
    // Create maps for organizationId -> isDefault and createdAt
    const membershipMap = new Map(memberships.map(m => [m.organizationId, m.isDefault]))
    const createdAtMap = new Map(memberships.map(m => [m.organizationId, m.organization.createdAt]))
    
    return organizations.map(org => ({
        id: org.id,
        name: org.name,
        slug: org.slug,
        isDefault: membershipMap.get(org.id) || false,
        createdAt: (createdAtMap.get(org.id) || new Date()).toISOString()
    }))
}

/**
 * Get the default organization slug for the current user
 * Returns null if user has no organizations
 */
export async function getDefaultOrganizationSlug(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    const defaultOrg = await OrganizationService.getDefaultOrganization(user.id)
    return defaultOrg?.slug || null
}

/**
 * Get default org slug and whether its onboarding is complete.
 * Used to decide redirect: only send to portal when onboardingComplete is true.
 */
export async function getDefaultOrganizationWithOnboardingStatus(): Promise<{
    slug: string | null
    onboardingComplete: boolean
}> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { slug: null, onboardingComplete: false }
    const defaultOrg = await OrganizationService.getDefaultOrganization(user.id)
    const slug = defaultOrg?.slug ?? null
    const onboardingComplete =
        defaultOrg?.settings != null &&
        (defaultOrg.settings as { onboarding?: { isComplete?: boolean } })?.onboarding?.isComplete === true
    return { slug, onboardingComplete }
}

/**
 * Create a new organization for the current user
 * User becomes the organization owner
 */
export async function createOrganization(data: CreateOrganizationData): Promise<OrganizationOption> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || !user.email) {
        throw new Error('Unauthorized')
    }

    // Check for duplicate organization name (case-insensitive)
    const existingOrg = await prisma.organization.findFirst({
        where: {
            name: {
                equals: data.name,
                mode: 'insensitive'
            }
        }
    })

    if (existingOrg) {
        throw new Error('An organization with this name already exists')
    }

    // Extract user name from metadata or email
    const fullName = user.user_metadata?.full_name || ''
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || user.email.split('@')[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    const org = await OrganizationService.createOrganizationWithMember({
        organizationName: data.name,
        userId: user.id,
        email: user.email,
        firstName,
        lastName,
        allowDomainAccess: data.allowDomainAccess,
        allowedEmailDomain: data.allowedEmailDomain
    })

    // Set this organization as default (unset other defaults)
    await OrganizationService.setDefaultOrganization(user.id, org.id)

    // Invalidate user settings cache to refresh permissions
    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(user.id)

    // Revalidate the /d page
    revalidatePath('/d')

    return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        isDefault: true, // New organization is set as default
        createdAt: new Date().toISOString()
    }
}

/**
 * Switch to a different organization and rebuild permissions
 * This invalidates the cache and rebuilds permissions for the new organization context
 */
export async function switchOrganization(organizationSlug: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // Verify user has access to this organization
    const organization = await prisma.organization.findUnique({
        where: { slug: organizationSlug },
        include: {
            members: {
                where: { userId: user.id }
            }
        }
    })

    if (!organization || organization.members.length === 0) {
        throw new Error('You do not have access to this organization')
    }

    // Invalidate user settings cache to force rebuild with new organization context
    const { invalidateUserSettingsPlus, buildUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(user.id)
    
    // Rebuild permissions immediately (this will include all organizations, but ensures fresh cache)
    await buildUserSettingsPlus()
}
