'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { BillingCatalogPlan } from '@/lib/billing/billing-catalog.types'
import { openPolarCustomerPortalSession } from '@/lib/billing/open-polar-customer-portal'
import { buildPolarCheckoutHref } from '@/lib/billing/polar-checkout-href'
import { upgradeCopy } from '@/lib/billing/upgrade-copy'
import { BRAND_NAME } from '@/config/brand'
import { getPricingComparisonBulletsForPlan, type PricingPlanColumnId } from '@/config/pricing'
import { BillingCheckoutFootnote, BillingPolarExplainInline } from '@/components/billing/billing-polar-inline'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { EmailInline } from '@/components/ui/email-inline'
import { PLATFORM_SUPPORT_EMAIL } from '@/config/platform-emails'
import { cn } from '@/lib/utils'
import { Check, ChevronDown, ChevronUp, Clock, CreditCard, ExternalLink, Loader2, Rows3, Ticket } from 'lucide-react'

type CatalogJson = { items?: BillingCatalogPlan[]; error?: string }
export type BillingCurrentPlanState = {
    subscriptionStatus: string | null
    subscriptionPlan: string | null
    subscriptionProductId?: string | null
    pricingModel: 'recurring_subscription' | 'one_time_purchase' | null
    periodEndIso: string | null
    canOpenCustomerPortal?: boolean
    isFirmBillingAdmin?: boolean
}

interface PolarPlansPickerProps {
    firmId: string
    returnPath: string
    /** Path + query for Polar portal return (must validate as /d/... on the server). */
    portalReturnPath: string
    currentPlanState?: BillingCurrentPlanState | null
    /** Tighter spacing when embedded in a dialog */
    density?: 'default' | 'compact'
    className?: string
    /**
     * Billing page trial: accent #ECC0AA (links, help panel, current-plan chrome).
     * Omit in dialogs / embeds until promoted to design tokens.
     */
    blueAccentTrial?: boolean
}

function planSort(a: BillingCatalogPlan, b: BillingCatalogPlan) {
    const aFree = a.priceLabel === 'Free' ? 1 : 0
    const bFree = b.priceLabel === 'Free' ? 1 : 0
    return aFree - bFree
}

/** Shared panel: Polar trust copy + portal actions or Compare plans (inside Billing & plans card). */
const billingTrustPanelClass = (compact: boolean, blueAccentTrial?: boolean) =>
    cn(
        'rounded-2xl shadow-sm',
        blueAccentTrial
            ? 'border border-[#ECC0AA]/55 bg-gradient-to-br from-[#ECC0AA]/32 via-white to-slate-50/80 ring-1 ring-[#ECC0AA]/42'
            : 'border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-slate-50/80 ring-1 ring-slate-100/80',
        compact ? 'p-4' : 'p-4 sm:p-5'
    )

/** Solid slate + clip-path hover (Manage Subscription & plan checkout CTAs). */
const polarBillingCtaButtonClass = cn(
    'group relative overflow-hidden text-sm font-semibold',
    'bg-slate-900 text-white hover:bg-slate-900 hover:text-white',
    'before:absolute before:inset-0 before:rounded-[inherit] before:bg-slate-700 before:content-[""]',
    'before:[clip-path:circle(0%_at_85%_50%)] before:transition-[clip-path] before:duration-300 before:ease-out',
    'hover:before:[clip-path:circle(150%_at_85%_50%)]'
)

/** Billing page trial: primary checkout filled with #ECC0AA */
const polarBillingPeachCtaClass = cn(
    'rounded-lg text-sm font-semibold',
    '!border-2 !border-[#c49a82]/70 !bg-[#ECC0AA] !text-[#3d2a22]',
    'shadow-[0_2px_6px_rgba(61,42,34,0.1),0_8px_24px_-8px_rgba(236,192,170,0.55)]',
    'transition-[transform,background-color,border-color,box-shadow,color] duration-200 ease-out',
    'hover:-translate-y-px hover:!border-[#b07d62] hover:!bg-[#f2d5c4] hover:!text-[#241814]',
    'active:translate-y-0 active:scale-[0.995]'
)

