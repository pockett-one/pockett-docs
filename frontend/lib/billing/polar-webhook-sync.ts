import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { resolveBillingAnchorFirmId } from '@/lib/billing/billing-group'
import { pricingModelFromRecurringFlag } from '@/lib/billing/pricing-model'

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none'

type UnknownRecord = Record<string, unknown>

function asRecord(value: unknown): UnknownRecord | null {
    if (!value || typeof value !== 'object') return null
    return value as UnknownRecord
}

function asString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
}

function asDate(value: unknown): Date | null {
    const str = asString(value)
    if (!str) return null
    const date = new Date(str)
    return Number.isNaN(date.getTime()) ? null : date
}

function metadataFirmId(payload: UnknownRecord): string | null {
    const metadata = asRecord(payload.metadata)
    if (!metadata) return null
    return asString(metadata.firmId)
}

/**
 * Polar Next.js webhooks pass `{ type, timestamp, data: Subscription }`.
 * Accept either that shape or a bare subscription-like object.
 */
export function getSubscriptionBodyFromWebhookPayload(payload: unknown): UnknownRecord | null {
    const raw = asRecord(payload)
    if (!raw) return null
    const nested = asRecord(raw.data)
    if (nested && typeof nested.id === 'string') {
        return nested
    }
    if (typeof raw.id === 'string') {
        return raw
    }
    return nested
}

export function mapPolarSubscriptionStatusToDb(status: unknown): SubscriptionStatus {
    const raw = status == null ? '' : String(status)
    const n = raw.toLowerCase().replace(/-/g, '_')
    if (n === 'active') return 'active'
    if (n === 'trialing') return 'trialing'
    if (n === 'past_due') return 'past_due'
    if (n === 'canceled' || n === 'cancelled') return 'canceled'
    if (n === 'unpaid') return 'unpaid'
    if (n === 'incomplete') return 'trialing'
    if (n === 'incomplete_expired') return 'canceled'
    return 'none'
}

function extractSubscriptionDetails(body: UnknownRecord) {
    const customer = asRecord(body.customer)
    const product = asRecord(body.product)

    return {
        subscriptionId: asString(body.id) ?? asString(body.subscriptionId),
        customerId:
            asString(body.customerId) ??
            asString(body.customer_id) ??
            asString(customer?.id),
        customerExternalId:
            asString(body.customerExternalId) ??
            asString(body.customer_external_id) ??
            asString(body.externalCustomerId) ??
            asString(customer?.externalId) ??
            asString(customer?.external_id) ??
            metadataFirmId(body),
        productId: asString(body.productId) ?? asString(product?.id),
        planName:
            asString(body.productName) ??
            asString(product?.name) ??
            asString(body.productId),
        periodEnd:
            asDate(body.currentPeriodEnd) ??
            asDate(body.current_period_end) ??
            asDate(body.endsAt) ??
            asDate(body.endedAt),
    }
}

async function resolveFirmForPayload(details: ReturnType<typeof extractSubscriptionDetails>) {
    if (details.customerExternalId) {
        const firm = await prisma.firm.findUnique({
            where: { id: details.customerExternalId },
            select: { id: true },
        })
        if (firm) return firm.id
    }

    if (details.customerId) {
        const firm = await prisma.firm.findFirst({
            where: { polarCustomerId: details.customerId },
            select: { id: true },
        })
        if (firm) return firm.id
    }

    if (details.subscriptionId) {
        const firm = await prisma.firm.findFirst({
            where: { polarSubscriptionId: details.subscriptionId },
            select: { id: true },
        })
        if (firm) return firm.id
    }

    return null
}

export type PolarSubscriptionSyncResult = {
    anchorFirmId: string
    subscriptionId: string | null
    productId: string | null
    status: SubscriptionStatus
}

/**
 * Maps Polar subscription webhooks → billing anchor firm row.
 * Returns context for post-sync hooks (revoke free tier, resync sandbox free, etc.).
 */
export async function syncFirmSubscriptionFromPolarEvent(
    payload: unknown,
    options?: { statusOverride?: SubscriptionStatus }
): Promise<PolarSubscriptionSyncResult | null> {
    const body = getSubscriptionBodyFromWebhookPayload(payload)
    if (!body) {
        logger.warn('Polar webhook: could not parse subscription payload')
        return null
    }

    const details = extractSubscriptionDetails(body)
    const resolvedFirmId = await resolveFirmForPayload(details)
    if (!resolvedFirmId) {
        logger.warn('Polar webhook: no firm mapping found', {
            customerExternalId: details.customerExternalId,
            customerId: details.customerId,
            subscriptionId: details.subscriptionId,
        })
        return null
    }

    const anchorFirmId = await resolveBillingAnchorFirmId(resolvedFirmId)
    const status = options?.statusOverride ?? mapPolarSubscriptionStatusToDb(body.status)

    await prisma.firm.update({
        where: { id: anchorFirmId },
        data: {
            subscriptionStatus: status,
            subscriptionProvider: 'polar',
            pricingModel: pricingModelFromRecurringFlag(true),
            polarCustomerId: details.customerId ?? undefined,
            polarSubscriptionId: details.subscriptionId ?? undefined,
            polarOrderId: null,
            subscriptionPlan: details.planName ?? undefined,
            subscriptionCurrentPeriodEnd: details.periodEnd ?? undefined,
        },
    })

    logger.warn('Polar webhook synced firm subscription', {
        status,
        resolvedFirmId,
        anchorFirmId,
        subscriptionId: details.subscriptionId,
        customerId: details.customerId,
        productId: details.productId,
    })

    return {
        anchorFirmId,
        subscriptionId: details.subscriptionId,
        productId: details.productId,
        status,
    }
}
