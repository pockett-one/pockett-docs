'use server'

import { createClient } from '@/utils/supabase/server'
import { OrganizationService } from '@/lib/organization-service'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export interface OrganizationOption {
    id: string
    name: string
    slug: string
    isDefault: boolean
    createdAt: string
    sandboxOnly: boolean
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

    try {
        // Use the refactored OrganizationService which uses RLS (V2)
        const organizations = await OrganizationService.getUserOrganizations()

        // Create options from the returned organizations
        // The service already maps to a consistent interface
        return organizations.map(org => {
            // Find the current user's membership to check isDefault
            const membership = org.members.find(m => m.userId === user.id)

            return {
                id: org.id,
                name: org.name,
                slug: org.slug,
                isDefault: membership?.isDefault || false,
                createdAt: (org.createdAt || new Date()).toISOString(),
                sandboxOnly: org.sandboxOnly || false
            }
        })
    } catch (err) {
        logger.error('Error fetching user organizations (V2)', err as Error)
        return []
    }
}

/**
 * Get the default organization slug for the current user
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

    // Check onboarding status from settings
    const settings = defaultOrg?.settings as any
    const onboardingComplete = settings?.onboarding?.isComplete === true

    return { slug, onboardingComplete }
}

/**
 * Create a new organization for the current user
 */
export async function createOrganization(data: CreateOrganizationData): Promise<OrganizationOption> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || !user.email) {
        throw new Error('Unauthorized')
    }

    // Check for duplicate organization name (V2)
    const existingOrg = await (prisma as any).organization.findFirst({
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

    const fullName = user.user_metadata?.full_name || ''
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || user.email.split('@')[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Create using OrganizationService (V2)
    const org = await OrganizationService.createOrganizationWithMember({
        organizationName: data.name,
        userId: user.id,
        email: user.email,
        firstName,
        lastName,
        allowDomainAccess: data.allowDomainAccess,
        allowedEmailDomain: data.allowedEmailDomain
    })

    // Set as default
    await OrganizationService.setDefaultOrganization(user.id, org.id)

    // Invalidate cache
    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(user.id)

    revalidatePath('/d')

    return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        isDefault: true,
        createdAt: new Date().toISOString(),
        sandboxOnly: false
    }
}

/**
 * Switch to a different organization
 */
export async function switchOrganization(organizationSlug: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    // Verify access (V2)
    const organization = await (prisma as any).organization.findUnique({
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

    // Unset other defaults and set this one as default
    await OrganizationService.setDefaultOrganization(user.id, organization.id)

    // Invalidate cache
    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(user.id)
}

export interface OrganizationBranding {
    logoUrl?: string | null
    subtext?: string | null
    themeColor?: string | null
}

/**
 * Update organization. Org admin only.
 */
export async function updateOrganization(
    organizationSlug: string,
    data: { name?: string; branding?: OrganizationBranding }
): Promise<void> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const org = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true, settings: true }
    })
    if (!org) throw new Error('Organization not found')

    let payload: any = {}
    if (data.name !== undefined) payload.name = data.name

    if (data.branding !== undefined) {
        const current = (org.settings as Record<string, unknown>) || {}
        const branding = {
            ...(current.branding as Record<string, unknown>),
            ...(data.branding.logoUrl !== undefined && { logoUrl: data.branding.logoUrl ?? null }),
            ...(data.branding.subtext !== undefined && { subtext: data.branding.subtext ?? null }),
            ...(data.branding.themeColor !== undefined && { themeColor: data.branding.themeColor ?? null }),
        }
        if (data.branding.themeColor !== undefined) (branding as any).brandColor = data.branding.themeColor ?? undefined
        payload.settings = { ...current, branding }
    }

    await OrganizationService.updateOrganization(org.id, user.id, payload)
    revalidatePath(`/d/o/${organizationSlug}`)
}

/**
 * Delete organization.
 */
export async function deleteOrganization(organizationSlug: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const org = await (prisma as any).organization.findUnique({
        where: { slug: organizationSlug },
        select: { id: true }
    })
    if (!org) throw new Error('Organization not found')

    await OrganizationService.deleteOrganization(org.id, user.id)
    revalidatePath('/d')
}
