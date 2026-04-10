import { PRICING_PLANS, type PricingPlanColumnId } from '@/config/pricing'

/** High ceiling for sandbox demo data; not a marketed limit. */
export const SANDBOX_DEFAULT_ACTIVE_ENGAGEMENT_CAP = 100_000

export type ResolvedPlanColumn = PricingPlanColumnId | 'sandbox' | 'unknown'

function parseEnvProductPlanMap(): Record<string, PricingPlanColumnId> {
    const raw = process.env.POLAR_PRODUCT_PLAN_MAP?.trim()
    if (!raw) return {}
    try {
        const obj = JSON.parse(raw) as Record<string, string>
        const out: Record<string, PricingPlanColumnId> = {}
        const allowed = new Set(PRICING_PLANS.map((p) => p.id))
        for (const [k, v] of Object.entries(obj)) {
            if (typeof k === 'string' && typeof v === 'string' && allowed.has(v as PricingPlanColumnId)) {
                out[k.trim()] = v as PricingPlanColumnId
            }
        }
        return out
    } catch {
        return {}
    }
}

const PRODUCT_PLAN_MAP = parseEnvProductPlanMap()

const NAME_MATCHERS: { test: (s: string) => boolean; plan: PricingPlanColumnId }[] = [
    { test: (s) => /enterprise/i.test(s), plan: 'Enterprise' },
    { test: (s) => /business/i.test(s), plan: 'Business' },
    { test: (s) => /(^|\s)pro(\s|$)/i.test(s), plan: 'Pro' },
    { test: (s) => /standard/i.test(s), plan: 'Standard' },
]

/**
 * Map Polar product id + display name → pricing column / sandbox / unknown.
 */
export function resolvePlanColumnFromSubscription(
    planName: string | null | undefined,
    productId: string | null | undefined
): ResolvedPlanColumn {
    if (productId && PRODUCT_PLAN_MAP[productId]) {
        return PRODUCT_PLAN_MAP[productId]
    }
    const name = (planName ?? '').trim()
    if (!name) return 'unknown'
    const lower = name.toLowerCase()
    if (/(sandbox|free plan|free tier)/i.test(lower)) return 'sandbox'
    for (const { test, plan } of NAME_MATCHERS) {
        if (test(name)) return plan
    }
    return 'unknown'
}

export type DefaultBillingCaps = {
    activeEngagementCap: number
    /** Max firms in billing group (anchor + satellites). */
    firmGroupCap: number
}

export function getDefaultCapsForPlanColumn(plan: ResolvedPlanColumn): DefaultBillingCaps {
    if (plan === 'sandbox') {
        return { activeEngagementCap: SANDBOX_DEFAULT_ACTIVE_ENGAGEMENT_CAP, firmGroupCap: 1 }
    }
    if (plan === 'unknown') {
        return { activeEngagementCap: 10, firmGroupCap: 1 }
    }
    const row = PRICING_PLANS.find((p) => p.id === plan)
    const engagements = plan === 'Enterprise' ? 100 : (row?.projectsIncluded ?? 10)
    /** Firm workspaces under one billing anchor (anchor + satellites). Match tier scale to engagement cap. */
    return { activeEngagementCap: engagements, firmGroupCap: engagements }
}
