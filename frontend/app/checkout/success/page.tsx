import { validateCheckoutReturnTo } from '@/lib/billing/checkout-return-path'
import { SuccessRedirectCard } from '@/app/checkout/success/success-redirect-card'

type Props = {
    searchParams: Promise<{ checkoutId?: string; returnTo?: string }>
}

/**
 * Polar redirects here after checkout. The @polar-sh/nextjs adapter appends `checkoutId`
 * to POLAR_SUCCESS_URL (placeholder is resolved by Polar when the session completes).
 * Optional `returnTo` is set by /api/checkout when starting checkout from the app.
 */
export default async function CheckoutSuccessPage({ searchParams }: Props) {
    const { checkoutId, returnTo: returnToRaw } = await searchParams
    const returnTo = validateCheckoutReturnTo(returnToRaw ?? null)
    const primaryHref = returnTo ?? '/d'
    const primaryLabel = returnTo ? 'Continue to workspace' : 'Go to workspace'

    return (
        <SuccessRedirectCard
            checkoutId={checkoutId}
            primaryHref={primaryHref}
            primaryLabel={primaryLabel}
        />
    )
}
