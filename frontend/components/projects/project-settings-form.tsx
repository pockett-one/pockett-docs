'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateProject, deleteProject } from '@/lib/actions/project'
import type { LwCrmEngagementStatus } from '@/lib/actions/project'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { FileText, AlertTriangle } from 'lucide-react'
import { SandboxInfoBanner } from '@/components/ui/sandbox-info-banner'
import { useOrgSandbox } from '@/lib/use-org-sandbox'

export interface ProjectSettingsFormProps {
    projectId: string
    orgSlug: string
    clientSlug: string
    initialName: string
    initialDescription?: string
    initialKickoffDate?: string | null
    initialDueDate?: string | null
    initialStatus?: LwCrmEngagementStatus
    initialContractType?: string
    initialRateOrValue?: string | null
    initialTags?: string[]
    firmSandboxOnly?: boolean
    /** Close modal or navigate away (e.g. back to Files). Always enabled even in Sandbox. */
    onCancel?: () => void
    onSaved?: () => void
}

export function ProjectSettingsForm({
    projectId,
    orgSlug,
    clientSlug,
    initialName,
    initialDescription = '',
    initialKickoffDate = null,
    initialDueDate = null,
    initialStatus = 'ACTIVE',
    initialContractType = '',
    initialRateOrValue = null,
    initialTags = [],
    firmSandboxOnly = false,
    onCancel,
    onSaved,
}: ProjectSettingsFormProps) {
    const router = useRouter()
    const { addToast } = useToast()
    const orgSandbox = useOrgSandbox()
    const isSandboxFirm = Boolean(firmSandboxOnly || orgSandbox?.sandboxOnly)
    const [name, setName] = useState(initialName)
    const [description, setDescription] = useState(initialDescription)
    const [kickoffDate, setKickoffDate] = useState<string>(initialKickoffDate ? initialKickoffDate.slice(0, 10) : '')
    const [dueDate, setDueDate] = useState<string>(initialDueDate ? initialDueDate.slice(0, 10) : '')
    const [status, setStatus] = useState<LwCrmEngagementStatus>(initialStatus)
    const [contractType, setContractType] = useState(initialContractType)
    const [rateOrValue, setRateOrValue] = useState(initialRateOrValue ?? '')
    const [tagsInput, setTagsInput] = useState(initialTags.join(', '))
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const isCompleted = status === 'COMPLETED'

    useEffect(() => {
        setName(initialName)
        setDescription(initialDescription ?? '')
        setKickoffDate(initialKickoffDate ? initialKickoffDate.slice(0, 10) : '')
        setDueDate(initialDueDate ? initialDueDate.slice(0, 10) : '')
        setStatus(initialStatus ?? 'ACTIVE')
        setContractType(initialContractType ?? '')
        setRateOrValue(initialRateOrValue ?? '')
        setTagsInput(initialTags.join(', '))
    }, [
        initialName,
        initialDescription,
        initialKickoffDate,
        initialDueDate,
        initialStatus,
        initialContractType,
        initialRateOrValue,
        initialTags,
    ])

    const parseTags = (raw: string) =>
        raw
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)

    const handleSaveProperties = async () => {
        if (isSandboxFirm) return
        setSaving(true)
        try {
            await updateProject(
                projectId,
                {
                    name,
                    description,
                    kickoffDate: kickoffDate ? new Date(kickoffDate).toISOString() : null,
                    dueDate: dueDate ? new Date(dueDate).toISOString() : null,
                    status,
                    contractType: contractType.trim() || null,
                    rateOrValue: rateOrValue.trim() === '' ? null : rateOrValue.trim(),
                    tags: parseTags(tagsInput),
                },
                orgSlug,
                clientSlug
            )
            addToast({ type: 'success', title: 'Saved', message: 'Engagement properties updated.' })
            onSaved?.()
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Update failed',
                message: e instanceof Error ? e.message : 'Could not update project.',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteProject = async () => {
        if (isSandboxFirm) return
        if (
            !confirm(
                'Permanently delete this engagement in Pockett? All members will be removed and Drive access revoked. The engagement folder will remain in Google Drive for the firm admin to access directly. This cannot be undone.'
            )
        )
            return
        setDeleting(true)
        try {
            await deleteProject(projectId, orgSlug, clientSlug)
            addToast({ type: 'success', title: 'Engagement deleted', message: 'Engagement has been removed.' })
            onSaved?.()
            router.push(`/d/f/${orgSlug}/c/${clientSlug}`)
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Delete failed',
                message: e instanceof Error ? e.message : 'Could not delete project.',
            })
        } finally {
            setDeleting(false)
        }
    }

    const buttonClass = 'min-w-[11rem] sm:w-[11rem]'

    return (
        <div className="space-y-0">
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Engagement settings</h2>
                <p className="text-sm text-gray-500 mt-1">Edit details, status, and commercial fields, or remove the engagement.</p>
            </div>

            {isSandboxFirm && (
                <div className="mb-6">
                    <SandboxInfoBanner />
                </div>
            )}

            <section className="rounded-lg border border-gray-200 bg-white p-6 mb-12">
                <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-500" aria-hidden />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Details</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Name, dates, and description shown in the engagement workspace.</p>
                {isCompleted && (
                    <p className="text-xs text-gray-500 mb-3 rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                        This engagement is completed. Change status below to edit other fields.
                    </p>
                )}
                <div className="space-y-4 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="engagement-status" className="text-gray-700 font-medium">Status</Label>
                        <select
                            id="engagement-status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as LwCrmEngagementStatus)}
                            disabled={isSandboxFirm}
                            className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="PLANNED">Planned</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Paused</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="project-kickoff" className="text-gray-700 font-medium">Start date (optional)</Label>
                            <Input
                                id="project-kickoff"
                                type="date"
                                value={kickoffDate}
                                onChange={(e) => setKickoffDate(e.target.value)}
                                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                                disabled={isCompleted || isSandboxFirm}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="project-due" className="text-gray-700 font-medium">End date (optional)</Label>
                            <Input
                                id="project-due"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                                disabled={isCompleted || isSandboxFirm}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-name" className="text-gray-700 font-medium">Name</Label>
                        <Input
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Engagement name"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                            disabled={isCompleted || isSandboxFirm}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-description" className="text-gray-700 font-medium">Description</Label>
                        <textarea
                            id="project-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this engagement"
                            rows={3}
                            className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isCompleted || isSandboxFirm}
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contract-type" className="text-gray-700 font-medium">Contract type (optional)</Label>
                            <Input
                                id="contract-type"
                                value={contractType}
                                onChange={(e) => setContractType(e.target.value)}
                                placeholder="e.g. Fixed fee, T&M"
                                disabled={isCompleted || isSandboxFirm}
                                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rate-value" className="text-gray-700 font-medium">Rate / value (optional)</Label>
                            <Input
                                id="rate-value"
                                value={rateOrValue}
                                onChange={(e) => setRateOrValue(e.target.value)}
                                placeholder="e.g. 15000 or 250/hr"
                                disabled={isCompleted || isSandboxFirm}
                                className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="engagement-tags" className="text-gray-700 font-medium">Tags</Label>
                        <Input
                            id="engagement-tags"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            placeholder="Comma-separated"
                            disabled={isCompleted || isSandboxFirm}
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {onCancel ? (
                            <Button type="button" variant="outline" className={buttonClass} onClick={onCancel}>
                                Cancel
                            </Button>
                        ) : null}
                        <Button
                            onClick={handleSaveProperties}
                            disabled={saving || isSandboxFirm}
                            className={`${buttonClass} bg-gray-900 text-white hover:bg-black`}
                        >
                            {saving ? 'Saving...' : 'Save changes'}
                        </Button>
                    </div>
                </div>
            </section>

            <section className="rounded-lg border border-red-200 bg-red-50/50 p-6">
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden />
                    <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide">Danger zone</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Permanently remove this engagement from Pockett. All members are removed and Drive access is revoked. The engagement folder remains in Google Drive for the firm admin.
                </p>
                <Button
                    onClick={handleDeleteProject}
                    disabled={isSandboxFirm || deleting}
                    className={`${buttonClass} bg-red-800 text-white hover:bg-red-900 border-0`}
                >
                    {deleting ? 'Deleting...' : 'Delete project'}
                </Button>
            </section>
        </div>
    )
}
