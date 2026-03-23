'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, Clock, CreditCard, Ticket, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { profileBillingCopy } from '@/lib/billing/profile-billing-copy'
import { getProfileBillingSandboxInclusions } from '@/config/pricing'
import { cn } from '@/lib/utils'

export type ProfileBillingSerializable = {
    workspaceFirmId: string
    workspaceName: string
    workspaceSlug: string
    planName: string
    subscriptionStatus: string
    periodEndIso: string | null
    sandboxOnly: boolean
    polarCustomerId: string | null
}

function freePlanInclusions(sandboxOnly: boolean): string[] {
    if (sandboxOnly) {
        return [...getProfileBillingSandboxInclusions()]
    }
    return [
        'Workspace access under your current subscription',
        'Manage payment methods and invoices from Polar when applicable',
    ]
}

function formatStatus(status: string | null | undefined): string {
    if (!status || status === 'none') return 'Setup pending'
    return status
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
}

/** Current plan summary typography — uniform small body (profile billing card). */
const planSummarySm = 'text-sm font-medium leading-normal'
const planSummaryRowLabel = `${planSummarySm} uppercase tracking-[0.14em] text-slate-400`
const planSummaryRowStatusValue = `${planSummarySm} text-slate-600`
const planSummaryValue = `${planSummarySm} text-slate-900 tabular-nums`
const planSummarySectionHeading = `${planSummarySm} uppercase tracking-[0.14em] text-slate-400`

