'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Building2, CreditCard, Loader2, Lock, Receipt } from 'lucide-react'
import { getUserFirms } from '@/lib/actions/firms'
import { validateCheckoutReturnTo } from '@/lib/billing/checkout-return-path'
import { upgradeCopy } from '@/lib/billing/upgrade-copy'
import { PolarPlansPicker, type BillingCurrentPlanState } from '@/components/billing/polar-plans-picker'
import { fetchBillingCurrentPlan } from '@/lib/billing/fetch-billing-current-plan'
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

/** Billing page: richer #ECC0AA presence on trust row */
const trustCardSurfacePeach = cn(
    'rounded-2xl border border-[#ECC0AA]/45 bg-gradient-to-br from-[#ECC0AA]/16 via-white to-white',
    'shadow-[0_2px_8px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(236,192,170,0.14)]',
    'ring-1 ring-[#ECC0AA]/22',
    'transition-all duration-300 ease-out hover:border-[#ECC0AA]/65',
    'hover:shadow-[0_8px_24px_-8px_rgba(236,192,170,0.18),0_20px_48px_-16px_rgba(15,23,42,0.1)]',
    'hover:ring-[#ECC0AA]/35'
)

/** Icon wells — trial accent #ECC0AA (billing page only; promote to tokens if we keep it) */
const billingIconTileClass = cn(
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
    'bg-gradient-to-br from-[#ECC0AA]/55 via-[#ECC0AA]/22 to-slate-50 text-[#5c3f32]',
    'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.55),0_1px_2px_rgba(15,23,42,0.07)]',
    'ring-1 ring-[#ECC0AA]/55'
)

