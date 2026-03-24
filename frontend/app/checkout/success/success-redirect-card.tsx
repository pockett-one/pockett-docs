'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
            <div className="relative max-w-md w-full rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-[0_12px_40px_-16px_rgba(15,23,42,0.25)]">
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-slate-100">
                    <div
                        className="h-1 rounded-t-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                    <span className="text-xl font-semibold">{secondsLeft}</span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">You&apos;re all set</h1>
                <p className="mt-2 text-slate-600">
                    Thanks for subscribing. We&apos;ll take you back automatically when your workspace is ready.
                </p>
                <p className="mt-3 text-sm font-medium text-slate-700">
                    Redirecting in <span className="tabular-nums">{secondsLeft}s</span>
                </p>

                {checkoutId ? (
                    <p className="mt-2 text-xs text-slate-400 font-mono break-all">Checkout ID: {checkoutId}</p>
                ) : null}

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Link href={primaryHref} className={cn(buttonVariants(), 'inline-flex')}>
                        {primaryLabel}
                    </Link>
                    {primaryHref !== '/d' ? (
                        <Link
                            href="/d"
                            className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex border-slate-200')}
                        >
                            All workspaces
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