/** Match profile billing inner / account cards */
const planCardBase = cn(
    'relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90',
    'bg-white',
    'shadow-[0_2px_8px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(15,23,42,0.12)]',
    'ring-1 ring-slate-900/[0.04]',
    'transition-all duration-300 ease-out'
)

const sandboxPlanHighlights = [
    '1 sandbox firm workspace included',
    'Demo clients and engagements preloaded',
    'Document storage and folder structure previews',
    'Safe environment for testing workflows',
    'No production custom firms on free tier',
]

function PlanHighlightsScroll({
    lines,
    checkIconClassName = 'text-emerald-600/90',
    peachScrollbar,
}: {
    lines: string[]
    checkIconClassName?: string
    peachScrollbar?: boolean
}) {
    const ref = useRef<HTMLUListElement | null>(null)
    const [canScrollUp, setCanScrollUp] = useState(false)
    const [canScrollDown, setCanScrollDown] = useState(false)

    const recompute = useCallback(() => {
        const el = ref.current
        if (!el) return
        const maxScrollTop = Math.max(0, el.scrollHeight - el.clientHeight)
        const top = el.scrollTop
        setCanScrollUp(top > 2)
        setCanScrollDown(top < maxScrollTop - 2)
    }, [])

    useEffect(() => {
        recompute()
    }, [lines.length, recompute])

    return (
        <div className="relative">
            <ul
                ref={ref}
                onScroll={recompute}
                className={cn(
                    'h-52 space-y-2.5 overflow-y-auto pr-1',
                    'scrollbar-thin scrollbar-track-transparent',
                    peachScrollbar
                        ? 'scrollbar-thumb-[#ECC0AA]/65 hover:scrollbar-thumb-[#d4a892]'
                        : 'scrollbar-thumb-slate-200/80 hover:scrollbar-thumb-slate-300/80'
                )}
            >
                {lines.map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm leading-snug text-slate-700">
                        <Check
                            className={cn('mt-0.5 h-4 w-4 shrink-0', checkIconClassName)}
                            strokeWidth={2.25}
                            aria-hidden
                        />
                        <span>{line}</span>
                    </li>
                ))}
            </ul>

            {/* Scroll affordance: fades + chevrons, driven by scroll position */}
            <div
                className={cn(
                    'pointer-events-none absolute inset-x-0 top-0 z-10 h-10',
                    'bg-gradient-to-b from-white via-white/80 to-transparent',
                    'transition-opacity duration-200',
                    canScrollUp ? 'opacity-100' : 'opacity-0'
                )}
                aria-hidden
            />
            <div
                className={cn(
                    'pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10',
                    'bg-gradient-to-t from-white via-white/80 to-transparent',
                    'transition-opacity duration-200',
                    canScrollDown ? 'opacity-100' : 'opacity-0'
                )}
                aria-hidden
            />
            <ChevronUp
                className={cn(
                    'pointer-events-none absolute left-1/2 top-1 z-20 -translate-x-1/2 text-slate-400',
                    'transition-opacity duration-200',
                    canScrollUp ? 'opacity-100' : 'opacity-0'
                )}
                width={16}
                height={16}
                aria-hidden
            />
            <ChevronDown
                className={cn(
                    'pointer-events-none absolute left-1/2 bottom-1 z-20 -translate-x-1/2 text-slate-400',
                    'transition-opacity duration-200',
                    canScrollDown ? 'opacity-100' : 'opacity-0'
                )}
                width={16}
                height={16}
                aria-hidden
            />
        </div>
    )
}

