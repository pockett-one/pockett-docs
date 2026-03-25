'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { ProfileBubblePopupContent } from '@/components/ui/profile-bubble-popup'
import { profileCopy } from '@/lib/profile-copy'
import { updateProfileNames } from '@/lib/actions/profile'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
export function ProfilePageClient({
    displayName,
    firstName: initialFirstName,
    lastName: initialLastName,
    email,
    avatarUrl,
}: {
    displayName: string
    firstName: string
    lastName: string
    email: string
    avatarUrl: string | null
}) {
    const router = useRouter()
    const { addToast } = useToast()
    const [firstName, setFirstName] = useState(initialFirstName)
    const [lastName, setLastName] = useState(initialLastName)
    const [saving, setSaving] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const isDirty =
        firstName !== initialFirstName || lastName !== initialLastName

    useEffect(() => {
        setFirstName(initialFirstName)
        setLastName(initialLastName)
    }, [initialFirstName, initialLastName])

    const handleSaveName = async () => {
        if (!isDirty) return
        setFormError(null)
        setSaving(true)
        const result = await updateProfileNames(firstName, lastName)
        if ('error' in result) {
            setFormError(result.error)
            setSaving(false)
            return
        }
        await supabase.auth.refreshSession()
        router.refresh()
        setSaving(false)
        addToast({ type: 'success', title: 'Saved', message: profileCopy.saveSuccess })
    }

    const accountForm = (
        <div className="space-y-3 border-t border-slate-200/90 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {profileCopy.accountSectionTitle}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                    <Label htmlFor="profile-first-name">{profileCopy.firstNameLabel}</Label>
                    <Input
                        id="profile-first-name"
                        name="firstName"
                        autoComplete="given-name"
                        maxLength={80}
                        value={firstName}
                        onChange={(e) => {
                            setFirstName(e.target.value)
                            setFormError(null)
                        }}
                        disabled={saving}
                        className="bg-white"
                    />
                </div>
                <div className="space-y-1.5">
                    <Label htmlFor="profile-last-name">{profileCopy.lastNameLabel}</Label>
                    <Input
                        id="profile-last-name"
                        name="lastName"
                        autoComplete="family-name"
                        maxLength={80}
                        value={lastName}
                        onChange={(e) => {
                            setLastName(e.target.value)
                            setFormError(null)
                        }}
                        disabled={saving}
                        className="bg-white"
                    />
                </div>
            </div>
            {formError && (
                <p className="text-xs text-red-600" role="alert">
                    {formError}
                </p>
            )}
            <Button
                type="button"
                variant="blackCta"
                size="sm"
                onClick={handleSaveName}
                disabled={saving || !isDirty}
            >
                {saving ? profileCopy.saving : profileCopy.saveCta}
            </Button>
        </div>
    )
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
                    {profileCopy.pageTitle}
                </h1>
                <p className="text-sm text-slate-600 transition-colors duration-300">
                    {profileCopy.pageSubtitle}
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
                <ProfileBubblePopupContent
                    name={displayName}
                    email={email}
                    avatarUrl={avatarUrl}
                    footer={accountForm}
                />
            </div>
        </div>
    )
}
