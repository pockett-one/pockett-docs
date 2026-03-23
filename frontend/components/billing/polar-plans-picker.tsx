'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { BillingCatalogPlan } from '@/lib/billing/billing-catalog.types'
import { buildPolarCheckoutHref } from '@/lib/billing/polar-checkout-href'
import { upgradeCopy } from '@/lib/billing/upgrade-copy'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Check, ExternalLink, Loader2 } from 'lucide-react'

type CatalogJson = { items?: BillingCatalogPlan[]; error?: string }

interface PolarPlansPickerProps {
    firmId: string
    returnPath: string
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

export function PolarPlansPicker({ firmId, returnPath, density = 'default', className }: PolarPlansPickerProps) {
    const [plans, setPlans] = useState<BillingCatalogPlan[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

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
    const highlights = upgradeCopy.paidPlanHighlights

    return (
        <div className={cn('space-y-6', className)}>
            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-stretch lg:gap-6">
                {sortedPlans.map((plan) => {
                    const isFreeTier = plan.priceLabel === 'Free'
                    const href = buildPolarCheckoutHref({
                        firmId,
                        returnTo: returnPath,
                        productId: plan.id,
                    })
                    return (
                        <li key={plan.id}>
                            <article
                                className={cn(
                                    planCardBase,
                                    isFreeTier
                                        ? 'bg-slate-50/70 hover:border-slate-200 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,0.1)]'
                                        : 'border-violet-200/70 hover:border-violet-300/80 hover:shadow-[0_8px_24px_-8px_rgba(109,40,217,0.12),0_20px_48px_-16px_rgba(15,23,42,0.12)] hover:ring-violet-200/30'
                                )}
                            >
                                {!isFreeTier ? (
                                    <div className="absolute right-4 top-4">
                                        <span className="inline-flex items-center rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
                                            {upgradeCopy.billingRecommendedBadge}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="absolute right-4 top-4">
                                        <span className="inline-flex rounded-full bg-white/95 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200">
                                            {upgradeCopy.billingIncludedLabel}
                                        </span>
                                    </div>
                                )}

                                <div className={cn('flex flex-1 flex-col', compact ? 'p-4' : 'p-5 sm:p-6')}>
                                    <h3
                                        className={cn(
                                            'pr-24 font-semibold tracking-tight text-slate-900',
                                            compact ? 'text-base' : 'text-lg'
                                        )}
                                    >
                                        {plan.name}
                                    </h3>
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
                                            {plan.description}
                                        </p>
                                    ) : null}

                                    {!isFreeTier && !compact ? (
                                        <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5">
                                            {highlights.map((line) => (
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
                                    ) : null}

                                    <div className="mt-auto pt-6">
                                        {isFreeTier ? (
                                            <div className="rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-center shadow-sm">
                                                <p className="text-sm font-medium text-slate-800">
                                                    {upgradeCopy.planPickerCurrentPlanBadge}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {upgradeCopy.freeSandboxFootnote}
                                                </p>
                                            </div>
                                        ) : (
                                            <Button variant="blackCta" className="h-11 w-full text-sm font-semibold" asChild>
                                                <a href={href}>{upgradeCopy.planPickerCta}</a>
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
