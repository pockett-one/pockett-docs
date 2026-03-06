'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { logger } from '@/lib/logger'

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
 * Get domain onboarding options for current user (V2)
 */
export async function getDomainOnboardingOptionsForCurrentUser(): Promise<DomainOnboardingOptions | null> {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user?.email) {
        redirect('/signin')
    }
    return getDomainOnboardingOptions(user.id, user.email)
}

function emailDomain(email: string): string | null {
    const part = email.split('@')[1]
    return part ? part.toLowerCase().trim() : null
}

/**
 * Get orgs by domain (V2)
 */
export async function getDomainOnboardingOptions(
    userId: string,
    userEmail: string
): Promise<DomainOnboardingOptions> {
    const domain = emailDomain(userEmail)
    if (!domain) return { orgsToJoin: [], orgsAlreadyIn: [] }

    const orgs = await (prisma as any).organization.findMany({
        where: {
            allowDomainAccess: true,
            allowedEmailDomain: domain
        },
        select: { id: true, name: true, slug: true }
    })

    if (orgs.length === 0) return { orgsToJoin: [], orgsAlreadyIn: [] }

    const memberships = await (prisma as any).orgMember.findMany({
        where: {
            userId,
            organizationId: { in: orgs.map((o: any) => o.id) }
        },
        select: { organizationId: true }
    })
    const inSet = new Set(memberships.map((m: any) => m.organizationId))

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
 * Join org by domain (V2)
 */
export async function joinOrganizationByDomain(
    organizationId: string
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user?.email) {
        return { ok: false, error: 'Unauthorized' }
    }
    const userId = user.id
    const domain = emailDomain(user.email)
    if (!domain) {
        return { ok: false, error: 'Invalid email' }
    }

    const org = await (prisma as any).organization.findUnique({
        where: { id: organizationId },
        select: { id: true, slug: true, allowDomainAccess: true, allowedEmailDomain: true }
    })
    if (!org) {
        return { ok: false, error: 'Organization not found' }
    }
    if (!org.allowDomainAccess || (org.allowedEmailDomain || '').toLowerCase() !== domain) {
        return { ok: false, error: 'Domain not allowed' }
    }

    const existing = await (prisma as any).orgMember.findFirst({
        where: { organizationId, userId }
    })
    if (existing) {
        return { ok: true, slug: org.slug }
    }

    // Default persona for domain joins = org_member (V2)
    const orgMemberPersona = await (prisma as any).persona.findUnique({
        where: { slug: 'org_member' }
    })
    if (!orgMemberPersona) {
        logger.error('Missing org_member persona in platform system')
        return { ok: false, error: 'System configuration error' }
    }

    const hasAnyOrg = await (prisma as any).orgMember.findFirst({
        where: { userId },
        select: { id: true }
    })

    await (prisma as any).orgMember.create({
        data: {
            userId,
            organizationId: org.id,
            personaId: orgMemberPersona.id,
            isDefault: !hasAnyOrg
        }
    })

    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(userId)

    return { ok: true, slug: org.slug }
}
