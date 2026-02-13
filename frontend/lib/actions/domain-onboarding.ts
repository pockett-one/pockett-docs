'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Get domain onboarding options for the current session user.
 * Redirects to signin if not authenticated. Returns null if no domain match.
 */
export async function getDomainOnboardingOptionsForCurrentUser(): Promise<DomainOnboardingOptions | null> {
    const supabase = await createClient()
    const {
        data: { user },
        error
    } = await supabase.auth.getUser()
    if (error || !user?.email) {
        redirect('/signin')
    }
    return getDomainOnboardingOptions(user.id, user.email)
}

export interface DomainOrgOption {
    id: string
    name: string
    slug: string
}

export interface DomainOnboardingOptions {
    orgsToJoin: DomainOrgOption[]
    orgsAlreadyIn: DomainOrgOption[]
}

/**
 * Derive email domain from address (lowercase, after @).
 */
function emailDomain(email: string): string | null {
    const part = email.split('@')[1]
    return part ? part.toLowerCase().trim() : null
}

/**
 * Get orgs that allow the user's email domain: those they can join (not yet member)
 * and those they're already in. Used to drive domain-choice onboarding.
 */
export async function getDomainOnboardingOptions(
    userId: string,
    userEmail: string
): Promise<DomainOnboardingOptions> {
    const domain = emailDomain(userEmail)
    if (!domain) return { orgsToJoin: [], orgsAlreadyIn: [] }

    const orgs = await prisma.organization.findMany({
        where: {
            allowDomainAccess: true,
            allowedEmailDomain: domain
        },
        select: { id: true, name: true, slug: true }
    })

    if (orgs.length === 0) return { orgsToJoin: [], orgsAlreadyIn: [] }

    const memberships = await prisma.organizationMember.findMany({
        where: {
            userId,
            organizationId: { in: orgs.map((o) => o.id) }
        },
        select: { organizationId: true }
    })
    const inSet = new Set(memberships.map((m) => m.organizationId))

    const orgsAlreadyIn: DomainOrgOption[] = []
    const orgsToJoin: DomainOrgOption[] = []
    for (const org of orgs) {
        const option = { id: org.id, name: org.name, slug: org.slug }
        if (inSet.has(org.id)) orgsAlreadyIn.push(option)
        else orgsToJoin.push(option)
    }

    return { orgsToJoin, orgsAlreadyIn }
}

/**
 * Join an organization by domain: create one organization_member row (org-level persona).
 * No-op if already a member. Uses org_owner persona for now.
 * Domain is verified against the authenticated user's email.
 */
export async function joinOrganizationByDomain(
    organizationId: string
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
    const supabase = await createClient()
    const {
        data: { user },
        error: authError
    } = await supabase.auth.getUser()
    if (authError || !user?.email) {
        return { ok: false, error: 'Unauthorized' }
    }
    const userId = user.id
    const domain = emailDomain(user.email)
    if (!domain) {
        return { ok: false, error: 'Invalid email' }
    }

    const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: {
            id: true,
            slug: true,
            allowDomainAccess: true,
            allowedEmailDomain: true
        }
    })
    if (!org) {
        return { ok: false, error: 'Organization not found' }
    }
    if (!org.allowDomainAccess || (org.allowedEmailDomain || '').toLowerCase() !== domain) {
        return { ok: false, error: 'Domain not allowed for this organization' }
    }

    const existing = await prisma.organizationMember.findUnique({
        where: {
            organizationId_userId: { organizationId, userId }
        }
    })
    if (existing) {
        return { ok: true, slug: org.slug }
    }

    // Check if user already has any org (to determine isDefault)
    const hasAnyOrg = await prisma.organizationMember.findFirst({
        where: { userId },
        select: { id: true }
    })

    // Domain-joined users are regular org members (not owners)
    // They get organizationPersonaId = null (no special persona at org level)
    // Their permissions come from project-level personas when added to projects
    await prisma.organizationMember.create({
        data: {
            userId,
            organizationId: org.id,
            organizationPersonaId: null, // Regular member, not org_owner
            isDefault: !hasAnyOrg
        }
    })

    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(userId)
    revalidatePath('/d')

    return { ok: true, slug: org.slug }
}