function normalizePlanName(name: string | null | undefined): string {
    return (name ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .trim()
}

function namesLikelyMatch(a: string | null | undefined, b: string | null | undefined): boolean {
    const na = normalizePlanName(a)
    const nb = normalizePlanName(b)
    if (!na || !nb) return false
    return na === nb || na.includes(nb) || nb.includes(na)
}

function pricingPlanIdFromCatalogName(name: string): PricingPlanColumnId | null {
    const normalized = normalizePlanName(name)
    if (normalized.includes('standard')) return 'Standard'
    if (normalized.includes('pro')) return 'Pro'
    if (normalized.includes('business')) return 'Business'
    if (normalized.includes('enterprise')) return 'Enterprise'
    return null
}

function formatStatus(status: string | null | undefined): string {
    if (!status || status === 'none') return 'Setup pending'
    return status
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
}

function withBrandName(text: string | null | undefined): string {
    if (!text) return ''
    return text.replace(/\bfirma\b/gi, BRAND_NAME)
}

/** Split Polar price labels like "$49 /mo" for clearer numeric hierarchy. */
function PlanPriceDisplay({
    label,
    compact,
    peachAmount,
}: {
    label: string
    compact: boolean
    peachAmount?: boolean
}) {
    const t = label.trim()
    const priced = t.match(/^(\$)([\d,.]+)(\s+)(\/.+|per\s+.+|\/\s*.+)$/i)
    if (t === 'Free') {
        return (
            <span
                className={cn(
                    'font-bold tabular-nums font-mono tracking-tight',
                    peachAmount ? 'text-[#6b4538]' : 'text-slate-950',
                    compact ? 'text-lg' : 'text-2xl'
                )}
            >
                Free
            </span>
        )
    }
    if (priced) {
        const [, currency, amount, , intervalTail] = priced
        return (
            <span className="inline-flex flex-wrap items-baseline">
                <span
                    className={cn(
                        'font-semibold tabular-nums font-mono',
                        peachAmount ? 'text-[#7a5343]' : 'text-slate-700',
                        compact ? 'text-sm' : 'text-base'
                    )}
                >
                    {currency}
                </span>
                <span
                    className={cn(
                        'font-bold tabular-nums font-mono tracking-tight',
                        peachAmount ? 'text-[#6b4538]' : 'text-slate-950',
                        compact ? 'ml-px text-xl' : 'ml-0.5 text-[1.625rem] leading-[1.1]'
                    )}
                >
                    {amount}
                </span>
                <span
                    className={cn(
                        'font-medium tabular-nums font-mono tracking-wide',
                        peachAmount ? 'text-[#7a5343]/85' : 'text-slate-600',
                        compact ? 'ml-1 text-xs' : 'ml-1.5 text-sm'
                    )}
                >
                    {intervalTail.trim()}
                </span>
            </span>
        )
    }
    return (
        <span
            className={cn(
                'font-semibold tabular-nums font-mono tracking-tight text-slate-900',
                compact ? 'text-base' : 'text-lg'
            )}
        >
            {label}
        </span>
    )
}

function ComparePlansPricingLink({
    density,
    className,
    blueAccentTrial,
}: {
    density: 'default' | 'compact'
    className?: string
    blueAccentTrial?: boolean
}) {
    const compact = density === 'compact'
    return (
        <Link
            href="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                buttonVariants({ variant: 'outline', size: compact ? 'sm' : 'default' }),
                'inline-flex shrink-0 items-center justify-center gap-2 bg-white font-medium shadow-sm transition-colors',
                blueAccentTrial
                    ? cn(
                          '!border-[#c49a82] !bg-[#ECC0AA] !text-[#3d2a22] !shadow-[0_2px_8px_-2px_rgba(236,192,170,0.45)]',
                          'hover:!border-[#b07d62] hover:!bg-[#f0d0be] hover:!text-[#241814]'
                      )
                    : 'border-slate-300 text-slate-800 hover:border-slate-400 hover:bg-slate-50',
                compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-sm',
                'w-full sm:w-auto',
                className
            )}
        >
            <Rows3 className={cn('opacity-80', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} aria-hidden />
            {upgradeCopy.ctaComparePlans}
            <ExternalLink className={cn('opacity-70', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden />
        </Link>
    )
}

function BillingFaqInlineLink({ className, blueAccentTrial }: { className?: string; blueAccentTrial?: boolean }) {
    return (
        <Link
            href="/pricing#faq"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                'inline-flex items-center gap-1 font-medium underline underline-offset-2',
                blueAccentTrial
                    ? 'text-[#7a5343] decoration-[#ECC0AA]/75 hover:text-[#5c3f32] hover:decoration-[#c49a82]'
                    : 'text-slate-600 decoration-slate-300/80 hover:text-slate-900 hover:decoration-slate-400',
                className
            )}
        >
            FAQs
            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
        </Link>
    )
}

