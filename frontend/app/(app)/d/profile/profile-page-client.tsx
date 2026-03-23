'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ProfileBubblePopupContent } from '@/components/ui/profile-bubble-popup'
import { profileBillingCopy } from '@/lib/billing/profile-billing-copy'
import { cn } from '@/lib/utils'
import { ProfileBillingSection, type ProfileBillingSerializable } from './profile-billing-section'

export function ProfilePageClient({
    displayName,
    email,
    avatarUrl,
    billing,
}: {
    displayName: string
    email: string
    avatarUrl: string | null
    billing: ProfileBillingSerializable | null
}) {
    return (
        <div className="relative mx-auto max-w-3xl space-y-10 pb-10 px-4 sm:px-5 md:px-6">
            <div
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl opacity-80"
                aria-hidden
            >
                <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-violet-200/30 blur-3xl" />
                <div className="absolute -right-12 top-40 h-48 w-48 rounded-full bg-indigo-200/25 blur-3xl" />
            </div>

            <Link
                href="/d"
                className="group inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-violet-900"
            >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 transition duration-300 group-hover:-translate-x-0.5 group-hover:shadow-md group-hover:ring-violet-200/70">
                    <ArrowLeft className="h-4 w-4" aria-hidden />
                </span>
                Back to workspace
            </Link>

            <header className="space-y-1.5">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    {profileBillingCopy.pageTitle}
                </h1>
                <p className="text-sm text-slate-600 transition-colors duration-300">
                    {profileBillingCopy.pageSubtitle}
                </p>
            </header>

            <div
                className={cn(
                    'group/card relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6',
                    'shadow-[0_2px_8px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(15,23,42,0.12)]',
                    'ring-1 ring-slate-900/[0.04]',
                    'transition-all duration-300 ease-out',
                    'hover:-translate-y-0.5 hover:border-slate-200',
                    'hover:shadow-[0_8px_24px_-8px_rgba(109,40,217,0.12),0_20px_48px_-16px_rgba(15,23,42,0.14)]',
                    'hover:ring-violet-200/30'
                )}
            >
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-300/40 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100"
                    aria-hidden
                />
                <ProfileBubblePopupContent name={displayName} email={email} avatarUrl={avatarUrl} />
            </div>

            {billing ? (
                <ProfileBillingSection billing={billing} />
            ) : (
                <p className="text-sm text-slate-600">{profileBillingCopy.noBillingAnchor}</p>
            )}
        </div>
    )
}
