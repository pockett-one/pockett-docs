'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { SquarePlus } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { SandboxInfoBanner } from "@/components/ui/sandbox-info-banner"
import { createProject, type LwCrmEngagementStatus } from '@/lib/actions/project'
import { useOrgSandbox } from '@/lib/use-org-sandbox'

interface AddProjectModalProps {
    orgSlug: string
    clientSlug: string
    /** Server-known flag so sandbox is enforced before client fetch completes */
    firmSandboxOnly?: boolean
    trigger?: React.ReactNode
}

export function AddProjectModal({ orgSlug, clientSlug, firmSandboxOnly = false, trigger }: AddProjectModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [status, setStatus] = useState<LwCrmEngagementStatus>('ACTIVE')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [contractType, setContractType] = useState('')
    const [rateOrValue, setRateOrValue] = useState('')
    const [tagsInput, setTagsInput] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [capBlocked, setCapBlocked] = useState(false)
    const [capMessage, setCapMessage] = useState<string | null>(null)
    const router = useRouter()
    useEffect(() => {
        let mounted = true
        const run = async () => {
            try {
                const response = await fetch(`/api/billing/engagement-gate?firmSlug=${encodeURIComponent(orgSlug)}`)
                if (!response.ok) return
                const payload = (await response.json()) as { allowed?: boolean; cap?: number | null; count?: number }
                if (!mounted) return
                const blocked = payload.allowed === false
                setCapBlocked(blocked)
                if (blocked) {
                    const cap = typeof payload.cap === 'number' ? payload.cap : null
                    const count = typeof payload.count === 'number' ? payload.count : null
                    if (cap != null && count != null) {
                        setCapMessage(`Engagement limit reached (${count}/${cap}) for this firm group. Upgrade to add more.`)
                    } else {
                        setCapMessage('Engagement limit reached for this firm group. Upgrade to add more.')
                    }
                } else {
                    setCapMessage(null)
                }
            } catch {
                // best effort: keep form usable if gate lookup fails
            }
        }
        run()
        return () => {
            mounted = false
        }
    }, [orgSlug])

    const orgSandbox = useOrgSandbox()
    const isSandboxFirm = Boolean(firmSandboxOnly || orgSandbox?.sandboxOnly)

    const wrapTrigger = (node: React.ReactNode): React.ReactNode => {
        if (!React.isValidElement(node)) return node
        const el = node as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
        return React.cloneElement(el, {
            onClick: (e: React.MouseEvent) => {
                el.props.onClick?.(e)
                if (e.defaultPrevented) return
                setOpen(true)
            },
        })
    }

    const parseTags = (raw: string) =>
        raw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (isSandboxFirm || capBlocked) {
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            await createProject(orgSlug, clientSlug, {
                name,
                description: description || undefined,
                status,
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                endDate: endDate ? new Date(endDate).toISOString() : undefined,
                contractType: contractType.trim() || undefined,
                rateOrValue: rateOrValue.trim() || undefined,
                tags: parseTags(tagsInput),
            })
            setOpen(false)
            setName('')
            setDescription('')
            setStatus('ACTIVE')
            setStartDate('')
            setEndDate('')
            setContractType('')
            setRateOrValue('')
            setTagsInput('')
            setError(null)
            // Keep user on engagement cards/list tab after creation.
            router.push(`/d/f/${orgSlug}/c/${clientSlug}?tab=projects`, { scroll: false })
            router.refresh()
        } catch (error: any) {
            console.error(error)
            setError(error.message || "Failed to create engagement")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            {wrapTrigger(
                trigger || (
                    <Button
                        variant="blackCta"
                        type="button"
                        size="sm"
                        className="gap-2"
                        disabled={capBlocked}
                    >
                        <SquarePlus className="h-4 w-4" />
                        New Engagement
                    </Button>
                ),
            )}
            <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[480px] border-slate-200 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-slate-900">New Engagement</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Create a new engagement for this client.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {isSandboxFirm && <SandboxInfoBanner />}
                    {error && (
                        <div className="bg-slate-50 border border-slate-200 text-slate-700 text-sm px-3 py-2 rounded-md">
                            {error}
                        </div>
                    )}
                    {capBlocked && capMessage && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2 rounded-md">
                            {capMessage}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>
                            Engagement Name <span className="text-slate-500">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Q1 Audit"
                            required={!isSandboxFirm}
                            disabled={isSandboxFirm || capBlocked || isLoading}
                            className="border-slate-200 text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="eng-status" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>Status</Label>
                        <select
                            id="eng-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as LwCrmEngagementStatus)}
                            disabled={isSandboxFirm || capBlocked || isLoading}
                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="PLANNED">Planned</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Paused</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="start" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>Start (optional)</Label>
                            <Input
                                id="start"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                disabled={isSandboxFirm || capBlocked || isLoading}
                                className="border-slate-200 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>End (optional)</Label>
                            <Input
                                id="end"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                disabled={isSandboxFirm || capBlocked || isLoading}
                                className="border-slate-200 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>
                            Description (optional)
                        </Label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief engagement description"
                            rows={2}
                            disabled={isSandboxFirm || capBlocked || isLoading}
                            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="ctype" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>Contract type</Label>
                            <Input
                                id="ctype"
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                                placeholder="Optional"
                                disabled={isSandboxFirm || capBlocked || isLoading}
                                className="border-slate-200 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rate" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>Rate / value</Label>
                            <Input
                                id="rate"
                                value={rateOrValue}
                                onChange={(e) => setRateOrValue(e.target.value)}
                                placeholder="Optional"
                                disabled={isSandboxFirm || capBlocked || isLoading}
                                className="border-slate-200 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tags" className={isSandboxFirm ? 'text-slate-500' : 'text-slate-900'}>Tags</Label>
                        <Input
                            id="tags"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="Comma-separated"
                            disabled={isSandboxFirm || capBlocked || isLoading}
                            className="border-slate-200 text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button
                            variant="blackCta"
                            type="submit"
                            disabled={isSandboxFirm || capBlocked || isLoading || !name.trim()}
                        >
                            {isLoading && <LoadingSpinner size="sm" />}
                            Create Engagement
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
        </>
    )
}