export function ProfileBillingSection({ billing }: { billing: ProfileBillingSerializable }) {
    const [portalLoading, setPortalLoading] = useState(false)
    const [portalError, setPortalError] = useState<string | null>(null)
    const upgradeHref = useMemo(() => {
        const q = new URLSearchParams()
        q.set('firmSlug', billing.workspaceSlug)
        q.set('returnTo', '/d/profile')
        return `/d/billing?${q.toString()}`
    }, [billing.workspaceSlug])

    const openPortal = async () => {
        setPortalError(null)
        setPortalLoading(true)
        try {
            const res = await fetch('/api/billing/customer-portal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ firmId: billing.workspaceFirmId }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) {
                throw new Error(typeof data.error === 'string' ? data.error : profileBillingCopy.portalError)
            }
            if (typeof data.url === 'string' && data.url.startsWith('http')) {
                window.location.href = data.url
                return
            }
            throw new Error(profileBillingCopy.portalError)
        } catch (e) {
            setPortalError(e instanceof Error ? e.message : profileBillingCopy.portalError)
        } finally {
            setPortalLoading(false)
        }
    }

    const inclusions = freePlanInclusions(billing.sandboxOnly)

    return (
        <section
            className={cn(
                'overflow-hidden rounded-2xl border border-slate-200/90 bg-white',
                'shadow-[0_2px_8px_rgba(15,23,42,0.04),0_18px_44px_-14px_rgba(15,23,42,0.11)]',
                'ring-1 ring-slate-900/[0.04]',
                'transition-shadow duration-500 ease-out hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.14)]'
            )}
        >
            <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-50/95 via-white to-violet-50/35 px-5 py-5 sm:px-7 sm:py-6">
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-200/50 to-transparent"
                    aria-hidden
                />
                <div className="group/billhead flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/25 ring-1 ring-white/20 transition duration-300 group-hover/billhead:scale-[1.04] group-hover/billhead:shadow-violet-500/40">
                            <CreditCard className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                {profileBillingCopy.billingSectionTitle}
                            </h2>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                                {profileBillingCopy.workspaceLabel}
                            </p>
                            <p className="mt-0.5 text-sm text-slate-700">
                                <span className="font-medium">{billing.workspaceName}</span>
                                <span className="font-mono text-xs text-slate-400"> /{billing.workspaceSlug}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
                <div
                    className={cn(
                        'rounded-xl border border-slate-100 bg-white p-5 sm:p-6',
                        'shadow-sm shadow-slate-900/5',
                        'transition-all duration-300 ease-out',
                        'hover:border-slate-200/90 hover:shadow-md hover:shadow-slate-900/[0.07]'
                    )}
                >
                    <TooltipProvider delayDuration={200}>
                        {/*
                          Outer grid: right column width = max of both rows so icon columns share one width.
                          Inner grid: fixed 1rem icon track (left-aligned) + value (right-aligned) so Ticket & Clock line up.
                        */}
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 sm:gap-y-3.5">
                            <p className={cn('min-w-0 self-center', planSummaryRowLabel)}>
                                {profileBillingCopy.currentPlanHeading}
                            </p>
                            <div className="grid w-full min-w-0 grid-cols-[1rem_1fr] items-center gap-2 self-center">
                                <div className="flex w-4 shrink-0 justify-start">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                className="-m-1 inline-flex rounded-md p-1 text-slate-400 outline-none ring-offset-2 transition-all duration-200 hover:scale-110 hover:bg-violet-50 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                                                aria-label={`${profileBillingCopy.statusLabel}: ${formatStatus(billing.subscriptionStatus)}`}
                                            >
                                                <Ticket className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" align="end">
                                            <p className="max-w-[220px] leading-snug">{profileBillingCopy.statusIconTooltip}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <span className={cn(planSummaryRowStatusValue, 'min-w-0 text-left tabular-nums')}>
                                    {formatStatus(billing.subscriptionStatus)}
                                </span>
                            </div>
                            <p className={cn('min-w-0 self-center', planSummaryValue)}>{billing.planName}</p>
                            {billing.periodEndIso ? (
                                <div className="grid w-full min-w-0 grid-cols-[1rem_1fr] items-center gap-2 self-center">
                                    <div className="flex w-4 shrink-0 justify-start">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="-m-1 inline-flex rounded-md p-1 text-slate-400 outline-none ring-offset-2 transition-all duration-200 hover:scale-110 hover:bg-violet-50 hover:text-violet-700 focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
                                                    aria-label={`${profileBillingCopy.renewsOnLabel} ${new Date(billing.periodEndIso).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
                                                >
                                                    <Clock className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="end" className="max-w-[260px]">
                                                <p className="font-medium text-gray-900">
                                                    {profileBillingCopy.renewsOnLabel}{' '}
                                                    {new Date(billing.periodEndIso).toLocaleDateString(undefined, {
                                                        dateStyle: 'medium',
                                                    })}
                                                </p>
                                                <p className="mt-1.5 text-gray-600">{profileBillingCopy.renewsIconTooltip}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                    <span className={cn(planSummaryValue, 'min-w-0 text-left tabular-nums')}>
                                        {new Date(billing.periodEndIso).toLocaleDateString(undefined, {
                                            dateStyle: 'medium',
                                        })}
                                    </span>
                                </div>
                            ) : (
                                <span className="self-center" aria-hidden />
                            )}
                        </div>
                    </TooltipProvider>

                    <div className="mt-6 border-t border-slate-100 pt-6">
                        <p className={planSummarySectionHeading}>{profileBillingCopy.inclusionsHeading}</p>
                        <ul className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2.5 sm:grid-cols-2">
                            {inclusions.map((line, idx) => (
                                <li
                                    key={`${idx}-${line.slice(0, 48)}`}
                                    className="group/inc flex gap-2.5 rounded-lg px-2 py-2 text-sm leading-snug text-slate-600 transition-colors duration-200 -mx-2 hover:bg-slate-50/90 hover:text-slate-800"
                                >
                                    <Check
                                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600/90 transition-colors duration-200 group-hover/inc:text-emerald-700"
                                        strokeWidth={2.25}
                                        aria-hidden
                                    />
                                    <span>{line}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="group/upgrade flex flex-col gap-4 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/90 via-white to-violet-50/40 p-4 transition-all duration-300 ease-out hover:border-violet-200/70 hover:shadow-md hover:shadow-violet-500/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex gap-3.5">
                        <div
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-violet-700 shadow-sm ring-1 ring-slate-200/80 transition duration-300 group-hover/upgrade:scale-105 group-hover/upgrade:ring-violet-200/60 group-hover/upgrade:shadow-md"
                            aria-hidden
                        >
                            <TrendingUp className="h-5 w-5" strokeWidth={2} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-slate-900">{profileBillingCopy.upgradeTitle}</p>
                            <p className="mt-1 max-w-md text-xs leading-relaxed text-slate-600">
                                {profileBillingCopy.upgradeBody}
                            </p>
                        </div>
                    </div>
                    <Button
                        type="button"
                        variant="blackCta"
                        className="h-11 w-full shrink-0 px-6 text-sm font-semibold sm:w-auto"
                        asChild
                    >
                        <Link href={upgradeHref}>{profileBillingCopy.upgradeCta}</Link>
                    </Button>
                </div>

                <div className="border-t border-slate-100 pt-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {profileBillingCopy.managePaymentsSectionTitle}
                    </p>
                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <p className="max-w-md text-xs leading-relaxed text-slate-500">
                            {profileBillingCopy.managePaymentsHint}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-10 w-full border-slate-200 bg-white/80 text-slate-800 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-white hover:shadow-md sm:w-auto"
                            disabled={!billing.polarCustomerId || portalLoading}
                            onClick={() => void openPortal()}
                        >
                            {portalLoading ? 'Opening…' : profileBillingCopy.managePaymentsCta}
                        </Button>
                    </div>
                    {!billing.polarCustomerId ? (
                        <p className="mt-3 text-xs leading-relaxed text-amber-900/90">
                            Payment management unlocks after billing is linked (complete onboarding with Polar
                            configured).
                        </p>
                    ) : null}
                    {portalError ? <p className="mt-2 text-xs text-red-600">{portalError}</p> : null}
                </div>
            </div>
        </section>
    )
}
