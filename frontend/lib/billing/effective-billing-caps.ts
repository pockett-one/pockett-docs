import { prisma } from '@/lib/prisma'
import { resolveBillingAnchorFirmId, countFirmsInBillingGroup, type BillingAnchorRow } from '@/lib/billing/billing-group'
import {
    getDefaultCapsForPlanColumn,
    resolvePlanColumnFromSubscription,
} from '@/lib/billing/plan-default-caps'
type PolarSubscriptionStatusForCaps = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none'

function enforceBillingCaps(): boolean {
    return (
        process.env.ENFORCE_BILLING_CAPS === 'true' ||
        process.env.ENFORCE_BILLING_GATES === 'true'
    )
}

const ELIGIBLE: PolarSubscriptionStatusForCaps[] = ['active', 'trialing']

export type AnchorCapsRow = Pick<
    BillingAnchorRow,
    'id' | 'sandboxOnly' | 'billingGroupFirmCap' | 'billingSharesSubscriptionFromFirmId'
> & {
    billingActiveEngagementCap: number | null
    billingCapsLocked: boolean
    subscriptionStatus: string | null
    subscriptionPlan: string | null
}

export async function loadAnchorForCaps(firmId: string): Promise<AnchorCapsRow | null> {
    const anchorId = await resolveBillingAnchorFirmId(firmId)
    return prisma.firm.findUnique({
        where: { id: anchorId },
        select: {
            id: true,
            sandboxOnly: true,
            billingGroupFirmCap: true,
            billingSharesSubscriptionFromFirmId: true,
            billingActiveEngagementCap: true,
            billingCapsLocked: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
        },
    })
}

export function effectiveActiveEngagementCap(anchor: AnchorCapsRow): number {
    if (anchor.sandboxOnly) {
        return getDefaultCapsForPlanColumn('sandbox').activeEngagementCap
    }
    if (anchor.billingActiveEngagementCap != null && anchor.billingActiveEngagementCap >= 0) {
        return anchor.billingActiveEngagementCap
    }
    const col = resolvePlanColumnFromSubscription(anchor.subscriptionPlan, null)
    return getDefaultCapsForPlanColumn(col).activeEngagementCap
}

export function effectiveFirmGroupCapForAnchor(anchor: AnchorCapsRow): number {
    if (anchor.sandboxOnly) {
        return getDefaultCapsForPlanColumn('sandbox').firmGroupCap
    }
    if (anchor.billingGroupFirmCap != null && anchor.billingGroupFirmCap >= 1) {
        return anchor.billingGroupFirmCap
    }
    const col = resolvePlanColumnFromSubscription(anchor.subscriptionPlan, null)
    return getDefaultCapsForPlanColumn(col).firmGroupCap
}

/**
 * After Polar subscription sync: write defaults onto anchor for grandfathering (unless locked).
 */
export async function applyBillingCapsAfterPolarSubscriptionSync(params: {
    anchorFirmId: string
    productId: string | null
    planName: string | null
    status: PolarSubscriptionStatusForCaps
}): Promise<void> {
    const anchor = await prisma.firm.findUnique({
        where: { id: params.anchorFirmId },
        select: { billingCapsLocked: true, sandboxOnly: true },
    })
    if (!anchor || anchor.billingCapsLocked || anchor.sandboxOnly) return
    if (!ELIGIBLE.includes(params.status)) return

    const col = resolvePlanColumnFromSubscription(params.planName, params.productId)
    const caps = getDefaultCapsForPlanColumn(col)

    await prisma.firm.update({
        where: { id: params.anchorFirmId },
        data: {
            billingActiveEngagementCap: caps.activeEngagementCap,
            billingGroupFirmCap: caps.firmGroupCap,
        },
    })
}

export async function assertWithinActiveEngagementCap(workspaceFirmId: string): Promise<void> {
    if (!enforceBillingCaps()) return

    const anchor = await loadAnchorForCaps(workspaceFirmId)
    if (!anchor) throw new Error('Firm not found')
    if (anchor.sandboxOnly) return

    const cap = effectiveActiveEngagementCap(anchor)
    const count = await prisma.engagement.count({
        where: {
            firmId: workspaceFirmId,
            deletedAt: null,
            isDeleted: false,
            status: 'ACTIVE',
        },
    })
    if (count >= cap) {
        throw new Error(
            `Your plan allows ${cap} active engagement${cap === 1 ? '' : 's'}. Close or complete one to add another, upgrade, or contact support for a higher limit.`
        )
    }
}

/** Firm workspaces allowed for this billing anchor (anchor + satellites). */
export async function assertWithinFirmGroupCap(anchorFirmId: string): Promise<void> {
    if (!enforceBillingCaps()) return

    const anchor = await loadAnchorForCaps(anchorFirmId)
    if (!anchor || anchor.sandboxOnly) return

    const cap = effectiveFirmGroupCapForAnchor(anchor)
    const n = await countFirmsInBillingGroup(anchorFirmId)
    if (n >= cap) {
        throw new Error(
            `Your subscription allows ${cap} firm workspace${cap === 1 ? '' : 's'}. Upgrade or contact support to add more.`
        )
    }
}
