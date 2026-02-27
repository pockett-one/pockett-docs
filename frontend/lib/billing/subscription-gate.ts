import { prisma } from '@/lib/prisma'
import {
  type PlanTier,
  type FeatureFlagKey,
  FEATURE_FLAGS,
  planMeetsRequirement,
} from './feature-flags'

export type { PlanTier }

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'none'

/** Statuses that grant full access to paid plan features. */
const ACTIVE_STATUSES: SubscriptionStatus[] = ['active', 'trialing']

/**
 * Checks whether an organization has access to a specific feature.
 *
 * Access requires:
 *   1. The org's planTier meets the feature's minPlan requirement.
 *   2. The org's subscriptionStatus is active or trialing (for paid plans).
 *      Standard plan features are always accessible regardless of status.
 */
export async function checkFeatureAccess(
  organizationId: string,
  feature: FeatureFlagKey
): Promise<boolean> {
  const flag = FEATURE_FLAGS[feature]

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { planTier: true, subscriptionStatus: true },
  })

  if (!org) return false

  const tier = (org.planTier ?? 'standard') as PlanTier
  const status = (org.subscriptionStatus ?? 'none') as SubscriptionStatus

  // Standard-tier features are always accessible (no subscription required)
  if (flag.minPlan === 'standard') return true

  // Paid plan: subscription must be active or trialing
  if (!ACTIVE_STATUSES.includes(status)) return false

  return planMeetsRequirement(tier, flag.minPlan)
}

/**
 * Returns the org's current plan tier and subscription status.
 * Falls back to 'standard' / 'none' if the org is not found.
 */
export async function getOrgPlan(
  organizationId: string
): Promise<{ tier: PlanTier; status: SubscriptionStatus }> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { planTier: true, subscriptionStatus: true },
  })

  return {
    tier: ((org?.planTier ?? 'standard') as PlanTier),
    status: ((org?.subscriptionStatus ?? 'none') as SubscriptionStatus),
  }
}
