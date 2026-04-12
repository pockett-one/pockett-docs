import { validateCheckoutReturnTo } from '@/lib/billing/checkout-return-path'

/**
 * In-app billing/upgrade page URL with firm context and safe return path after checkout.
 */
export function buildAppBillingHref(opts: { firmSlug: string; returnPath?: string | null }): string {
    const params = new URLSearchParams()
    params.set('firmSlug', opts.firmSlug)
    const ret = validateCheckoutReturnTo(opts.returnPath ?? null) ?? `/d/f/${opts.firmSlug}`
    params.set('returnTo', ret)
    return `/d/billing?${params.toString()}`
}
