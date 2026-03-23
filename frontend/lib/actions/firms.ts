'use server'

import { createClient } from '@/utils/supabase/server'
import { FirmService } from '@/lib/firm-service'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import {
    canCreateNonSandboxFirm,
    requireNonSandboxFirmCreationAccess,
} from '@/lib/billing/firm-creation-gate'

export interface FirmOption {
    id: string
    name: string
    slug: string
    isDefault: boolean
    createdAt: string
    sandboxOnly: boolean
}

export interface CreateFirmData {
    name: string
    allowDomainAccess?: boolean
    allowedEmailDomain?: string | null
}

/**
 * Get all firms that the current user belongs to
 */
export async function getUserFirms(): Promise<FirmOption[]> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        redirect('/signin')
    }

    try {
        const firms = await FirmService.getUserFirms(user.id)

        return firms.map((firm: any) => {
            // Find the current user's membership to check isDefault
            const membership = firm.members.find((m: any) => m.userId === user.id)

            return {
                id: firm.id,
                name: firm.name,
                slug: firm.slug,
                isDefault: membership?.isDefault || false,
                createdAt: (firm.createdAt || new Date()).toISOString(),
                sandboxOnly: firm.sandboxOnly || false
            }
        })
    } catch (err) {
        logger.error('Error fetching user firms (V2)', err as Error)
        return []
    }
}

/**
 * Whether the signed-in user may create another non-sandbox firm
 * (at least one membership on a firm with active or trialing subscription).
 */
export async function getCanCreateAdditionalFirm(): Promise<boolean> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return false
    return canCreateNonSandboxFirm(user.id)
}

/**
 * Get the default firm slug for the current user
 */
export async function getDefaultFirmSlug(): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        return null
    }

    const defaultFirm = await FirmService.getDefaultFirm(user.id)
    return defaultFirm?.slug || null
}

/**
 * Get default firm slug and whether its onboarding is complete.
 */
export async function getDefaultFirmWithOnboardingStatus(): Promise<{
    slug: string | null
    onboardingComplete: boolean
}> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) return { slug: null, onboardingComplete: false }

    const defaultFirm = await FirmService.getDefaultFirm(user.id)
    const slug = defaultFirm?.slug ?? null

    const settings = defaultFirm?.settings as any
    const onboardingComplete = settings?.onboarding?.isComplete === true

    return { slug, onboardingComplete }
}

/**
 * Create a new firm for the current user
 */
export async function createFirm(data: CreateFirmData): Promise<FirmOption> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user || !user.email) {
        throw new Error('Unauthorized')
    }

    await requireNonSandboxFirmCreationAccess(user.id)

    const existingFirm = await prisma.firm.findFirst({
        where: {
            name: {
                equals: data.name,
                mode: 'insensitive'
            }
        }
    })

    if (existingFirm) {
        throw new Error('A firm with this name already exists')
    }

    const fullName = user.user_metadata?.full_name || ''
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0] || user.email.split('@')[0]
    const lastName = nameParts.slice(1).join(' ') || ''

    // Create firm + membership (V2)
    const firm = await FirmService.createFirmWithMember({
        firmName: data.name,
        userId: user.id,
        email: user.email,
        firstName,
        lastName,
        allowDomainAccess: data.allowDomainAccess,
        allowedEmailDomain: data.allowedEmailDomain
    })

    // Set as default
    await FirmService.setDefaultFirm(user.id, firm.id)

    // Invalidate cache
    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(user.id)

    revalidatePath('/d')

    return {
        id: firm.id,
        name: firm.name,
        slug: firm.slug,
        isDefault: true,
        createdAt: new Date().toISOString(),
        sandboxOnly: false
    }
}

/**
 * Switch to a different firm
 */
export async function switchFirm(firmSlug: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
        throw new Error('Unauthorized')
    }

    const firm = await prisma.firm.findUnique({
        where: { slug: firmSlug },
        include: {
            members: {
                where: { userId: user.id }
            }
        }
    })

    if (!firm || firm.members.length === 0) {
        throw new Error('You do not have access to this firm')
    }

    await FirmService.setDefaultFirm(user.id, firm.id)

    try {
        const { createAdminClient } = await import('@/utils/supabase/admin')
        const admin = createAdminClient()

        const personaSlug = firm.members[0]?.role || 'firm_member'

        logger.info('Updating JWT metadata for firm switch', { userId: user.id, firmId: firm.id, persona: personaSlug })

        await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
                ...user.user_metadata,
                active_firm_id: firm.id,
                active_firm_slug: firmSlug,
                active_persona: personaSlug
            },
            app_metadata: {
                ...user.app_metadata,
                active_firm_id: firm.id,
                active_persona: personaSlug
            }
        })
    } catch (jwtError) {
        logger.error('Failed to update JWT metadata during org switch', jwtError as Error)
        // We don't throw here to avoid blocking the switch if metadata update fails, 
        // but the user might experience stale permissions until next refresh.
    }

    // Invalidate cache
    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(user.id)
}

export interface FirmBranding {
    logoUrl?: string | null
    subtext?: string | null
    themeColor?: string | null
}

/**
 * Update firm. Firm admin only.
 */
export async function updateFirm(
    firmSlug: string,
    data: { name?: string; branding?: FirmBranding }
): Promise<void> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const firm = await prisma.firm.findUnique({
        where: { slug: firmSlug },
        select: { id: true, settings: true }
    })
    if (!firm) throw new Error('Firm not found')

    let payload: any = {}
    if (data.name !== undefined) payload.name = data.name

    if (data.branding !== undefined) {
        const current = (firm.settings as Record<string, unknown>) || {}
        const branding = {
            ...(current.branding as Record<string, unknown>),
            ...(data.branding.logoUrl !== undefined && { logoUrl: data.branding.logoUrl ?? null }),
            ...(data.branding.subtext !== undefined && { subtext: data.branding.subtext ?? null }),
            ...(data.branding.themeColor !== undefined && { themeColor: data.branding.themeColor ?? null }),
        }
        if (data.branding.themeColor !== undefined) (branding as any).brandColor = data.branding.themeColor ?? undefined
        payload.settings = { ...current, branding }
    }

    await FirmService.updateFirm(firm.id, user.id, payload)
    revalidatePath(`/d/f/${firmSlug}`)
}

/**
 * Delete firm.
 */
export async function deleteFirm(firmSlug: string): Promise<void> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw new Error('Unauthorized')

    const firm = await prisma.firm.findUnique({
        where: { slug: firmSlug },
        select: { id: true }
    })
    if (!firm) throw new Error('Firm not found')

    await FirmService.deleteFirm(firm.id, user.id)
    revalidatePath('/d')
}
