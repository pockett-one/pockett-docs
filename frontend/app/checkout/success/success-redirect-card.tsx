'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { clearCheckoutIntent } from '@/lib/marketing/checkout-intent'

const REDIRECT_SECONDS = 5

type Props = {
    checkoutId?: string
    primaryHref: string
    primaryLabel: string
}

export function SuccessRedirectCard({ checkoutId, primaryHref, primaryLabel }: Props) {
    const router = useRouter()
    const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

    useEffect(() => {
        clearCheckoutIntent()
    }, [])

    useEffect(() => {
        const intervalId = window.setInterval(() => {
            setSecondsLeft((prev) => Math.max(0, prev - 1))
        }, 1000)
        return () => window.clearInterval(intervalId)
    }, [])

    useEffect(() => {
        if (secondsLeft !== 0) return
        router.push(primaryHref)
    }, [secondsLeft, primaryHref, router])

    const progressPercent = useMemo(() => {
        const elapsed = REDIRECT_SECONDS - secondsLeft
        return Math.min(100, Math.max(0, (elapsed / REDIRECT_SECONDS) * 100))
    }, [secondsLeft])

    return (
        <div className="relative min-h-[70vh] px-4 py-16">
            <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
                <div className="absolute -left-16 top-8 h-64 w-64 rounded-full bg-slate-200/35 blur-3xl" />
                <div className="absolute -right-14 top-28 h-56 w-56 rounded-full bg-slate-300/25 blur-3xl" />
            </div>

            <div className="mx-auto flex max-w-xl items-center justify-center">
                <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-7 text-center shadow-[0_2px_8px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.04]">
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-50/90 via-slate-50/35 to-transparent" />
                    <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-slate-200/70">
                    <div
                        className="h-1 rounded-t-2xl bg-slate-600 transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                    <div className="relative z-10 mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-slate-200/80 bg-gradient-to-br from-slate-100 to-slate-50 text-slate-900">
                        <span className="text-xl font-semibold tabular-nums">{secondsLeft}</span>
                    </div>

                    <h1 className="relative z-10 text-2xl font-semibold tracking-tight text-slate-900">You&apos;re all set</h1>
                    <p className="relative z-10 mt-2 text-sm leading-relaxed text-slate-600">
                        Thanks for subscribing. We&apos;ll take you back automatically when your workspace is ready.
                    </p>
                    <p className="relative z-10 mt-3 text-sm font-medium text-slate-700">
                        Redirecting in <span className="tabular-nums">{secondsLeft}s</span>
                    </p>

                    {checkoutId ? (
                        <p className="relative z-10 mt-2 break-all font-mono text-xs text-slate-500">
                            Checkout ID: {checkoutId}
                        </p>
                    ) : null}

                    <div className="relative z-10 mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <Link
                            href={primaryHref}
                            className={cn(
                                buttonVariants({ variant: 'blackCta' }),
                                'inline-flex h-11 min-w-[10rem] rounded-lg px-5 text-sm font-semibold'
                            )}
                        >
                            {primaryLabel}
                        </Link>
                        {primaryHref !== '/d' ? (
                            <Link
                                href="/d"
                                className={cn(
                                    buttonVariants({ variant: 'blackCta' }),
                                    'inline-flex h-11 min-w-[10rem] rounded-lg px-5 text-sm font-semibold'
                                )}
                            >
                                All workspaces
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
