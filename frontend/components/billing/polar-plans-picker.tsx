'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { BillingCatalogPlan } from '@/lib/billing/billing-catalog.types'
import { buildPolarCheckoutHref } from '@/lib/billing/polar-checkout-href'
import { openPolarCustomerPortalSession } from '@/lib/billing/open-polar-customer-portal'
import { upgradeCopy } from '@/lib/billing/upgrade-copy'
import { BRAND_NAME } from '@/config/brand'
import { getPricingComparisonBulletsForPlan, type PricingPlanColumnId } from '@/config/pricing'
import { BillingPolarExplainInline } from '@/components/billing/billing-polar-inline'
import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, Clock, ExternalLink, Loader2, Ticket } from 'lucide-react'

type CatalogJson = { items?: BillingCatalogPlan[]; error?: string }
export type BillingCurrentPlanState = {
    subscriptionStatus: string | null
    subscriptionPlan: string | null
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
}

function planSort(a: BillingCatalogPlan, b: BillingCatalogPlan) {
    const aFree = a.priceLabel === 'Free' ? 1 : 0
    const bFree = b.priceLabel === 'Free' ? 1 : 0
    return aFree - bFree
}

/** Match profile billing inner / account cards */
const planCardBase = cn(
    'relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90',
    'bg-white',
    'shadow-[0_2px_8px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(15,23,42,0.12)]',
    'ring-1 ring-slate-900/[0.04]',
    'transition-all duration-300 ease-out'
)

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

