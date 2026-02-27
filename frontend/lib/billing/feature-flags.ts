/**
 * Feature Flags — single source of truth for plan-gated features.
 *
 * Each entry maps a feature key to the minimum plan required.
 * Use planMeetsRequirement() to check access; use checkFeatureAccess() for
 * server-side checks that also validate subscription status.
 */

export type PlanTier = 'standard' | 'pro' | 'business' | 'enterprise'

/** Ordered from lowest to highest. Index position determines hierarchy. */
export const PLAN_HIERARCHY: PlanTier[] = ['standard', 'pro', 'business', 'enterprise']

/** Human-readable plan names for UI display (e.g. upgrade badges). */
export const PLAN_DISPLAY_NAMES: Record<PlanTier, string> = {
  standard: 'Standard',
  pro: 'Pro',
  business: 'Business',
  enterprise: 'Enterprise',
}

/**
 * Returns true if orgPlan satisfies the minimum required plan.
 * e.g. planMeetsRequirement('pro', 'pro')      → true
 *      planMeetsRequirement('standard', 'pro')  → false
 *      planMeetsRequirement('business', 'pro')  → true
 */
export function planMeetsRequirement(orgPlan: PlanTier, requiredPlan: PlanTier): boolean {
  return PLAN_HIERARCHY.indexOf(orgPlan) >= PLAN_HIERARCHY.indexOf(requiredPlan)
}

/**
 * All plan-gated features. Keys are prefixed with "feature:" to distinguish
 * them from RBAC capability keys (project:can_view, etc.).
 *
 * Add new entries here when you ship plan-gated functionality. The key must
 * match the feature name used in checkFeatureAccess() and useFeatureFlag().
 */
export const FEATURE_FLAGS = {
  // ── Pro ──────────────────────────────────────────────────────────────────
  'feature:custom_subdomain':     { minPlan: 'pro' as PlanTier },
  'feature:templates':            { minPlan: 'pro' as PlanTier },
  'feature:approval_workflow':    { minPlan: 'pro' as PlanTier },
  'feature:document_versioning':  { minPlan: 'pro' as PlanTier },
  'feature:watermarked_delivery': { minPlan: 'pro' as PlanTier },
  'feature:activity_export':      { minPlan: 'pro' as PlanTier },
  'feature:project_activity_dashboard': { minPlan: 'pro' as PlanTier },

  // ── Business ─────────────────────────────────────────────────────────────
  'feature:self_destruct':            { minPlan: 'business' as PlanTier },
  'feature:automated_followups':      { minPlan: 'business' as PlanTier },
  'feature:calendar_integration':     { minPlan: 'business' as PlanTier },
  'feature:document_relationships':   { minPlan: 'business' as PlanTier },
  'feature:weekly_status_reports':    { minPlan: 'business' as PlanTier },
  'feature:folder_badge_indicators':  { minPlan: 'business' as PlanTier },

  // ── Enterprise ───────────────────────────────────────────────────────────
  'feature:custom_dns':           { minPlan: 'enterprise' as PlanTier },
  'feature:sso_saml':             { minPlan: 'enterprise' as PlanTier },
  'feature:audit_logs':           { minPlan: 'enterprise' as PlanTier },
  'feature:advanced_personas':    { minPlan: 'enterprise' as PlanTier },
  'feature:recycle_bin':          { minPlan: 'enterprise' as PlanTier },
  'feature:ip_theft_protection':  { minPlan: 'enterprise' as PlanTier },
} as const

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS
