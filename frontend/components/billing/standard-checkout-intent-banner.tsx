'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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

/** Above app chrome (topbar z-50, sidebar z-40) so overlay blocks interaction. */
const OVERLAY_Z = 100

export function StandardCheckoutIntentBanner() {
    const pathname = usePathname() ?? ''
    const firms = useSidebarFirms()
    const [gate, setGate] = useState<'unknown' | 'show' | 'hide'>('unknown')
    const [intent, setIntent] = useState<StandardCheckoutIntent | null>(null)
    const [upgradeNudge, setUpgradeNudge] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

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

    useEffect(() => {
        let cancelled = false
        fetch('/api/billing/upgrade-nudge-status')
            .then((res) => (res.ok ? res.json() : { shouldShow: false }))
            .then((payload: { shouldShow?: boolean }) => {
                if (cancelled) return
                setUpgradeNudge(payload.shouldShow === true)
            })
            .catch(() => {
                if (cancelled) return
                setUpgradeNudge(false)
            })
        return () => {
            cancelled = true
        }
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
        (intent?.intent === 'standard' || upgradeNudge) &&
        !HIDE_ONBOARDING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

    const visible = Boolean(showBanner && checkoutHref && defaultFirm && intent)

    useEffect(() => {
        if (!visible) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [visible])

    if (!mounted || !visible || !checkoutHref || !defaultFirm) return null

    const intervalLabel = intent?.interval === 'monthly' ? 'Monthly' : 'Annual'

    return createPortal(
        <>
            {/* Blocking backdrop — does not dismiss on click; use X or Continue. */}
            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
                style={{ zIndex: OVERLAY_Z }}
                aria-hidden
            />
            <div
                className={cn(
                    'fixed left-0 right-0 border-t-2 border-[#006e16] bg-white shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.25)]',
                    'pb-[max(1rem,env(safe-area-inset-bottom))] pt-4'
                )}
                style={{ zIndex: OVERLAY_Z + 1, bottom: 0 }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="standard-checkout-banner-title"
            >
                <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                    <div className="min-w-0 pr-10 sm:pr-4">
                        <p
                            id="standard-checkout-banner-title"
                            className="text-lg font-semibold tracking-tight text-slate-900 sm:text-xl"
                        >
                            Finish Standard checkout
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-base">
                            {intent?.intent === 'standard'
                                ? (
                                    <>
                                        You chose <span className="font-medium text-slate-800">Standard</span> with{' '}
                                        <span className="font-medium text-[#006e16]">{intervalLabel}</span> billing.
                                        Continue to secure checkout or open billing to pick a plan.
                                    </>
                                )
                                : (
                                    <>
                                        Your firm is still on the Free plan. Upgrade now to unlock more capacity and features.
                                    </>
                                )}
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-row items-center gap-3 sm:flex-col sm:items-stretch md:flex-row md:items-center">
                        <Link
                            href={checkoutHref}
                            className={cn(
                                buttonVariants({ variant: 'blackCta', size: 'default' }),
                                'h-11 min-w-[10rem] justify-center px-6 text-sm font-semibold shadow-md'
                            )}
                        >
                            Continue to checkout
                        </Link>
                        <button
                            type="button"
                            onClick={dismiss}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
                            aria-label="Dismiss"
                        >
                            <X className="h-5 w-5" strokeWidth={2.25} />
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    )
}
