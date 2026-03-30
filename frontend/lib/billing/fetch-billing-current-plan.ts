import type { BillingCurrentPlanState } from '@/components/billing/polar-plans-picker'

export async function fetchBillingCurrentPlan(firmId: string): Promise<BillingCurrentPlanState | null> {
    const res = await fetch(`/api/billing/current-plan?firmId=${encodeURIComponent(firmId)}`, {
        cache: 'no-store',
    })
    const body = (await res.json().catch(() => ({}))) as { current?: BillingCurrentPlanState }
    if (!res.ok) return null
    return body.current ?? null
}
