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
    const { checkoutId } = await searchParams
    const primaryHref = '/d/billing'
    const primaryLabel = 'Go to billing'

    return (
        <SuccessRedirectCard
            checkoutId={checkoutId}
            primaryHref={primaryHref}
            primaryLabel={primaryLabel}
        />
    )
}
