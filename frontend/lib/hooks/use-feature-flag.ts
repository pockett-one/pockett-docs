'use client'

/**
 * useFeatureFlag — client-side hook for plan-gated feature checks.
 *
 * Usage:
 *   const { enabled, planLocked, requiredPlan } = useFeatureFlag('feature:approval_workflow', orgPlan)
 *
 * orgPlan can be obtained from the organization permissions API:
 *   const { plan: orgPlan } = useOrgPermissions(orgId)
 *
 * Or from the useOrgPlan() helper below when you only need the plan.
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  type PlanTier,
  type FeatureFlagKey,
  type SubscriptionStatus,
  FEATURE_FLAGS,
  planMeetsRequirement,
} from '@/lib/billing/feature-flags'

export interface OrgPlan {
  tier: PlanTier
  status: SubscriptionStatus
}

export interface FeatureFlagResult {
  /** True when the org's plan meets or exceeds the feature's minimum plan. */
  enabled: boolean
  /** True when plan check fails. Element should be shown greyed out with an upgrade badge. */
  planLocked: boolean
  /** The minimum plan required to unlock this feature (for badge display). */
  requiredPlan: PlanTier
  loading: boolean
}

/**
 * Pure plan check — no data fetching. Pass the orgPlan you already have.
 *
 * @param featureKey - Key from FEATURE_FLAGS (e.g. 'feature:approval_workflow')
 * @param orgPlan    - The org's current plan, or null while loading
 */
export function useFeatureFlag(
  featureKey: FeatureFlagKey,
  orgPlan: OrgPlan | null
): FeatureFlagResult {
  if (!orgPlan) {
    const flag = FEATURE_FLAGS[featureKey]
    return { enabled: false, planLocked: false, requiredPlan: flag.minPlan, loading: true }
  }

  const flag = FEATURE_FLAGS[featureKey]
  const enabled = planMeetsRequirement(orgPlan.tier, flag.minPlan)

  return {
    enabled,
    planLocked: !enabled,
    requiredPlan: flag.minPlan,
    loading: false,
  }
}

/**
 * Fetches the org's plan from the permissions API and returns it.
 * Use this when you need just the plan and don't already have it from another hook.
 */
export function useOrgPlan(orgId: string): { plan: OrgPlan | null; loading: boolean } {
  const { user } = useAuth()
  const [plan, setPlan] = useState<OrgPlan | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !orgId) {
      setLoading(false)
      return
    }

    fetch(`/api/permissions/organization?orgId=${orgId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.plan) setPlan(data.plan as OrgPlan)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [user, orgId])

  return { plan, loading }
}
