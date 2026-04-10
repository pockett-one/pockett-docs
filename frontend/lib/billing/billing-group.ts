import { prisma } from '@/lib/prisma'

/** Default max firms per paid subscription when `billingGroupFirmCap` is null. */
export const DEFAULT_BILLING_GROUP_FIRM_CAP = 1

/**
 * Firm that holds the Polar subscription and billing state for this workspace.
 * Satellites inherit access from their anchor.
 */
export async function resolveBillingAnchorFirmId(firmId: string): Promise<string> {
    const firm = await prisma.firm.findUnique({
        where: { id: firmId },
        select: { anchorFirmId: true, billingSharesSubscriptionFromFirmId: true },
    })
    if (!firm) return firmId
    return firm.anchorFirmId ?? firm.billingSharesSubscriptionFromFirmId ?? firmId
}

export type BillingAnchorRow = {
    id: string
    subscriptionStatus: string | null
    sandboxOnly: boolean
    anchorFirmId: string | null
    billingGroupFirmCap: number | null
    billingSharesSubscriptionFromFirmId: string | null
}

/**
 * Load the firm row used for subscription / gating (anchor if this firm is a satellite).
 */
export async function getFirmRowForBillingGate(firmId: string): Promise<BillingAnchorRow | null> {
    const firm = await prisma.firm.findUnique({
        where: { id: firmId },
        select: {
            id: true,
            subscriptionStatus: true,
            sandboxOnly: true,
            anchorFirmId: true,
            billingGroupFirmCap: true,
            billingSharesSubscriptionFromFirmId: true,
        },
    })
    if (!firm) return null

    const anchorId = firm.anchorFirmId ?? firm.billingSharesSubscriptionFromFirmId ?? firm.id
    if (anchorId === firm.id) {
        return firm
    }

    const anchor = await prisma.firm.findUnique({
        where: { id: anchorId },
        select: {
            id: true,
            subscriptionStatus: true,
            sandboxOnly: true,
            anchorFirmId: true,
            billingGroupFirmCap: true,
            billingSharesSubscriptionFromFirmId: true,
        },
    })
    return anchor
}

/** Total firms in this billing group (anchor + satellites). */
export async function countFirmsInBillingGroup(anchorFirmId: string): Promise<number> {
    return prisma.firm.count({
        where: {
            OR: [{ id: anchorFirmId }, { anchorFirmId }, { billingSharesSubscriptionFromFirmId: anchorFirmId }],
            deletedAt: null,
        },
    })
}

/** Returns firm ids under this anchor umbrella (anchor + one-level satellites). */
export async function listFirmIdsInBillingGroup(anchorFirmId: string): Promise<string[]> {
    const rows = await prisma.firm.findMany({
        where: {
            OR: [{ id: anchorFirmId }, { anchorFirmId }, { billingSharesSubscriptionFromFirmId: anchorFirmId }],
            deletedAt: null,
        },
        select: { id: true },
    })
    return rows.map((row) => row.id)
}

export function effectiveBillingGroupFirmCap(anchor: Pick<BillingAnchorRow, 'billingGroupFirmCap'>): number {
    const cap = anchor.billingGroupFirmCap
    if (cap == null || cap < 1) return DEFAULT_BILLING_GROUP_FIRM_CAP
    return cap
}