export function PolarPlansPicker({
    firmId,
    returnPath,
    portalReturnPath,
    currentPlanState,
    density = 'default',
    className,
    blueAccentTrial,
}: PolarPlansPickerProps) {
    const [plans, setPlans] = useState<BillingCatalogPlan[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [portalLoading, setPortalLoading] = useState(false)
    const [portalError, setPortalError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setError(null)
        fetch('/api/billing/catalog')
            .then(async (res) => {
                const body = (await res.json().catch(() => ({}))) as CatalogJson
                if (!res.ok) {
                    throw new Error(body.error || `Could not load plans (${res.status})`)
                }
                return body.items ?? []
            })
            .then((items) => {
                if (!cancelled) setPlans(items)
            })
            .catch((e: unknown) => {
                if (!cancelled) setError(e instanceof Error ? e.message : 'Could not load plans')
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    const sortedPlans = useMemo(() => (plans?.length ? [...plans].sort(planSort) : null), [plans])

    if (!firmId) {
        return <p className="text-sm text-slate-600">{upgradeCopy.planPickerMissingFirm}</p>
    }

    if (loading) {
        return (
            <div className={cn('flex flex-col items-center justify-center gap-3 py-14 text-slate-500', className)}>
                <Loader2 className="h-7 w-7 animate-spin text-slate-500/80" aria-hidden />
                <span className="text-sm font-medium">Loading plans…</span>
            </div>
        )
    }

    if (error) {
        return (
            <div
                className={cn(
                    'rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/50 px-4 py-3.5 text-sm text-amber-950 shadow-sm',
                    className
                )}
            >
                {error}
            </div>
        )
    }

    if (!sortedPlans?.length) {
        return (
            <div className={cn('space-y-4 text-center sm:text-left', className)}>
                <p className="text-sm text-slate-600">{upgradeCopy.planPickerEmpty}</p>
                <Button
                    variant="outline"
                    className={cn(
                        'h-10 w-full shadow-sm sm:w-auto',
                        blueAccentTrial
                            ? '!border-[#c49a82] !bg-[#ECC0AA] hover:!bg-[#f0d0be]'
                            : 'border-slate-200 bg-white/80'
                    )}
                    asChild
                >
                    <Link
                        href="/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn('gap-2 font-medium', blueAccentTrial ? '!text-[#3d2a22]' : undefined)}
                    >
                        {upgradeCopy.ctaComparePlans}
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    </Link>
                </Button>
            </div>
        )
    }

    const compact = density === 'compact'
    /** #B07D62: same hue family as #ECC0AA, enough contrast on white for small icons */
    const highlightCheckClass = blueAccentTrial ? 'text-[#c17a54]' : 'text-emerald-600/90'
    const normalizedStatus = (currentPlanState?.subscriptionStatus ?? '').toLowerCase()
    const paidPlans = sortedPlans.filter((p) => p.pricingModel === 'recurring_subscription')
    const freeLikePlans = sortedPlans.filter((p) => p.pricingModel === 'one_time_purchase')
    const paidIdMatch = paidPlans.find((p) => p.id === currentPlanState?.subscriptionProductId)
    const paidMatch = paidPlans.find((p) => namesLikelyMatch(p.name, currentPlanState?.subscriptionPlan))
    const hasPaidMatch = Boolean(paidIdMatch || paidMatch)
    const isActiveLikeStatus = ['active', 'trialing', 'past_due'].includes(normalizedStatus)
    const isPaidRecurringCurrent =
        (currentPlanState?.pricingModel === 'recurring_subscription' && isActiveLikeStatus) ||
        (hasPaidMatch && !['canceled', 'none'].includes(normalizedStatus))
    const currentPlanId = isPaidRecurringCurrent
        ? (paidIdMatch?.id ?? paidMatch?.id ?? (paidPlans.length === 1 ? paidPlans[0]?.id : null))
        : currentPlanState?.pricingModel === 'one_time_purchase'
            ? (freeLikePlans.find((p) => p.priceLabel === 'Free')?.id ?? freeLikePlans[0]?.id ?? null)
            : null
    const portalSwitchUi = isPaidRecurringCurrent
    const isFirmBillingAdmin = Boolean(currentPlanState?.isFirmBillingAdmin)
    const canOpenCustomerPortal = Boolean(currentPlanState?.canOpenCustomerPortal)
    const showPortalButton = isFirmBillingAdmin && portalSwitchUi && canOpenCustomerPortal
    const showAdminOnlyBlock = !isFirmBillingAdmin

    const openBillingPortal = async () => {
        setPortalError(null)
        setPortalLoading(true)
        try {
            const result = await openPolarCustomerPortalSession({
                firmId,
                returnTo: portalReturnPath || '/d/billing',
            })
            if (result.ok) {
                window.location.href = result.url
                return
            }
            setPortalError(result.error)
        } finally {
            setPortalLoading(false)
        }
    }

    return (
        <div className={cn('space-y-6', className)}>
            {showAdminOnlyBlock ? (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950 shadow-sm">
                    {upgradeCopy.billingPortalAdminOnlyHint}
                </div>
            ) : null}
            <div className={billingTrustPanelClass(compact, blueAccentTrial)}>
                {showPortalButton ? (
                    <p className={cn('text-sm leading-relaxed text-slate-700', compact && 'text-xs')}>
                        <span>{upgradeCopy.billingPortalCombinedIntroPrefix}</span>
                        <BillingPolarExplainInline className="mx-0.5" />
                        <span>{upgradeCopy.billingPortalCombinedIntroSuffix}</span>
                    </p>
                ) : (
                    <BillingCheckoutFootnote dense={compact} />
                )}
                <div
                    className={cn(
                        'mt-4 border-t pt-4',
                        compact && 'mt-3 pt-3',
                        blueAccentTrial
                            ? compact
                                ? 'border-[#ECC0AA]/30'
                                : 'border-[#ECC0AA]/35'
                            : compact
                              ? 'border-slate-200/50'
                              : 'border-slate-200/60'
                    )}
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                    <p
                        className={cn(
                            'min-w-0 flex-1 text-left text-xs leading-relaxed',
                            blueAccentTrial ? 'text-[#7a5343]/80' : 'text-slate-500',
                            compact && 'text-[11px]'
                        )}
                    >
                        <span>{upgradeCopy.billingFooterHelp}</span>{' '}
                        <EmailInline email={PLATFORM_SUPPORT_EMAIL} className="mx-1" />
                        <span className="sr-only">.</span>{' '}
                        <BillingFaqInlineLink className="ml-1" blueAccentTrial={blueAccentTrial} />
                    </p>
                    <ComparePlansPricingLink
                        density={density}
                        className="w-full shrink-0 sm:w-auto sm:self-start"
                        blueAccentTrial={blueAccentTrial}
                    />
                </div>
                {showPortalButton && portalError ? (
                    <p className="mt-3 text-sm text-red-600">{portalError}</p>
                ) : null}
            </div>
            <ul className="grid grid-cols-1 gap-5 pt-2 lg:grid-cols-2 lg:items-stretch lg:gap-6">
                {sortedPlans.map((plan) => {
                    const isFreeTier = plan.priceLabel === 'Free'
                    const isCurrentPlan = currentPlanId === plan.id
                    const isTrialingCurrentPlan =
                        isCurrentPlan &&
                        (currentPlanState?.subscriptionStatus ?? '').toLowerCase() === 'trialing' &&
                        Boolean(currentPlanState?.periodEndIso)
                    const currentPlanPeriodEnd = currentPlanState?.periodEndIso
                        ? new Date(currentPlanState.periodEndIso).toLocaleDateString(undefined, {
                              dateStyle: 'medium',
                          })
                        : null
                    const pricingPlanId = pricingPlanIdFromCatalogName(plan.name)
                    const planHighlights = pricingPlanId
                        ? getPricingComparisonBulletsForPlan(pricingPlanId)
                        : []
                    const checkoutHref = buildPolarCheckoutHref({
                        firmId,
                        returnTo: returnPath,
                        productId: plan.id,
                    })
                    return (
                        <li key={plan.id} className="relative pt-3">
                            {!isCurrentPlan && !isFreeTier && plan.isRecommended ? (
                                <div className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2">
                                    <span
                                        className={cn(
                                            'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider shadow-md',
                                            blueAccentTrial
                                                ? 'border-[#b88972]/60 bg-[#ECC0AA] text-[#3d2a22]'
                                                : 'border-slate-300/80 bg-slate-700 text-white'
                                        )}
                                    >
                                        {upgradeCopy.billingRecommendedBadge}
                                    </span>
                                </div>
                            ) : null}
                            <article
                                className={cn(
                                    planCardBase,
                                    isFreeTier
                                        ? blueAccentTrial
                                            ? 'border-[#ECC0AA]/45 bg-gradient-to-br from-[#ECC0AA]/18 via-slate-50/75 to-slate-50/95 hover:border-[#ECC0AA]/60 hover:shadow-[0_8px_28px_-8px_rgba(236,192,170,0.22)]'
                                            : 'bg-slate-50/70 hover:border-slate-200 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1)]'
                                        : cn(
                                              'hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1),0_20px_48px_-16px_rgba(15,23,42,0.12)]',
                                              blueAccentTrial
                                                  ? 'border-[#ECC0AA]/42 ring-[#ECC0AA]/22 hover:border-[#d4a892] hover:ring-[#ECC0AA]/35'
                                                  : 'border-slate-200/90 hover:border-slate-300/90 hover:ring-slate-200/40'
                                          ),
                                    blueAccentTrial && isCurrentPlan && 'bg-[#ECC0AA]/10',
                                    blueAccentTrial &&
                                        isCurrentPlan &&
                                        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-1 before:rounded-t-[1rem] before:bg-[#ECC0AA]'
                                )}
                            >
                                <div className={cn('flex flex-1 flex-col', compact ? 'p-4' : 'p-5 sm:p-6')}>
                                    {isFreeTier ? (
                                        <>
                                            <h3
                                                className={cn(
                                                    'font-semibold tracking-tight text-slate-900',
                                                    compact ? 'text-base' : 'text-lg'
                                                )}
                                            >
                                                {plan.name}
                                            </h3>
                                            <p className="mt-2">
                                                <PlanPriceDisplay
                                                    label={plan.priceLabel}
                                                    compact={compact}
                                                    peachAmount={blueAccentTrial}
                                                />
                                            </p>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2">
                                            <h3
                                                className={cn(
                                                    'col-start-1 row-start-1 min-w-0 font-semibold tracking-tight text-slate-900',
                                                    compact ? 'text-base' : 'text-lg'
                                                )}
                                            >
                                                {plan.name}
                                            </h3>
                                            <p className="col-start-1 row-start-2 min-w-0 leading-none">
                                                <PlanPriceDisplay
                                                    label={plan.priceLabel}
                                                    compact={compact}
                                                    peachAmount={blueAccentTrial}
                                                />
                                            </p>
                                            <div className="col-start-2 row-span-2 row-start-1 flex min-w-[140px] max-w-[11rem] shrink-0 flex-col gap-1.5 self-start text-sm">
                                                {isCurrentPlan ? (
                                                    <>
                                                        <TooltipProvider delayDuration={200}>
                                                            <div className="grid grid-cols-[1rem_1fr] items-center gap-2">
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <span className="inline-flex h-4 w-4 items-center justify-center">
                                                                            <Ticket
                                                                                className={cn(
                                                                                    'h-4 w-4 shrink-0',
                                                                                    blueAccentTrial ? 'text-[#c17a54]' : 'text-slate-400'
                                                                                )}
                                                                                strokeWidth={2.25}
                                                                                aria-hidden
                                                                            />
                                                                        </span>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent variant="light" side="top" align="start">
                                                                        Subscription status
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                                <span
                                                                    className={cn(
                                                                        'text-sm font-medium',
                                                                        blueAccentTrial ? 'text-[#7a5343]' : 'text-slate-600'
                                                                    )}
                                                                >
                                                                    {formatStatus(currentPlanState?.subscriptionStatus)}
                                                                </span>
                                                            </div>
                                                        </TooltipProvider>
                                                        {currentPlanPeriodEnd ? (
                                                            <TooltipProvider delayDuration={200}>
                                                                <div className="grid grid-cols-[1rem_1fr] items-center gap-2">
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <span className="inline-flex h-4 w-4 items-center justify-center">
                                                                                <Clock
                                                                                    className={cn(
                                                                                        'h-4 w-4 shrink-0',
                                                                                        blueAccentTrial
                                                                                            ? 'text-[#c17a54]'
                                                                                            : 'text-slate-400'
                                                                                    )}
                                                                                    strokeWidth={2.25}
                                                                                    aria-hidden
                                                                                />
                                                                            </span>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent variant="light" side="top" align="start">
                                                                            {isTrialingCurrentPlan ? 'Trial ends on' : 'Renews on'}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                    <span className="text-sm font-medium text-slate-900 tabular-nums">
                                                                        {currentPlanPeriodEnd}
                                                                    </span>
                                                                </div>
                                                            </TooltipProvider>
                                                        ) : (
                                                            <div className="grid grid-cols-[1rem_1fr] items-center gap-2 opacity-0" aria-hidden>
                                                                <span className="h-4 w-4" />
                                                                <span className="text-sm font-medium tabular-nums">—</span>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <div
                                                        className="invisible pointer-events-none select-none"
                                                        aria-hidden
                                                    >
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="grid grid-cols-[1rem_1fr] items-center gap-2">
                                                                <span className="inline-flex h-4 w-4 items-center justify-center">
                                                                    <Ticket className="h-4 w-4 shrink-0" aria-hidden />
                                                                </span>
                                                                <span className="text-sm font-medium text-slate-600">
                                                                    Trialing
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-[1rem_1fr] items-center gap-2">
                                                                <span className="inline-flex h-4 w-4 items-center justify-center">
                                                                    <Clock className="h-4 w-4 shrink-0" aria-hidden />
                                                                </span>
                                                                <span className="text-sm font-medium text-slate-900 tabular-nums">
                                                                    Sep 30, 2099
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {plan.description ? (
                                        <p
                                            className={cn(
                                                'mt-2 leading-relaxed text-slate-600',
                                                compact ? 'text-xs line-clamp-3 sm:text-sm' : 'text-sm'
                                            )}
                                        >
                                            {withBrandName(plan.description)}
                                        </p>
                                    ) : null}

                                    {!isFreeTier && !compact && planHighlights.length > 0 ? (
                                        <div
                                            className={cn(
                                                'mt-5 border-t pt-5',
                                                blueAccentTrial ? 'border-[#ECC0AA]/28' : 'border-slate-100'
                                            )}
                                        >
                                            <PlanHighlightsScroll
                                                lines={planHighlights}
                                                checkIconClassName={highlightCheckClass}
                                                peachScrollbar={blueAccentTrial}
                                            />
                                        </div>
                                    ) : null}
                                    {isFreeTier && !compact ? (
                                        <div
                                            className={cn(
                                                'mt-5 border-t pt-5',
                                                blueAccentTrial ? 'border-[#ECC0AA]/28' : 'border-slate-100'
                                            )}
                                        >
                                            <ul className="space-y-2.5">
                                                {sandboxPlanHighlights.map((line) => (
                                                    <li key={line} className="flex gap-2.5 text-sm leading-snug text-slate-700">
                                                        <Check
                                                            className={cn(
                                                                'mt-0.5 h-4 w-4 shrink-0',
                                                                highlightCheckClass
                                                            )}
                                                            strokeWidth={2.25}
                                                            aria-hidden
                                                        />
                                                        <span>{line}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ) : null}

                                    <div className="mt-auto pt-6">
                                        {isCurrentPlan ? (
                                            showPortalButton ? (
                                                <Button
                                                    type="button"
                                                    variant="manageBillingCta"
                                                    className={cn(
                                                        'h-11 w-full rounded-lg',
                                                        blueAccentTrial &&
                                                            '!border-[#c49a82] !bg-[#ECC0AA]/40 !text-[#3d2a22] hover:!border-[#b07d62] hover:!bg-[#ECC0AA]/65 hover:!text-[#241814]'
                                                    )}
                                                    disabled={portalLoading}
                                                    onClick={() => void openBillingPortal()}
                                                >
                                                    <span className="relative z-10">
                                                        <span className="inline-flex items-center justify-center gap-2">
                                                            <CreditCard className="h-4 w-4 opacity-90" aria-hidden />
                                                            {portalLoading
                                                                ? upgradeCopy.billingPortalOpening
                                                                : upgradeCopy.billingPortalManageSubscriptionCta}
                                                        </span>
                                                    </span>
                                                </Button>
                                            ) : (
                                                <div
                                                    className={cn(
                                                        'rounded-xl border px-4 py-3 text-center shadow-sm',
                                                        blueAccentTrial
                                                            ? 'border-[#ECC0AA]/60 bg-[#ECC0AA]/22 shadow-[0_2px_12px_-6px_rgba(236,192,170,0.45)]'
                                                            : 'border-slate-200/80 bg-white/90'
                                                    )}
                                                >
                                                    <p
                                                        className={cn(
                                                            'text-sm font-medium',
                                                            blueAccentTrial ? 'text-[#7a5343]' : 'text-slate-800'
                                                        )}
                                                    >
                                                        {upgradeCopy.planPickerCurrentPlanBadge}
                                                    </p>
                                                </div>
                                            )
                                        ) : isFreeTier ? (
                                            <div
                                                className={cn(
                                                    'rounded-xl border px-4 py-3 text-center shadow-sm',
                                                    blueAccentTrial
                                                        ? 'border-[#ECC0AA]/45 bg-[#ECC0AA]/14'
                                                        : 'border-slate-200/80 bg-white/90'
                                                )}
                                            >
                                                <p
                                                    className={cn(
                                                        'text-sm font-medium',
                                                        blueAccentTrial ? 'text-[#7a5343]' : 'text-slate-800'
                                                    )}
                                                >
                                                    {upgradeCopy.billingIncludedLabel}
                                                </p>
                                                <p
                                                    className={cn(
                                                        'mt-1 text-xs',
                                                        blueAccentTrial ? 'text-[#7a5343]/75' : 'text-slate-500'
                                                    )}
                                                >
                                                    {upgradeCopy.freeSandboxFootnote}
                                                </p>
                                            </div>
                                        ) : isFirmBillingAdmin ? (
                                            <Button
                                                type="button"
                                                variant={blueAccentTrial ? 'outline' : 'blackCta'}
                                                className={cn(
                                                    'h-11 w-full',
                                                    blueAccentTrial ? polarBillingPeachCtaClass : polarBillingCtaButtonClass
                                                )}
                                                onClick={() => {
                                                    window.location.assign(checkoutHref)
                                                }}
                                            >
                                                <span className="relative z-10">
                                                    <span className="inline-flex items-center justify-center gap-2">
                                                        <CreditCard className="h-4 w-4 opacity-90" aria-hidden />
                                                        {isPaidRecurringCurrent
                                                            ? upgradeCopy.planPickerSwitchPlanCta
                                                            : upgradeCopy.planPickerCta}
                                                    </span>
                                                </span>
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        </li>
                    )
                })}
            </ul>
        </div>
    )
}
