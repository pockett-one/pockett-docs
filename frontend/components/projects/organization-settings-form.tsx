'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateOrganization, deleteOrganization } from '@/lib/actions/organizations'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { FileText, AlertTriangle, ImageIcon, Palette } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface OrganizationSettingsFormProps {
    orgSlug: string
    initialName: string
    onSaved?: () => void
}

export function OrganizationSettingsForm({
    orgSlug,
    initialName,
    onSaved,
}: OrganizationSettingsFormProps) {
    const router = useRouter()
    const { addToast } = useToast()
    const [name, setName] = useState(initialName)
    const [logoUrl, setLogoUrl] = useState('')
    const [subtext, setSubtext] = useState('')
    const [themeColor, setThemeColor] = useState('#6366f1')
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [brandingLoaded, setBrandingLoaded] = useState(false)

    useEffect(() => {
        setName(initialName)
    }, [initialName])

    useEffect(() => {
        let cancelled = false
        const loadBranding = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.access_token) return
                const res = await fetch(`/api/organization?slug=${encodeURIComponent(orgSlug)}`, {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                })
                if (!res.ok || cancelled) return
                const data = await res.json()
                const org = data.organization ?? data
                const settings = (org?.settings as Record<string, unknown>) ?? {}
                const b = (settings.branding as Record<string, string | undefined>) ?? {}
                if (!cancelled) {
                    setLogoUrl(b.logoUrl ?? '')
                    setSubtext(b.subtext ?? '')
                    setThemeColor(b.themeColor ?? b.brandColor ?? '#6366f1')
                    setBrandingLoaded(true)
                }
            } catch {
                setBrandingLoaded(true)
            }
        }
        loadBranding()
        return () => { cancelled = true }
    }, [orgSlug])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateOrganization(orgSlug, {
                name,
                branding: { logoUrl: logoUrl || null, subtext: subtext || null, themeColor: themeColor || null },
            })
            addToast({ type: 'success', title: 'Saved', message: 'Organization details updated.' })
            onSaved?.()
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Update failed',
                message: e instanceof Error ? e.message : 'Could not update organization.',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (
            !confirm(
                'Permanently delete this organization? All clients, projects, and members will be removed. This cannot be undone.'
            )
        )
            return
        setDeleting(true)
        try {
            await deleteOrganization(orgSlug)
            addToast({ type: 'success', title: 'Organization deleted', message: 'Organization has been removed.' })
            onSaved?.()
            router.push('/d')
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Delete failed',
                message: e instanceof Error ? e.message : 'Could not delete organization.',
            })
        } finally {
            setDeleting(false)
        }
    }

    const buttonClass = 'min-w-[11rem] sm:w-[11rem]'

    return (
        <div className="space-y-0">
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Organization settings</h2>
                <p className="text-sm text-gray-500 mt-1">Edit details or remove the organization.</p>
            </div>

            <section className="rounded-lg border border-gray-200 bg-white p-6 mb-12">
                <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-500" aria-hidden />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Details</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Name and branding shown in the organization workspace. Logo and theme replace the default Pockett branding in the top bar when set.</p>
                <div className="space-y-4 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="org-name" className="text-gray-700 font-medium">1.1 Organization name</Label>
                        <Input
                            id="org-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Organization name"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-subtext" className="text-gray-700 font-medium">1.2 Subtext</Label>
                        <Input
                            id="org-subtext"
                            value={subtext}
                            onChange={(e) => setSubtext(e.target.value)}
                            placeholder="Optional tagline or subtext"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-logo" className="text-gray-700 font-medium flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Logo
                        </Label>
                        <Input
                            id="org-logo"
                            type="url"
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://… (PNG, SVG, JPEG, WebP)"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                        <p className="text-xs text-gray-500">Image URL for logo (PNG, SVG, JPEG, or WebP). Used in the top-left when set.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-theme" className="text-gray-700 font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            1.3 Theme color
                        </Label>
                        <div className="flex items-center gap-3">
                            <input
                                id="org-theme"
                                type="color"
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                className="h-10 w-14 rounded border border-gray-200 cursor-pointer bg-white"
                            />
                            <Input
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                placeholder="#6366f1"
                                className="max-w-[8rem] font-mono text-sm bg-white border-gray-200 text-gray-900 focus-visible:ring-gray-400"
                            />
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving || !brandingLoaded}
                        className={`${buttonClass} bg-gray-900 text-white hover:bg-black`}
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </section>

            <div className="py-4">
                <section className="rounded-lg border border-red-200 bg-red-50/50 p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden />
                        <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide">Danger zone</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                        Permanently delete this organization. All clients, projects, and members will be removed. This cannot be undone.
                    </p>
                    <Button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`${buttonClass} bg-red-800 text-white hover:bg-red-900 border-0`}
                    >
                        {deleting ? 'Deleting...' : 'Delete organization'}
                    </Button>
                </section>
            </div>
        </div>
    )
}
