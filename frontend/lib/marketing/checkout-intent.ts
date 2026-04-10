/**
 * Client-only: persisted plan interest + billing interval from /pricing (and signup URL merge).
 */

export const CHECKOUT_INTENT_STORAGE_KEY = 'firma.checkoutIntent'

export type CheckoutBillingInterval = 'monthly' | 'annual'

/** Title-case names aligned with product catalog / Polar display names. */
export const CHECKOUT_PLAN_NAMES = [
    'Free Sandbox',
    'Standard',
    'Pro',
    'Business',
    'Enterprise',
] as const

export type CheckoutPlanName = (typeof CHECKOUT_PLAN_NAMES)[number]

export type CheckoutIntent = {
    plan: CheckoutPlanName
    interval: CheckoutBillingInterval
}

/** @deprecated Use {@link CheckoutIntent} — kept for searches; identical shape. */
export type StandardCheckoutIntent = CheckoutIntent

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === 'object' && x !== null
}

function isCheckoutPlanName(s: unknown): s is CheckoutPlanName {
    return typeof s === 'string' && (CHECKOUT_PLAN_NAMES as readonly string[]).includes(s)
}

export function parseCheckoutIntent(raw: string | null): CheckoutIntent | null {
    if (!raw?.trim()) return null
    try {
        const v = JSON.parse(raw) as unknown
        if (!isRecord(v)) return null
        if (v.interval !== 'monthly' && v.interval !== 'annual') return null

        if (isCheckoutPlanName(v.plan)) {
            return { plan: v.plan, interval: v.interval }
        }

        // Legacy: { intent: 'standard', interval }
        if (v.intent === 'standard') {
            return { plan: 'Standard', interval: v.interval }
        }

        return null
    } catch {
        return null
    }
}

export function readCheckoutIntent(): CheckoutIntent | null {
    if (typeof window === 'undefined') return null
    try {
        return parseCheckoutIntent(window.localStorage.getItem(CHECKOUT_INTENT_STORAGE_KEY))
    } catch {
        return null
    }
}

export function persistCheckoutIntent(intent: CheckoutIntent): void {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(CHECKOUT_INTENT_STORAGE_KEY, JSON.stringify(intent))
    } catch {
        /* ignore quota */
    }
}

export function clearCheckoutIntent(): void {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.removeItem(CHECKOUT_INTENT_STORAGE_KEY)
    } catch {
        /* ignore */
    }
}

export function isStandardPaidCheckoutIntent(intent: CheckoutIntent | null | undefined): boolean {
    return intent?.plan === 'Standard'
}
