import type { CheckoutBillingInterval } from '@/lib/marketing/checkout-intent'

/**
 * Polar catalog product UUIDs for Standard paid plan (monthly vs annual).
 * Exposed to the client for post-onboarding banner checkout links — set in env (NEXT_PUBLIC_*).
 */
export function resolveStandardProductId(interval: CheckoutBillingInterval): string | null {
    const monthly = process.env.NEXT_PUBLIC_POLAR_STANDARD_PRODUCT_ID_MONTHLY?.trim()
    const annual = process.env.NEXT_PUBLIC_POLAR_STANDARD_PRODUCT_ID_ANNUAL?.trim()
    if (interval === 'monthly') return monthly || null
    return annual || null
}
