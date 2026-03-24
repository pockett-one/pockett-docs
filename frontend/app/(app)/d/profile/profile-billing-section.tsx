'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { Clock, CreditCard, Ticket } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { profileBillingCopy } from '@/lib/billing/profile-billing-copy'
import { cn } from '@/lib/utils'

export type ProfileBillingSerializable = {
    workspaceFirmId: string
    workspaceName: string
    workspaceSlug: string
    planName: string
    subscriptionStatus: string
    pricingModel: 'recurring_subscription' | 'one_time_purchase' | null
    periodEndIso: string | null
    sandboxOnly: boolean
    polarCustomerId: string | null
    polarSubscriptionId: string | null
    isFirmBillingAdmin: boolean
}

function formatStatus(status: string | null | undefined): string {
    if (!status || status === 'none') return 'Setup pending'
    return status
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ')
}

const planSummarySm = 'text-sm font-medium leading-normal'
const planSummaryRowLabel = `${planSummarySm} uppercase tracking-[0.14em] text-slate-400`
const planSummaryRowStatusValue = `${planSummarySm} text-slate-600`
const planSummaryValue = `${planSummarySm} text-slate-900 tabular-nums`

export function ProfileBillingSection({ billing }: { billing: ProfileBillingSerializable }) {
    const upgradeHref = useMemo(() => {
        const q = new URLSearchParams()
        q.set('firmSlug', billing.workspaceSlug)
        q.set('returnTo', '/d/profile')
        return `/d/billing?${q.toString()}`
    }, [billing.workspaceSlug])

    const isTrialing = billing.subscriptionStatus === 'trialing'

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
                            <p className="mt-2 text-xs leading-relaxed text-slate-500">
                                {profileBillingCopy.billingSectionPlansOnBillingHint}{' '}
                                <Link
                                    href={upgradeHref}
                                    className="font-medium text-violet-700 underline decoration-violet-300/70 underline-offset-2 hover:text-violet-900"
                                >
                                    {profileBillingCopy.billingSectionPlansOnBillingLink}
                                </Link>
                                .
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-5 py-6 sm:px-7 sm:py-7">
                <div
                    className={cn(
                        'rounded-xl border border-slate-100 bg-white p-5 sm:p-6',
                        'shadow-sm shadow-slate-900/5',
                        'transition-all duration-300 ease-out',
                        'hover:border-slate-200/90 hover:shadow-md hover:shadow-slate-900/[0.07]'
                    )}
                >
                    <TooltipProvider delayDuration={200}>
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
                                                    aria-label={`${isTrialing ? profileBillingCopy.trialEndsOnLabel : profileBillingCopy.renewsOnLabel} ${new Date(billing.periodEndIso).toLocaleDateString(undefined, { dateStyle: 'medium' })}`}
                                                >
                                                    <Clock className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
                                                </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" align="end" className="max-w-[260px]">
                                                <p className="font-medium text-gray-900">
                                                    {isTrialing
                                                        ? profileBillingCopy.trialEndsOnLabel
                                                        : profileBillingCopy.renewsOnLabel}{' '}
                                                    {new Date(billing.periodEndIso).toLocaleDateString(undefined, {
                                                        dateStyle: 'medium',
                                                    })}
                                                </p>
                                                <p className="mt-1.5 text-gray-600">
                                                    {isTrialing
                                                        ? profileBillingCopy.trialEndsIconTooltip
                                                        : profileBillingCopy.renewsIconTooltip}
                                                </p>
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
                </div>
            </div>
        </section>
    )
}
