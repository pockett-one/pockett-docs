'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateOrganization, deleteOrganization } from '@/lib/actions/organizations'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { FileText, AlertTriangle, ImageIcon, Palette, Trash2, ImagePlus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { supabase } from '@/lib/supabase'

const MAX_LOGO_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/jpg']

export interface OrganizationSettingsFormProps {
    orgSlug: string
    orgId?: string | null
    initialName: string
    onSaved?: () => void
}

export function OrganizationSettingsForm({
    orgSlug,
    orgId: orgIdProp,
    initialName,
    onSaved,
}: OrganizationSettingsFormProps) {
    const router = useRouter()
    const { addToast } = useToast()
    const [orgIdState, setOrgIdState] = useState<string | null>(null)
    const orgId = orgIdProp ?? orgIdState
    const [name, setName] = useState(initialName)
    const [logoUrl, setLogoUrl] = useState('')
    const [subtext, setSubtext] = useState('')
    const [themeColor, setThemeColor] = useState('#6366f1')
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null)
    const [logoScale, setLogoScale] = useState(1)
    const [logoX, setLogoX] = useState(0)
    const [logoY, setLogoY] = useState(0)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [brandingLoaded, setBrandingLoaded] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startLogoX: 0, startLogoY: 0 })
    const previewSize = 160

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
                if (!cancelled && org?.id) setOrgIdState(org.id)
                const settings = (org?.settings as Record<string, unknown>) ?? {}
                const b = (settings.branding as Record<string, string | undefined>) ?? {}
                if (!cancelled) {
                    setLogoUrl((org?.logoUrl as string) ?? b.logoUrl ?? '')
                    setSubtext((org?.brandingSubtext as string) ?? b.subtext ?? '')
                    setThemeColor((org?.themeColorHex as string) ?? b.themeColor ?? b.brandColor ?? '#6366f1')
                }
            } catch {
                // ignore
            } finally {
                if (!cancelled) setBrandingLoaded(true)
            }
        }
        loadBranding()
        return () => { cancelled = true }
    }, [orgSlug])

    useEffect(() => {
        if (!logoFile) return
        const url = URL.createObjectURL(logoFile)
        setLogoPreviewUrl(url)
        return () => URL.revokeObjectURL(url)
    }, [logoFile])

    const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) {
            setLogoFile(null)
            return
        }
        const type = file.type?.toLowerCase()
        if (!ALLOWED_LOGO_TYPES.includes(type)) {
            addToast({ type: 'error', title: 'Invalid file', message: 'Use JPG, PNG, or SVG.' })
            return
        }
        if (file.size > MAX_LOGO_SIZE) {
            addToast({ type: 'error', title: 'File too large', message: 'Logo must be under 5 MB.' })
            return
        }
        setLogoFile(file)
        setLogoScale(1)
        setLogoX(0)
        setLogoY(0)
    }

    const hasLogoAdjustment = logoScale !== 1 || logoX !== 0 || logoY !== 0
    const isRasterLogo = logoFile?.type === 'image/png' || logoFile?.type === 'image/jpeg' || logoFile?.type === 'image/jpg'

    const onPreviewPointerDown = (e: React.PointerEvent) => {
        if (!(logoPreviewUrl || logoUrl) || !logoFile) return
        e.preventDefault()
        dragRef.current = { isDragging: true, startX: e.clientX, startY: e.clientY, startLogoX: logoX, startLogoY: logoY }
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
    const onPreviewPointerMove = (e: React.PointerEvent) => {
        if (!dragRef.current.isDragging) return
        setLogoX(dragRef.current.startLogoX + (e.clientX - dragRef.current.startX))
        setLogoY(dragRef.current.startLogoY + (e.clientY - dragRef.current.startY))
    }
    const onPreviewPointerUp = (e: React.PointerEvent) => {
        if (dragRef.current.isDragging) (e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
        dragRef.current.isDragging = false
    }

    /** Export current logo view to a square PNG blob (for raster only). */
    const exportLogoToSquareBlob = (): Promise<Blob | null> => {
        if (!logoPreviewUrl || !isRasterLogo) return Promise.resolve(null)
        return new Promise((resolve) => {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
                const size = 400
                const canvas = document.createElement('canvas')
                canvas.width = size
                canvas.height = size
                const ctx = canvas.getContext('2d')
                if (!ctx) { resolve(null); return }
                const scaleToFit = Math.min(size / img.naturalWidth, size / img.naturalHeight)
                const w = img.naturalWidth * scaleToFit
                const h = img.naturalHeight * scaleToFit
                const scale = size / previewSize
                ctx.save()
                ctx.translate(size / 2 + logoX * scale, size / 2 + logoY * scale)
                ctx.scale(logoScale, logoScale)
                ctx.translate(-size / 2, -size / 2)
                ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
                ctx.restore()
                canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95)
            }
            img.onerror = () => resolve(null)
            img.src = logoPreviewUrl
        })
    }

    const handleSave = async () => {
        if (!name.trim()) {
            addToast({ type: 'error', title: 'Required', message: 'Organization name is required.' })
            return
        }
        setSaving(true)
        try {
            let resolvedLogoUrl = logoUrl
            if (logoFile && orgId) {
                const { data: { session } } = await supabase.auth.getSession()
                if (!session?.access_token) throw new Error('Not authenticated')
                const formData = new FormData()
                const fileToUpload =
                    isRasterLogo && hasLogoAdjustment
                        ? await exportLogoToSquareBlob().then((blob) => (blob ? new File([blob], 'logo.png', { type: 'image/png' }) : logoFile))
                        : logoFile
                if (!fileToUpload) throw new Error('No file to upload')
                formData.set('file', fileToUpload)
                const uploadRes = await fetch(`/api/organizations/${orgId}/logo`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${session.access_token}` },
                    body: formData,
                })
                if (!uploadRes.ok) {
                    const err = await uploadRes.json().catch(() => ({}))
                    throw new Error((err as { error?: string }).error ?? 'Logo upload failed')
                }
                const { logoUrl: uploadedUrl } = await uploadRes.json()
                resolvedLogoUrl = uploadedUrl ?? resolvedLogoUrl
                setLogoUrl(resolvedLogoUrl)
                setLogoFile(null)
                setLogoScale(1)
                setLogoX(0)
                setLogoY(0)
            }
            await updateOrganization(orgSlug, {
                name,
                branding: {
                    logoUrl: resolvedLogoUrl || null,
                    subtext: subtext || null,
                    themeColor: themeColor || null,
                },
            })
            addToast({ type: 'success', title: 'Saved', message: 'Organization details updated.' })
            onSaved?.()
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('organization-branding-updated'))
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

    const handleRemoveLogo = async () => {
        if (!orgId) return
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session?.access_token) throw new Error('Not authenticated')
            const res = await fetch(`/api/organizations/${orgId}/logo`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${session.access_token}` },
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error((err as { error?: string }).error ?? 'Failed to remove logo')
            }
            setLogoUrl('')
            setLogoFile(null)
            setLogoPreviewUrl(null)
            setLogoScale(1)
            setLogoX(0)
            setLogoY(0)
            addToast({ type: 'success', title: 'Logo removed', message: 'Organization logo has been removed.' })
            onSaved?.()
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Remove logo failed',
                message: e instanceof Error ? e.message : 'Could not remove logo.',
            })
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
                <p className="text-sm text-gray-500 mb-4">Only organization name is required. Logo, tagline, and theme are optional and shown in the top bar when set.</p>
                <div className="space-y-4 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="org-name" className="text-gray-700 font-medium">Organization name <span className="text-red-500">*</span></Label>
                        <Input
                            id="org-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Organization name"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-subtext" className="text-gray-700 font-medium">Brand Tagline <span className="text-gray-400 font-normal">(optional)</span></Label>
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
                            Brand Logo <span className="text-gray-400 font-normal">(optional)</span>
                        </Label>
                        <p className="text-xs text-gray-500">JPG, PNG or SVG. Recommended 200×200 px, max 5 MB. Shown in the top bar when set.</p>
                        <input
                            ref={fileInputRef}
                            id="org-logo"
                            type="file"
                            accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
                            onChange={handleLogoFileChange}
                            className="sr-only"
                            aria-hidden
                        />
                        <TooltipProvider delayDuration={300}>
                            <div className="flex flex-col gap-2 w-full">
                                {!(logoPreviewUrl || logoUrl) ? (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-1"
                                        style={{ width: previewSize, height: previewSize }}
                                    >
                                        <ImagePlus className="h-10 w-10" />
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <div
                                            className={`relative flex shrink-0 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden select-none group ${logoFile ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                            style={{ width: previewSize, height: previewSize }}
                                            title={logoFile ? 'Drag to move, use slider to zoom. This view is saved as the logo.' : 'Shown in portal header (top left)'}
                                            {...(logoFile
                                                ? {
                                                    onPointerDown: onPreviewPointerDown,
                                                    onPointerMove: onPreviewPointerMove,
                                                    onPointerUp: onPreviewPointerUp,
                                                    onPointerLeave: onPreviewPointerUp,
                                                }
                                                : {})}
                                        >
                                            <div
                                                className="absolute inset-0 flex items-center justify-center"
                                                style={{
                                                    transform: `translate(${logoX}px, ${logoY}px) scale(${logoScale})`,
                                                }}
                                            >
                                                <img
                                                    src={logoPreviewUrl || logoUrl}
                                                    alt="Logo preview"
                                                    className="max-w-full max-h-full object-contain pointer-events-none"
                                                    style={{ width: previewSize, height: previewSize }}
                                                    draggable={false}
                                                />
                                            </div>
                                            <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            type="button"
                                                            onClick={() => fileInputRef.current?.click()}
                                                            className="p-2 rounded-lg bg-white text-gray-700 hover:bg-gray-100 shadow-sm"
                                                            aria-label="Replace logo"
                                                        >
                                                            <ImagePlus className="h-5 w-5" />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>Replace logo</TooltipContent>
                                                </Tooltip>
                                                {orgId && (
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <button
                                                                type="button"
                                                                onClick={handleRemoveLogo}
                                                                className="p-2 rounded-lg bg-white text-red-600 hover:bg-red-50 shadow-sm"
                                                                aria-label="Remove logo"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>Remove logo</TooltipContent>
                                                    </Tooltip>
                                                )}
                                            </div>
                                        </div>
                                        {logoFile && (
                                            <div className="flex flex-col gap-1" style={{ width: previewSize }}>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500 whitespace-nowrap">Zoom</span>
                                                    <input
                                                        type="range"
                                                        min={0.5}
                                                        max={3}
                                                        step={0.1}
                                                        value={logoScale}
                                                        onChange={(e) => setLogoScale(Number(e.target.value))}
                                                        className="flex-1 h-2 rounded-lg appearance-none bg-gray-200 accent-gray-700"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => { setLogoScale(1); setLogoX(0); setLogoY(0) }}
                                                        className="text-xs text-gray-600 hover:text-gray-900 underline"
                                                    >
                                                        Reset
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-500">Drag logo to position. Save to apply.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </TooltipProvider>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="org-theme" className="text-gray-700 font-medium flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Brand Theme color
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
                        type="button"
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
