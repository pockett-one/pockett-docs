import { Polar } from '@polar-sh/sdk'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { ensurePolarFreePlanForSandboxFirm } from '@/lib/billing/polar-free-plan'

function polarServer(): 'production' | 'sandbox' {
    return process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'
}

function polarClient(): Polar | null {
    const token = process.env.POLAR_ACCESS_TOKEN?.trim()
    if (!token) return null
    return new Polar({ accessToken: token, server: polarServer() })
}

/**
 * After a paid subscription is active/trialing, revoke any *other* active Polar subscription
 * on the same customer for POLAR_FREE_PRODUCT_ID so the customer is not double-subscribed.
 */
export async function revokeOtherFreePolarSubscriptions(params: {
    anchorFirmId: string
    keepSubscriptionId: string
}): Promise<void> {
    const freeProductId = process.env.POLAR_FREE_PRODUCT_ID?.trim()
    if (!freeProductId) return

    const polar = polarClient()
    if (!polar) {
        logger.warn('[polar-billing-lifecycle] Skipping free-sub revoke: POLAR_ACCESS_TOKEN missing')
        return
    }

    let state: Awaited<ReturnType<Polar['customers']['getStateExternal']>>
    try {
        state = await polar.customers.getStateExternal({ externalId: params.anchorFirmId })
    } catch (e) {
        logger.warn('[polar-billing-lifecycle] getStateExternal failed; cannot revoke free subs', {
            anchorFirmId: params.anchorFirmId,
            message: e instanceof Error ? e.message : String(e),
        })
        return
    }

    const active = state.activeSubscriptions ?? []
    for (const sub of active) {
        if (sub.productId !== freeProductId) continue
        if (sub.id === params.keepSubscriptionId) continue
        try {
            await polar.subscriptions.revoke({ id: sub.id })
            logger.warn('[polar-billing-lifecycle] Revoked free Polar subscription after paid plan took over', {
                anchorFirmId: params.anchorFirmId,
                revokedSubscriptionId: sub.id,
                keptSubscriptionId: params.keepSubscriptionId,
            })
        } catch (e) {
            logger.error(
                '[polar-billing-lifecycle] Failed to revoke free Polar subscription',
                e instanceof Error ? e : new Error(String(e)),
                undefined,
                { anchorFirmId: params.anchorFirmId, subscriptionId: sub.id }
            )
        }
    }
}

/**
 * When a paid subscription ends (canceled/revoked), re-provision the sandbox anchor’s free Polar
 * subscription so the firm row can show an active free tier again.
 */
export async function resyncSandboxFreePlanAfterPaidSubscriptionEnd(anchorFirmId: string): Promise<void> {
    const firm = await prisma.firm.findFirst({
        where: { id: anchorFirmId, deletedAt: null },
        select: { sandboxOnly: true },
    })
    if (!firm?.sandboxOnly) return

    // Users/emails live in Supabase, not Prisma; free-plan restore uses existing Polar customer when present.
    const userEmail = `billing-resync+${anchorFirmId.replace(/-/g, '').slice(0, 12)}@sandbox.invalid`

    try {
        await ensurePolarFreePlanForSandboxFirm({
            firmId: anchorFirmId,
            userEmail,
        })
        logger.warn('[polar-billing-lifecycle] Resynced sandbox free Polar plan after paid subscription ended', {
            anchorFirmId,
        })
    } catch (e) {
        logger.error(
            '[polar-billing-lifecycle] Failed to resync sandbox free plan after paid subscription ended',
            e instanceof Error ? e : new Error(String(e)),
            undefined,
            { anchorFirmId }
        )
    }
}

export type PaidSubscriptionSyncContext = {
    anchorFirmId: string
    subscriptionId: string | null
    productId: string | null
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | 'none'
}

/** If the firm is on a paid (non-free) active subscription, revoke duplicate free subs in Polar. */
export async function maybeRevokeFreePolarAfterPaidSubscriptionSync(ctx: PaidSubscriptionSyncContext): Promise<void> {
    const freeProductId = process.env.POLAR_FREE_PRODUCT_ID?.trim()
    if (!freeProductId || !ctx.subscriptionId || !ctx.productId) return
    if (ctx.productId === freeProductId) return
    if (ctx.status !== 'active' && ctx.status !== 'trialing') return

    await revokeOtherFreePolarSubscriptions({
        anchorFirmId: ctx.anchorFirmId,
        keepSubscriptionId: ctx.subscriptionId,
    })
}
