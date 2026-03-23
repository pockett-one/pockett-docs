'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, CreditCard, ExternalLink, Lock, Receipt } from 'lucide-react'
import { getUserFirms } from '@/lib/actions/firms'
import { validateCheckoutReturnTo } from '@/lib/billing/checkout-return-path'
import { upgradeCopy } from '@/lib/billing/upgrade-copy'
import { BillingCheckoutFootnote } from '@/components/billing/billing-polar-inline'
import { PolarPlansPicker } from '@/components/billing/polar-plans-picker'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const trustItems = [
    {
        icon: Lock,
        title: upgradeCopy.billingTrustLine1,
        detail: upgradeCopy.billingTrustLine1Detail,
    },
    {
        icon: Building2,
        title: upgradeCopy.billingTrustLine2,
        detail: upgradeCopy.billingTrustLine2Detail,
    },
    {
        icon: Receipt,
        title: upgradeCopy.billingTrustLine3,
        detail: upgradeCopy.billingTrustLine3Detail,
    },
] as const

/** Profile / profile-billing card elevation */
const cardSurface = cn(
    'rounded-2xl border border-slate-200/90 bg-white',
    'shadow-[0_2px_8px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(15,23,42,0.12)]',
    'ring-1 ring-slate-900/[0.04]'
)

const trustCardSurface = cn(
    'rounded-2xl border border-slate-200/90 bg-white',
    'shadow-[0_2px_8px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(15,23,42,0.12)]',
    'ring-1 ring-slate-900/[0.04]',
    'transition-all duration-300 ease-out hover:border-slate-200',
    'hover:shadow-[0_8px_24px_-8px_rgba(109,40,217,0.1),0_20px_48px_-16px_rgba(15,23,42,0.12)]',
    'hover:ring-violet-200/25'
)

export function BillingPageClient() {
    const searchParams = useSearchParams()
    const firmSlugParam = searchParams.get('firmSlug')?.trim() || ''
    const returnToParam = searchParams.get('returnTo')

    const [firms, setFirms] = useState<Awaited<ReturnType<typeof getUserFirms>>>([])
    const [loadError, setLoadError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        getUserFirms()
            .then((list) => {
                if (!cancelled) setFirms(list)
            })
            .catch(() => {
                if (!cancelled) setLoadError('Could not load your workspaces.')
            })
        return () => {
            cancelled = true
        }
    }, [])

    const selectedFirm = useMemo(() => {
        if (!firms.length) return null
        if (firmSlugParam) {
            const bySlug = firms.find((f) => f.slug === firmSlugParam)
            if (bySlug) return bySlug
        }
        return firms.find((f) => f.isDefault) ?? firms[0]
    }, [firms, firmSlugParam])

    const returnPath =
        validateCheckoutReturnTo(returnToParam) ??
        (selectedFirm ? `/d/f/${selectedFirm.slug}` : '/d')

    return (
        <div className="relative mx-auto max-w-5xl space-y-10 pb-10 px-4 sm:px-5 md:px-6">
            <div
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-80"
                aria-hidden
            >
                <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-violet-200/30 blur-3xl" />
                <div className="absolute -right-12 top-40 h-48 w-48 rounded-full bg-indigo-200/25 blur-3xl" />
            </div>

            <Link
                href={returnPath}
                className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-violet-900"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 transition duration-300 group-hover:-translate-x-0.5 group-hover:shadow-md group-hover:ring-violet-200/70">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                </span>
                Back to workspace
            </Link>

            <header className="space-y-1.5">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {upgradeCopy.billingHeadline}
                </h1>
                <p className="text-sm font-medium text-slate-700">{upgradeCopy.billingTitle}</p>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{upgradeCopy.billingBody}</p>
            </header>

            <ul className="grid gap-4 sm:grid-cols-3">
                {trustItems.map(({ icon: Icon, title, detail }) => (
                    <li key={title} className={cn('flex gap-3 p-4 sm:p-5', trustCardSurface)}>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-indigo-50 text-violet-700">
                            <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{title}</p>
                            <p className="mt-0.5 text-xs leading-relaxed text-slate-600">{detail}</p>
                        </div>
                    </li>
                ))}
            </ul>

            <section
                className={cn(
                    'overflow-hidden',
                    cardSurface,
                    'transition-shadow duration-500 ease-out hover:shadow-[0_12px_40px_-12px_rgba(15,23,42,0.14)]'
                )}
            >
                <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-50/95 via-white to-violet-50/35 px-5 py-5 sm:px-7 sm:py-6">
                    <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-200/50 to-transparent"
                        aria-hidden
                    />
                    <div className="group/billhead flex items-start gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-500/25 ring-1 ring-white/20 transition duration-300 group-hover/billhead:scale-[1.04] group-hover/billhead:shadow-violet-500/40">
                            <CreditCard className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
                                {upgradeCopy.billingEyebrow}
                            </h2>
                            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                                Workspace
                            </p>
                            {loadError ? (
                                <p className="mt-1 text-sm text-red-600">{loadError}</p>
                            ) : !firms.length ? (
                                <p className="mt-1 text-sm text-slate-600">
                                    No workspaces found. Open the app from a firm first.
                                </p>
                            ) : selectedFirm ? (
                                <p className="mt-0.5 text-sm text-slate-700">
                                    <span className="font-medium">{selectedFirm.name}</span>
                                    <span className="font-mono text-xs text-slate-400">
                                        {' '}
                                        /{selectedFirm.slug}
                                    </span>
                                </p>
                            ) : null}
                        </div>
                    </div>
                </div>

                <div className="space-y-6 px-5 py-6 sm:px-7 sm:py-7">
                    {selectedFirm ? (
                        <PolarPlansPicker firmId={selectedFirm.id} returnPath={returnPath} density="default" />
                    ) : null}

                    <div className="flex flex-col gap-5 border-t border-slate-100 pt-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                        <div className="min-w-0 flex-1 space-y-3">
                            <BillingCheckoutFootnote />
                            <p className="text-xs leading-relaxed text-slate-500">
                                {upgradeCopy.billingFooterHelp}
                            </p>
                        </div>
                        <Link
                            href="/pricing"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                                buttonVariants({ variant: 'outline', size: 'default' }),
                                'inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 sm:w-auto'
                            )}
                        >
                            {upgradeCopy.ctaComparePlans}
                            <ExternalLink className="h-3.5 w-3.5 opacity-70" aria-hidden />
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