function ComparePlansPricingLink({
    density,
    className,
}: {
    density: 'default' | 'compact'
    className?: string
}) {
    const compact = density === 'compact'
    return (
        <Link
            href="/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                buttonVariants({ variant: 'outline', size: compact ? 'sm' : 'default' }),
                'inline-flex shrink-0 items-center justify-center gap-2 border-slate-300 bg-white font-medium text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50',
                compact ? 'h-9 px-3 text-xs' : 'h-10 px-4 text-sm',
                'w-full sm:w-auto',
                className
            )}
        >
            {upgradeCopy.ctaComparePlans}
            <ExternalLink className={cn('opacity-70', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} aria-hidden />
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
                <Loader2 className="h-7 w-7 animate-spin text-violet-600/70" aria-hidden />
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
                <Button variant="outline" className="h-10 w-full border-slate-200 bg-white/80 shadow-sm sm:w-auto" asChild>
                    <Link href="/pricing" target="_blank" rel="noopener noreferrer" className="gap-2">
                        {upgradeCopy.ctaComparePlans}
                        <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                    </Link>
                </Button>
            </div>
        )
    }

    const compact = density === 'compact'
    const isPaidRecurringCurrent =
        currentPlanState?.pricingModel === 'recurring_subscription' &&
        ['active', 'trialing', 'past_due'].includes((currentPlanState.subscriptionStatus ?? '').toLowerCase())
    const paidPlans = sortedPlans.filter((p) => p.pricingModel === 'recurring_subscription')
    const freeLikePlans = sortedPlans.filter((p) => p.pricingModel === 'one_time_purchase')
    const paidMatch = paidPlans.find((p) => namesLikelyMatch(p.name, currentPlanState?.subscriptionPlan))
    const currentPlanId = isPaidRecurringCurrent
        ? (paidMatch?.id ?? (paidPlans.length === 1 ? paidPlans[0]?.id : null))
        : currentPlanState?.pricingModel === 'one_time_purchase'
            ? (freeLikePlans.find((p) => p.priceLabel === 'Free')?.id ?? freeLikePlans[0]?.id ?? null)
            : null
    const paidCtaLabel = isPaidRecurringCurrent
        ? upgradeCopy.planPickerSwitchPlanCta
        : upgradeCopy.planPickerCta

    const portalSwitchUi =
        isPaidRecurringCurrent && Boolean(currentPlanState?.canOpenCustomerPortal)
    const showPortalButton = portalSwitchUi && Boolean(currentPlanState?.isFirmBillingAdmin)
    const showAdminOnlyBlock = portalSwitchUi && !currentPlanState?.isFirmBillingAdmin

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
            {!showPortalButton ? (
                <div className="flex flex-col gap-2 sm:ml-auto sm:max-w-md sm:items-end">
                    <ComparePlansPricingLink density={density} />
                    <p
                        className={cn(
                            'text-xs leading-relaxed text-slate-500 sm:text-right',
                            density === 'compact' && 'text-[11px]'
                        )}
                    >
                        {upgradeCopy.billingFooterHelp}
                    </p>
                </div>
            ) : null}
            {showAdminOnlyBlock ? (
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950 shadow-sm">
                    {upgradeCopy.billingPortalAdminOnlyHint}
                </div>
            ) : null}
            {showPortalButton ? (
                <div
                    className={cn(
                        'rounded-2xl border border-violet-200/80 bg-gradient-to-br from-violet-50/90 via-white to-slate-50/80',
                        'shadow-sm ring-1 ring-violet-100/60',
                        compact ? 'p-4' : 'p-4 sm:p-5'
                    )}
                >
                    <p className="text-sm leading-relaxed text-slate-800">
                        {upgradeCopy.billingPortalSwitchOpensSecurePage}
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        <span>{upgradeCopy.billingPortalManagedByPrefix}</span>
                        <BillingPolarExplainInline className="mx-0.5" />
                        <span>{upgradeCopy.billingPortalManagedBySuffix}</span>
                    </p>
                    <div
                        className={cn(
                            'mt-4 grid gap-4 sm:grid-cols-2 sm:items-start sm:gap-6',
                            compact && 'mt-3'
                        )}
                    >
                        <div className="flex min-w-0 flex-col gap-2">
                            <Button
                                type="button"
                                variant="blackCta"
                                className="h-11 w-full text-sm font-semibold sm:w-auto sm:min-w-[200px]"
                                disabled={portalLoading}
                                onClick={() => void openBillingPortal()}
                            >
                                {portalLoading
                                    ? upgradeCopy.billingPortalOpening
                                    : upgradeCopy.billingPortalManageSubscriptionCta}
                            </Button>
                            <p
                                className={cn(
                                    'text-xs leading-relaxed text-slate-500',
                                    compact && 'text-[11px]'
                                )}
                            >
                                {upgradeCopy.billingPortalSyncFootnote}
                            </p>
                        </div>
                        <div className="flex min-w-0 flex-col gap-2">
                            <ComparePlansPricingLink
                                density={density}
                                className="h-11 w-full sm:min-w-[11rem] sm:w-auto"
                            />
                            <p
                                className={cn(
                                    'text-xs leading-relaxed text-slate-500',
                                    compact && 'text-[11px]'
                                )}
                            >
                                {upgradeCopy.billingFooterHelp}
                            </p>
                        </div>
                    </div>
                    {portalError ? <p className="mt-3 text-sm text-red-600">{portalError}</p> : null}
                </div>
            ) : null}
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
                    const href = buildPolarCheckoutHref({
                        firmId,
                        returnTo: returnPath,
                        productId: plan.id,
                    })
                    return (
                        <li key={plan.id} className="relative pt-3">
                            {!isCurrentPlan && !isFreeTier && plan.isRecommended ? (
                                <div className="pointer-events-none absolute left-1/2 top-0 z-30 -translate-x-1/2">
                                    <span className="inline-flex items-center rounded-full border border-violet-200/70 bg-violet-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white shadow-md">
                                        {upgradeCopy.billingRecommendedBadge}
                                    </span>
                                </div>
                            ) : null}
                            <article
                                className={cn(
                                    planCardBase,
                                    isFreeTier
                                        ? 'bg-slate-50/70 hover:border-slate-200 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1)]'
                                        : 'border-violet-200/70 hover:border-violet-300/80 hover:shadow-[0_8px_24px_-8px_rgba(109,40,217,0.12),0_20px_48px_-16px_rgba(15,23,42,0.12)] hover:ring-violet-200/30'
                                )}
                            >
                                <div className={cn('flex flex-1 flex-col', compact ? 'p-4' : 'p-5 sm:p-6')}>
                                    <div className="flex items-start justify-between gap-4">
                                        <h3
                                            className={cn(
                                                'font-semibold tracking-tight text-slate-900',
                                                compact ? 'text-base' : 'text-lg'
                                            )}
                                        >
                                            {plan.name}
                                        </h3>
                                        {isCurrentPlan ? (
                                            <div className="min-w-[140px] shrink-0 space-y-1">
                                                <div className="grid grid-cols-[1rem_1fr] items-center gap-2">
                                                    <Ticket
                                                        className="h-4 w-4 shrink-0 text-slate-400"
                                                        strokeWidth={2.25}
                                                        aria-hidden
                                                    />
                                                    <span className="text-sm font-medium text-slate-600">
                                                        {formatStatus(currentPlanState?.subscriptionStatus)}
                                                    </span>
                                                </div>
                                                {currentPlanPeriodEnd ? (
                                                    <div className="grid grid-cols-[1rem_1fr] items-center gap-2">
                                                        <Clock
                                                            className="h-4 w-4 shrink-0 text-slate-400"
                                                            strokeWidth={2.25}
                                                            aria-hidden
                                                        />
                                                        <span className="text-sm font-medium text-slate-900 tabular-nums">
                                                            {currentPlanPeriodEnd}
                                                        </span>
                                                    </div>
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                    <p
                                        className={cn(
                                            'mt-2 font-semibold tabular-nums tracking-tight text-slate-900',
                                            isFreeTier ? 'text-xl' : 'text-2xl'
                                        )}
                                    >
                                        {plan.priceLabel}
                                    </p>

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
                                        <div className="mt-5 border-t border-slate-100 pt-5">
                                            <ul className="h-52 space-y-2.5 overflow-y-auto pr-1">
                                                {planHighlights.map((line) => (
                                                    <li key={line} className="flex gap-2.5 text-sm leading-snug text-slate-700">
                                                        <Check
                                                            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600/90"
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
                                            <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-center shadow-sm">
                                                <p className="text-sm font-medium text-slate-800">
                                                    {upgradeCopy.planPickerCurrentPlanBadge}
                                                </p>
                                            </div>
                                        ) : isFreeTier ? (
                                            <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-center shadow-sm">
                                                <p className="text-sm font-medium text-slate-800">
                                                    {upgradeCopy.billingIncludedLabel}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {upgradeCopy.freeSandboxFootnote}
                                                </p>
                                            </div>
                                        ) : showPortalButton ? (
                                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-center shadow-sm">
                                                <p className="text-sm text-slate-600">
                                                    {upgradeCopy.billingPortalSwitchUseSharedCtaHint}
                                                </p>
                                            </div>
                                        ) : showAdminOnlyBlock ? (
                                            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-center shadow-sm">
                                                <p className="text-sm text-slate-600">
                                                    {upgradeCopy.billingPortalAdminOnlyHint}
                                                </p>
                                            </div>
                                        ) : (
                                            <Button variant="blackCta" className="h-11 w-full text-sm font-semibold" asChild>
                                                <a href={href}>{paidCtaLabel}</a>
                                            </Button>
                                        )}
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
