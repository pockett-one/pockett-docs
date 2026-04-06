/**
 * Client-only: persisted Standard checkout intent from /pricing (and optional signup URL merge).
 */
export const CHECKOUT_INTENT_STORAGE_KEY = 'firma.checkoutIntent'

export type CheckoutBillingInterval = 'monthly' | 'annual'

export type StandardCheckoutIntent = {
    intent: 'standard'
    interval: CheckoutBillingInterval
}

function isRecord(x: unknown): x is Record<string, unknown> {
    return typeof x === 'object' && x !== null
}

export function parseCheckoutIntent(raw: string | null): StandardCheckoutIntent | null {
    if (!raw?.trim()) return null
    try {
        const v = JSON.parse(raw) as unknown
        if (!isRecord(v)) return null
        if (v.intent !== 'standard') return null
        if (v.interval !== 'monthly' && v.interval !== 'annual') return null
        return { intent: 'standard', interval: v.interval }
    } catch {
        return null
    }
}

export function readCheckoutIntent(): StandardCheckoutIntent | null {
    if (typeof window === 'undefined') return null
    try {
        return parseCheckoutIntent(window.localStorage.getItem(CHECKOUT_INTENT_STORAGE_KEY))
    } catch {
        return null
    }
}

export function persistCheckoutIntent(intent: StandardCheckoutIntent): void {
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
