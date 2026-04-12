import { prisma } from '@/lib/prisma'
import { resolveBillingAnchorFirmId } from '@/lib/billing/billing-group'

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
    return value && typeof value === 'object' ? (value as JsonRecord) : {}
}

function parseIntLike(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value)
    if (typeof value === 'string' && value.trim().length > 0) {
        const n = Number.parseInt(value.trim(), 10)
        return Number.isNaN(n) ? null : n
    }
    return null
}

export async function getActiveSubscriptionMetadataForFirm(firmId: string): Promise<JsonRecord> {
    const anchorFirmId = await resolveBillingAnchorFirmId(firmId)
    const row = await prisma.subscription.findFirst({
        where: {
            firmId: anchorFirmId,
            active: true,
            deletedAt: null,
        },
        orderBy: { updatedAt: 'desc' },
        select: { settings: true },
    })
    return asRecord(asRecord(row?.settings).metadata)
}

/**
 * Returns null when unlimited (-1) or not configured.
 */
export async function getEntitledEngagementsCapForFirm(firmId: string): Promise<number | null> {
    const metadata = await getActiveSubscriptionMetadataForFirm(firmId)
    const parsed = parseIntLike(metadata.entitledEngagements)
    if (parsed == null || parsed < 0) return null
    return parsed
}

