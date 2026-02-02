'use client'

import React from 'react'
import { Copy } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { useToast } from '@/components/ui/toast'

export function getInitials(name: string): string {
    if (!name) return '?'
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
}

export function toTitleCase(s: string): string {
    if (!s) return ''
    return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
}

export interface ProfileBubblePopupUser {
    name: string
    email: string
    avatarUrl?: string | null
    personaName?: string
}

/** Square bubble: gray border, white padding inside. Size default (w-6 h-6) or lg (w-10 h-10). Shows initials with bg when no image. */
export function ProfileBubble({
    name,
    avatarUrl,
    size = 'default',
    className = '',
}: {
    name: string
    avatarUrl?: string | null
    size?: 'default' | 'lg'
    className?: string
}) {
    const [imageError, setImageError] = React.useState(false)
    const showImage = Boolean(avatarUrl) && !imageError
    const sizeClass = size === 'lg' ? 'w-10 h-10 text-xs' : 'w-6 h-6 text-[10px]'
    const bgClass = showImage ? 'bg-white' : 'bg-slate-100'
    return (
        <div
            className={`rounded-lg border border-slate-200 ${bgClass} ${sizeClass} flex items-center justify-center font-medium text-slate-700 shrink-0 shadow-sm p-0.5 ${className}`}
        >
            {showImage ? (
                <img
                    src={avatarUrl!}
                    alt=""
                    className="w-full h-full rounded-md object-cover object-center aspect-square"
                    onError={() => setImageError(true)}
                />
            ) : (
                getInitials(name)
            )}
        </div>
    )
}

/** Popup content: large image left, email / name / persona (optional) right with copy icons. Shows initials with bg when no image. */
export function ProfileBubblePopupContent({
    name,
    email,
    avatarUrl,
    personaName,
    footer,
}: ProfileBubblePopupUser & { footer?: React.ReactNode }) {
    const { addToast } = useToast()
    const [imageError, setImageError] = React.useState(false)
    const showImage = Boolean(avatarUrl) && !imageError
    const copyToClipboard = (e: React.MouseEvent, text: string, label: string) => {
        e.preventDefault()
        e.stopPropagation()
        navigator.clipboard.writeText(text).then(
            () => addToast({ type: 'success', title: 'Copied', message: `${label} copied.` }),
            () => addToast({ type: 'error', title: 'Copy failed', message: 'Could not copy.' })
        )
    }
    return (
        <div className="flex gap-3 p-3">
            <div className={`shrink-0 w-14 h-14 rounded-lg border border-slate-200 p-1 flex items-center justify-center ${showImage ? 'bg-white' : 'bg-slate-100'}`}>
                {showImage ? (
                    <img
                        src={avatarUrl!}
                        alt=""
                        className="w-full h-full rounded-md object-cover object-center"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <span className="text-base font-medium text-slate-600">{getInitials(name)}</span>
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[11px] text-slate-500 truncate" title={email}>
                        {email}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => copyToClipboard(e, email, 'Email')}
                        className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Copy email"
                    >
                        <Copy className="h-3 w-3" />
                    </button>
                </div>
                <div className="flex items-center justify-between gap-1.5">
                    <span className="text-sm font-semibold text-slate-900 truncate" style={{ textTransform: 'capitalize' }} title={name}>
                        {toTitleCase(name)}
                    </span>
                    <button
                        type="button"
                        onClick={(e) => copyToClipboard(e, name, 'Name')}
                        className="shrink-0 p-0.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Copy name"
                    >
                        <Copy className="h-3.5 w-3.5" />
                    </button>
                </div>
                {personaName && (
                    <p className="text-[11px] text-slate-500 truncate" style={{ textTransform: 'capitalize' }}>
                        {toTitleCase(personaName)}
                    </p>
                )}
                {footer}
            </div>
        </div>
    )
}

/** Bubble + hover tooltip with profile popup. Use for project cards. */
export function ProfileBubbleWithPopup({
    name,
    email,
    avatarUrl,
    personaName,
    size = 'default',
}: ProfileBubblePopupUser & { size?: 'default' | 'lg' }) {
    return (
        <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
                <button type="button" className="rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1">
                    <ProfileBubble name={name} avatarUrl={avatarUrl} size={size} />
                </button>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="z-[100] max-w-[280px] border border-slate-200 bg-white p-0 text-slate-900 shadow-lg overflow-hidden"
            >
                <ProfileBubblePopupContent name={name} email={email} avatarUrl={avatarUrl} personaName={personaName} />
            </TooltipContent>
        </Tooltip>
    )
}
