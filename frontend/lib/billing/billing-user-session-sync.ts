import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { listFirmIdsInBillingGroup } from '@/lib/billing/billing-group'
import { userSettingsPlus } from '@/lib/user-settings-plus'
import { createAdminClient } from '@/utils/supabase/admin'

/** Snapshot stored under `app_metadata.billing_by_anchor[anchorFirmId]` for gating / client hints. */
export type BillingAnchorJwtSnapshot = {
    anchorFirmId: string
    subscriptionStatus: string | null
    subscriptionPlan: string | null
    pricingModel: string | null
    subscriptionCurrentPeriodEnd: string | null
    polarSubscriptionId: string | null
    billingActiveEngagementCap: number | null
    billingGroupFirmCap: number | null
    /** Copy of active `platform.subscriptions.settings.metadata` (e.g. entitledEngagements). */
    productMetadata: Record<string, unknown>
}

/**
 * After any billing change for an anchor (Polar webhooks for paid subs, Polar API→DB free-tier provision, resync):
 * - Invalidates server-side UserSettingsPlus (rebuilds `planEntitlementsByFirm` from DB on next read).
 * - Merges each affected user's JWT `app_metadata` with `billing_by_anchor[anchorFirmId]` and legacy
 *   `plan_entitlements` (product metadata only) so sessions pick up caps/plan without a full re-login.
 *
 * Always reads existing `app_metadata` via getUserById before merge (safe with concurrent updates).
 */
export async function refreshBillingPlanForFirmGroupUsers(anchorFirmId: string): Promise<void> {
    try {
        const groupFirmIds = await listFirmIdsInBillingGroup(anchorFirmId)
        const members = await prisma.firmMember.findMany({
            where: { firmId: { in: groupFirmIds } },
            select: { userId: true },
        })
        const userIds = Array.from(new Set(members.map((m) => m.userId)))
        if (userIds.length === 0) return

        userSettingsPlus.invalidateUsers(userIds)

        const anchor = await prisma.firm.findUnique({
            where: { id: anchorFirmId },
            select: {
                billingActiveEngagementCap: true,
                billingGroupFirmCap: true,
            },
        })

        const activeSubscription = await prisma.subscription.findFirst({
            where: { firmId: anchorFirmId, active: true, deletedAt: null },
            orderBy: { updatedAt: 'desc' },
            select: {
                status: true,
                plan: true,
                pricingModel: true,
                currentPeriodEnd: true,
                polarSubscriptionId: true,
                settings: true,
            },
        })
        const subSettings = (activeSubscription?.settings as Record<string, unknown> | null) ?? {}
        const productMetadata =
            subSettings &&
            typeof subSettings === 'object' &&
            subSettings.metadata &&
            typeof subSettings.metadata === 'object'
                ? ({ ...(subSettings.metadata as Record<string, unknown>) } as Record<string, unknown>)
                : {}

        const snapshot: BillingAnchorJwtSnapshot = {
            anchorFirmId,
            subscriptionStatus: activeSubscription?.status ?? null,
            subscriptionPlan: activeSubscription?.plan ?? null,
            pricingModel: activeSubscription?.pricingModel ?? null,
            subscriptionCurrentPeriodEnd: activeSubscription?.currentPeriodEnd?.toISOString() ?? null,
            polarSubscriptionId: activeSubscription?.polarSubscriptionId ?? null,
            billingActiveEngagementCap: anchor?.billingActiveEngagementCap ?? null,
            billingGroupFirmCap: anchor?.billingGroupFirmCap ?? null,
            productMetadata,
        }

        const admin = createAdminClient()
        const updatedAt = new Date().toISOString()

        await Promise.all(
            userIds.map(async (userId) => {
                try {
                    const { data } = await admin.auth.admin.getUserById(userId)
                    const existing = (data?.user?.app_metadata ?? {}) as Record<string, unknown>
                    const prevByAnchorRaw = existing.billing_by_anchor
                    const prevByAnchor =
                        prevByAnchorRaw && typeof prevByAnchorRaw === 'object' && !Array.isArray(prevByAnchorRaw)
                            ? { ...(prevByAnchorRaw as Record<string, unknown>) }
                            : {}
                    prevByAnchor[anchorFirmId] = { ...snapshot }

                    await admin.auth.admin.updateUserById(userId, {
                        app_metadata: {
                            ...existing,
                            billing_by_anchor: prevByAnchor,
                            billing_context_updated_at: updatedAt,
                            plan_entitlements: productMetadata,
                            plan_entitlements_updated_at: updatedAt,
                        },
                    })
                } catch (error) {
                    logger.warn('Failed to refresh billing JWT for user', {
                        userId,
                        anchorFirmId,
                        message: error instanceof Error ? error.message : String(error),
                    })
                }
            })
        )
    } catch (error) {
        logger.warn('Failed to refresh billing plan for firm group users', {
            anchorFirmId,
            message: error instanceof Error ? error.message : String(error),
        })
    }
}
