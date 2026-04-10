import { Suspense } from 'react'
import { SuccessRedirectCard } from '@/app/checkout/success/success-redirect-card'
import { validateCheckoutReturnTo } from '@/lib/billing/checkout-return-path'

type SearchRecord = Record<string, string | string[] | undefined>

function firstParam(sp: SearchRecord, keys: readonly string[]): string | undefined {
    for (const k of keys) {
        const v = sp[k]
        const s = Array.isArray(v) ? v[0] : v
        if (typeof s === 'string' && s.trim()) return s.trim()
    }
    return undefined
}

type Props = {
    searchParams: Promise<SearchRecord>
}

function returnToHasAfterCheckoutFlag(returnTo: string): boolean {
    const q = returnTo.includes('?') ? returnTo.split('?').slice(1).join('?') : ''
    try {
        return new URLSearchParams(q).get('after_checkout') === '1'
    } catch {
        return returnTo.includes('after_checkout=1')
    }
}

/**
 * Polar redirects here after checkout. The @polar-sh/nextjs adapter appends `checkoutId`
 * to POLAR_SUCCESS_URL (placeholder is resolved by Polar when the session completes).
 * Optional `returnTo` is set by /api/checkout when starting checkout from the app.
 */
export default async function CheckoutSuccessPage({ searchParams }: Props) {
    const sp = await searchParams
    const checkoutId = firstParam(sp, ['checkoutId', 'checkout_id', 'checkoutid'])
    const returnToRaw = firstParam(sp, ['returnTo', 'return_to'])
    const returnTo = validateCheckoutReturnTo(returnToRaw)
    const onboardingAfterCheckout = returnTo != null && returnToHasAfterCheckoutFlag(returnTo)

    if (onboardingAfterCheckout && returnTo) {
        return (
            <Suspense
                fallback={
                    <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
                        Loading…
                    </div>
                }
            >
                <SuccessRedirectCard
                    checkoutId={checkoutId}
                    mode="onboardingAfterCheckout"
                    continueOnboardingHref={returnTo}
                    billingPlansHref="/d/billing?from_checkout=1"
                />
            </Suspense>
        )
    }

    return (
        <Suspense
            fallback={
                <div className="flex min-h-[50vh] items-center justify-center text-sm text-slate-500">
                    Loading…
                </div>
            }
        >
            <SuccessRedirectCard
                checkoutId={checkoutId}
                mode="default"
                primaryHref="/d/billing"
                primaryLabel="Go to billing"
            />
        </Suspense>
    )
}
