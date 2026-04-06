'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { firmAdminMustCompleteOnboarding } from '@/lib/actions/firms'
import { buildBillingPageHref } from '@/lib/billing/build-billing-page-href'
import { buildPolarCheckoutHref } from '@/lib/billing/polar-checkout-href'
import { resolveStandardProductId } from '@/lib/billing/standard-product-id'
import { validateCheckoutReturnTo } from '@/lib/billing/checkout-return-path'
import {
    clearCheckoutIntent,
    readCheckoutIntent,
    type StandardCheckoutIntent,
} from '@/lib/marketing/checkout-intent'
import { useSidebarFirms } from '@/lib/sidebar-firms-context'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const HIDE_ONBOARDING_PATHS = ['/d/onboarding']

export function StandardCheckoutIntentBanner() {
    const pathname = usePathname() ?? ''
    const firms = useSidebarFirms()
    const [gate, setGate] = useState<'unknown' | 'show' | 'hide'>('unknown')
    const [intent, setIntent] = useState<StandardCheckoutIntent | null>(null)

    useEffect(() => {
        let cancelled = false
        firmAdminMustCompleteOnboarding()
            .then((mustOnboard) => {
                if (cancelled) return
                setGate(mustOnboard ? 'hide' : 'show')
            })
            .catch(() => {
                if (cancelled) return
                setGate('hide')
            })
        return () => {
            cancelled = true
        }
    }, [pathname])

    useEffect(() => {
        setIntent(readCheckoutIntent())
    }, [pathname])

    const defaultFirm = useMemo(() => {
        if (!firms?.length) return null
        return firms.find((f) => f.isDefault) ?? firms[0] ?? null
    }, [firms])

    const checkoutHref = useMemo(() => {
        if (!defaultFirm) return null
        const slug = defaultFirm.slug
        const returnTo =
            validateCheckoutReturnTo(pathname) ?? (slug ? `/d/f/${slug}` : '/d/profile')
        const productId = resolveStandardProductId(intent?.interval ?? 'annual')
        if (!productId) {
            return buildBillingPageHref({ firmSlug: slug, pathname })
        }
        return buildPolarCheckoutHref({
            firmId: defaultFirm.id,
            returnTo,
            productId,
        })
    }, [defaultFirm, intent?.interval, pathname])

    const dismiss = useCallback(() => {
        clearCheckoutIntent()
        setIntent(null)
    }, [])

    const showBanner =
        gate === 'show' &&
        intent?.intent === 'standard' &&
        !HIDE_ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

    if (!showBanner || !checkoutHref || !defaultFirm || !intent) return null

    const intervalLabel = intent.interval === 'monthly' ? 'Monthly' : 'Annual'

    return (
        <div
            className={cn(
                'mb-4 flex flex-col gap-3 rounded-lg border border-slate-200/90 bg-slate-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
            )}
            role="region"
            aria-label="Continue checkout"
        >
            <p className="text-sm text-slate-700">
                <span className="font-medium text-slate-900">Continue to Standard checkout</span>
                <span className="text-slate-600"> — {intervalLabel} billing</span>
            </p>
            <div className="flex shrink-0 items-center gap-2">
                <Link
                    href={checkoutHref}
                    className={cn(
                        buttonVariants({ variant: 'blackCta', size: 'sm' }),
                        'h-9 px-4 text-xs font-semibold'
                    )}
                >
                    Continue
                </Link>
                <button
                    type="button"
                    onClick={dismiss}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/80 hover:text-slate-800"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
            </div>
        </div>
    )
}
