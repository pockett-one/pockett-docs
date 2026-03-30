import { prisma } from '@/lib/prisma'
import { countFirmsInBillingGroup, resolveBillingAnchorFirmId } from '@/lib/billing/billing-group'
import {
    anchorUsesSandboxCapDefaults,
    effectiveFirmGroupCapForAnchor,
    loadAnchorForCaps,
} from '@/lib/billing/effective-billing-caps'

const ELIGIBLE_STATUSES = ['active', 'trialing'] as const
const ELIGIBLE_PRICING_MODELS = ['recurring_subscription'] as const

/**
 * Non-sandbox firm creation requires at least one paid/trialing subscription
 * on any firm the user belongs to.
 */
export async function canCreateNonSandboxFirm(userId: string): Promise<boolean> {
    const memberships = await prisma.firmMember.findMany({
        where: {
            userId,
            firm: {
                deletedAt: null,
                subscriptionStatus: { in: [...ELIGIBLE_STATUSES] },
                pricingModel: { in: [...ELIGIBLE_PRICING_MODELS] },
            },
        },
        select: { firmId: true },
    })
    if (memberships.length === 0) return false

    const checkedAnchors = new Set<string>()
    for (const membership of memberships) {
        const anchorId = await resolveBillingAnchorFirmId(membership.firmId)
        if (!anchorId || checkedAnchors.has(anchorId)) continue
        checkedAnchors.add(anchorId)

        const anchor = await loadAnchorForCaps(anchorId)
        if (!anchor || anchorUsesSandboxCapDefaults(anchor)) continue

        const cap = effectiveFirmGroupCapForAnchor(anchor)
        const used = await countFirmsInBillingGroup(anchorId)
        if (used < cap) return true
    }

    return false
}

export async function requireNonSandboxFirmCreationAccess(userId: string): Promise<void> {
    const ok = await canCreateNonSandboxFirm(userId)
    if (!ok) {
        throw new Error('Upgrade to Standard to create a new firm outside the Free Sandbox.')
    }
}