export function BillingPageClient() {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()
    const firmSlugParam = searchParams.get('firmSlug')?.trim() || ''
    const returnToParam = searchParams.get('returnTo')
    const paidPlanIntent = searchParams.get('paid_plan') === 'true'

    const [firms, setFirms] = useState<Awaited<ReturnType<typeof getUserFirms>>>([])
    const [loadError, setLoadError] = useState<string | null>(null)
    const [currentPlanState, setCurrentPlanState] = useState<BillingCurrentPlanState | null>(null)
    const [firmManageOk, setFirmManageOk] = useState(false)
    const [firmManageChecked, setFirmManageChecked] = useState(false)
    const [skipSubmitting, setSkipSubmitting] = useState(false)
    const [skipMessage, setSkipMessage] = useState<string | null>(null)

    const portalReturnPath = useMemo(() => {
        const q = searchParams.toString()
        return q ? `${pathname}?${q}` : pathname
    }, [pathname, searchParams])

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

    useEffect(() => {
        let cancelled = false
        if (!selectedFirm?.id) {
            setCurrentPlanState(null)
            return
        }
        void fetchBillingCurrentPlan(selectedFirm.id)
            .then((current) => {
                if (!cancelled) setCurrentPlanState(current)
            })
            .catch(() => {
                if (!cancelled) setCurrentPlanState(null)
            })
        return () => {
            cancelled = true
        }
    }, [selectedFirm?.id])

    useEffect(() => {
        const refresh = () => {
            if (document.visibilityState !== 'visible') return
            const id = selectedFirm?.id
            if (!id) return
            void fetchBillingCurrentPlan(id)
                .then(setCurrentPlanState)
                .catch(() => {
                    setCurrentPlanState(null)
                })
        }
        document.addEventListener('visibilitychange', refresh)
        window.addEventListener('focus', refresh)
        return () => {
            document.removeEventListener('visibilitychange', refresh)
            window.removeEventListener('focus', refresh)
        }
    }, [selectedFirm?.id])

    const returnPath =
        validateCheckoutReturnTo(returnToParam) ??
        (selectedFirm ? `/d/f/${selectedFirm.slug}` : '/d')

    useEffect(() => {
        if (loadError || !firms.length || !selectedFirm?.id) {
            setFirmManageOk(false)
            setFirmManageChecked(true)
            return
        }
        let cancelled = false
        setFirmManageChecked(false)
        fetch(`/api/permissions/firm?firmId=${encodeURIComponent(selectedFirm.id)}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error('perm'))))
            .then((data: { canManage?: boolean }) => {
                if (cancelled) return
                if (data?.canManage === true) {
                    setFirmManageOk(true)
                    setFirmManageChecked(true)
                    return
                }
                setFirmManageOk(false)
                setFirmManageChecked(true)
                router.replace(returnPath)
            })
            .catch(() => {
                if (cancelled) return
                setFirmManageOk(false)
                setFirmManageChecked(true)
                router.replace(returnPath)
            })
        return () => {
            cancelled = true
        }
    }, [loadError, firms.length, selectedFirm?.id, returnPath, router])

    if (firms.length > 0 && selectedFirm?.id && !firmManageChecked) {
        return (
            <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin text-slate-500/80" aria-hidden />
                <span>Loading billing…</span>
            </div>
        )
    }

    if (firms.length > 0 && selectedFirm?.id && firmManageChecked && !firmManageOk) {
        return null
    }

    const handleSkipUpgrade = async () => {
        setSkipMessage(null)
        setSkipSubmitting(true)
        try {
            const response = await fetch('/api/billing/skip-upgrade', { method: 'POST' })
            if (!response.ok) {
                throw new Error('Failed to skip for now')
            }
            setSkipMessage('Saved. We will remind you to upgrade on future sign-ins.')
            router.replace(returnPath)
        } catch (error) {
            setSkipMessage(error instanceof Error ? error.message : 'Could not save skip preference')
        } finally {
            setSkipSubmitting(false)
        }
    }

    return (
        <div className="relative mx-auto max-w-5xl space-y-10 pb-10 px-4 sm:px-5 md:px-6">
            <div
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-80"
                aria-hidden
            >
                <div className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-[#ECC0AA]/35 blur-3xl" />
                <div className="absolute -right-10 top-32 h-56 w-56 rounded-full bg-[#ECC0AA]/22 blur-3xl" />
                <div className="absolute right-1/4 top-[22rem] h-40 w-40 rounded-full bg-[#ECC0AA]/12 blur-3xl" />
            </div>

            <Link
                href={returnPath}
                className="group inline-flex items-center gap-2 text-sm font-medium text-[#7a5343] transition-colors hover:text-[#5c3f32]"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#ECC0AA]/40 transition duration-300 group-hover:-translate-x-0.5 group-hover:shadow-md group-hover:ring-[#ECC0AA]/65">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                </span>
                Back to workspace
            </Link>

            <header className="space-y-1.5">
                <h1 className="d-title flex items-center gap-2.5">
                    {upgradeCopy.billingHeadline}
                </h1>
                <p className="text-sm font-medium text-[#7a5343]">{upgradeCopy.billingTitle}</p>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{upgradeCopy.billingBody}</p>
                {paidPlanIntent && (
                    <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                        You currently have an active Free plan. You can upgrade now, or skip and continue.
                    </div>
                )}
                {skipMessage && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {skipMessage}
                    </div>
                )}
            </header>

            <ul className="grid gap-4 sm:grid-cols-3">
                {trustItems.map(({ icon: Icon, title, detail }) => (
                    <li key={title} className={cn('flex gap-3 p-4 sm:p-5', trustCardSurfacePeach)}>
                        <span className={billingIconTileClass}>
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
                    'relative overflow-hidden',
                    cardSurface,
                    'ring-1 ring-[#ECC0AA]/30',
                    'transition-shadow duration-500 ease-out hover:shadow-[0_12px_40px_-12px_rgba(236,192,170,0.2)]'
                )}
            >
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-[#ECC0AA]/90 via-[#ECC0AA] to-[#ECC0AA]/90"
                    aria-hidden
                />
                <div className="relative border-b border-[#ECC0AA]/20 bg-gradient-to-br from-[#ECC0AA]/30 via-white to-slate-50/45 px-5 py-5 sm:px-7 sm:py-6">
                    <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#ECC0AA]/35 to-transparent"
                        aria-hidden
                    />
                    <div className="group/billhead flex items-start gap-3.5">
                        <span
                            className={cn(
                                billingIconTileClass,
                                'transition duration-300 group-hover/billhead:ring-[#ECC0AA]/55'
                            )}
                        >
                            <CreditCard className="h-5 w-5" aria-hidden />
                        </span>
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
                        <PolarPlansPicker
                            firmId={selectedFirm.id}
                            returnPath={returnPath}
                            portalReturnPath={portalReturnPath}
                            density="default"
                            currentPlanState={currentPlanState}
                            blueAccentTrial
                        />
                    ) : null}
                </div>
            </section>
            {paidPlanIntent && (
                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={handleSkipUpgrade}
                        disabled={skipSubmitting}
                        className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                        {skipSubmitting ? 'Saving…' : 'Skip for now'}
                    </button>
                </div>
            )}
        </div>
    )
}
