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
            <div className="relative max-w-md w-full rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
                <div className="absolute inset-x-0 top-0 h-1 rounded-t-2xl bg-muted">
                    <div
                        className="h-1 rounded-t-2xl bg-primary transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-foreground">
                    <span className="text-xl font-semibold">{secondsLeft}</span>
                </div>

                <h1 className="text-2xl font-semibold tracking-tight text-foreground">You&apos;re all set</h1>
                <p className="mt-2 text-muted-foreground">
                    Thanks for subscribing. We&apos;ll take you back automatically when your workspace is ready.
                </p>
                <p className="mt-3 text-sm font-medium text-foreground/80">
                    Redirecting in <span className="tabular-nums">{secondsLeft}s</span>
                </p>

                {checkoutId ? (
                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">Checkout ID: {checkoutId}</p>
                ) : null}

                <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center items-center">
                    <Link href={primaryHref} className={cn(buttonVariants(), 'inline-flex')}>
                        {primaryLabel}
                    </Link>
                    {primaryHref !== '/d' ? (
                        <Link
                            href="/d"
                            className={cn(buttonVariants({ variant: 'outline' }), 'inline-flex border-border')}
                        >
                            All workspaces
                        </Link>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
