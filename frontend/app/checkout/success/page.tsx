import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import { validateCheckoutReturnTo } from '@/lib/billing/checkout-return-path'
import { cn } from '@/lib/utils'

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
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
            <div className="max-w-md w-full text-center space-y-4">
                <h1 className="text-2xl font-semibold text-slate-900">You&apos;re all set</h1>
                <p className="text-slate-600">
                    Thanks for subscribing. It may take a moment for your workspace to reflect the new plan.
                </p>
                {checkoutId ? (
                    <p className="text-xs text-slate-400 font-mono break-all">Checkout ID: {checkoutId}</p>
                ) : null}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
                    <Link href={primaryHref} className={cn(buttonVariants(), 'inline-flex')}>
                        {primaryLabel}
                    </Link>
                    {primaryHref !== '/d' ? (
                        <Link
                            href="/d"
                            className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex border-slate-200')}
                        >
                            All workspaces
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
