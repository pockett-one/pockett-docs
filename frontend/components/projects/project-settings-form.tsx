'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateProject, closeProject, reopenProject, deleteProject } from '@/lib/actions/project'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { FileText, Lock, AlertTriangle } from 'lucide-react'

export interface ProjectSettingsFormProps {
    projectId: string
    orgSlug: string
    clientSlug: string
    initialName: string
    initialDescription?: string
    isClosed: boolean
    onSaved?: () => void
}

export function ProjectSettingsForm({
    projectId,
    orgSlug,
    clientSlug,
    initialName,
    initialDescription = '',
    isClosed,
    onSaved,
}: ProjectSettingsFormProps) {
    const router = useRouter()
    const { addToast } = useToast()
    const [name, setName] = useState(initialName)
    const [description, setDescription] = useState(initialDescription)
    const [saving, setSaving] = useState(false)
    const [closing, setClosing] = useState(false)
    const [reopening, setReopening] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        setName(initialName)
        setDescription(initialDescription ?? '')
    }, [initialName, initialDescription])

    const handleSaveProperties = async () => {
        setSaving(true)
        try {
            await updateProject(projectId, { name, description }, orgSlug, clientSlug)
            addToast({ type: 'success', title: 'Saved', message: 'Project properties updated.' })
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

    const handleCloseProject = async () => {
        if (!confirm('Close this project? It will become view-only for current members.')) return
        setClosing(true)
        try {
            await closeProject(projectId, orgSlug, clientSlug)
            addToast({ type: 'success', title: 'Project closed', message: 'Project is now view-only.' })
            onSaved?.()
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Failed',
                message: e instanceof Error ? e.message : 'Could not close project.',
            })
        } finally {
            setClosing(false)
        }
    }

    const handleReopenProject = async () => {
        setReopening(true)
        try {
            await reopenProject(projectId, orgSlug, clientSlug)
            addToast({ type: 'success', title: 'Project reopened', message: 'Project is active again.' })
            onSaved?.()
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Failed',
                message: e instanceof Error ? e.message : 'Could not reopen project.',
            })
        } finally {
            setReopening(false)
        }
    }

    const handleDeleteProject = async () => {
        if (
            !confirm(
                'Permanently delete this project in Pockett? All members will be removed and Drive access revoked. The project folder will remain in Google Drive for the org admin to access directly. This cannot be undone.'
            )
        )
            return
        setDeleting(true)
        try {
            await deleteProject(projectId, orgSlug, clientSlug)
            addToast({ type: 'success', title: 'Project deleted', message: 'Project has been removed.' })
            onSaved?.()
            router.push(`/d/o/${orgSlug}/c/${clientSlug}`)
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
            {/* Page header */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Project settings</h2>
                <p className="text-sm text-gray-500 mt-1">Edit details, change project status, or remove the project.</p>
            </div>

            {/* Section: Details (Jira/Linear-style card) */}
            <section className="rounded-lg border border-gray-200 bg-white p-6 mb-12">
                <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-500" aria-hidden />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Details</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Name and description shown in the project workspace.</p>
                {isClosed && (
                    <p className="text-xs text-gray-500 mb-3 rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                        Reopen the project below to edit these fields.
                    </p>
                )}
                <div className="space-y-4 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="project-name" className="text-gray-700 font-medium">Name</Label>
                        <Input
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project name"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                            disabled={isClosed}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-description" className="text-gray-700 font-medium">Description</Label>
                        <textarea
                            id="project-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of this project"
                            rows={3}
                            className="flex w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isClosed}
                        />
                    </div>
                    <Button
                        onClick={handleSaveProperties}
                        disabled={saving || isClosed}
                        className={`${buttonClass} bg-gray-900 text-white hover:bg-black`}
                    >
                        {saving ? 'Saving...' : 'Save changes'}
                    </Button>
                </div>
            </section>

            {/* Section: Project status (Close / Reopen) — wrapper adds spacing before & after */}
            <div className="py-4">
                <section className="rounded-lg border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Lock className="h-4 w-4 text-gray-500" aria-hidden />
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Project status</h3>
                    </div>
                    {isClosed ? (
                        <>
                            <p className="text-sm text-gray-500 mb-4">Reopen the project to allow editing and new activity for current members.</p>
                            <Button
                                variant="outline"
                                onClick={handleReopenProject}
                                disabled={reopening}
                                className={`${buttonClass} border-amber-400 bg-amber-400 text-gray-900 hover:bg-amber-500 hover:border-amber-500`}
                            >
                                {reopening ? 'Reopening...' : 'Reopen project'}
                            </Button>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-500 mb-4">Close the project to make it view-only. Current members keep access but cannot edit.</p>
                            <Button
                                variant="outline"
                                onClick={handleCloseProject}
                                disabled={closing}
                                className={`${buttonClass} border-amber-400 bg-amber-400 text-gray-900 hover:bg-amber-500 hover:border-amber-500`}
                            >
                                {closing ? 'Closing...' : 'Close project'}
                            </Button>
                        </>
                    )}
                </section>
            </div>

            {/* Section: Danger zone (clearly separated) */}
            <section className="rounded-lg border border-red-200 bg-red-50/50 p-6">
                <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-700" aria-hidden />
                    <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wide">Danger zone</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Permanently remove this project from Pockett. All members are removed and Drive access is revoked. The project folder remains in Google Drive for the org admin.
                </p>
                <Button
                    onClick={handleDeleteProject}
                    disabled={deleting}
                    className={`${buttonClass} bg-red-800 text-white hover:bg-red-900 border-0`}
                >
                    {deleting ? 'Deleting...' : 'Delete project'}
                </Button>
            </section>
        </div>
    )
}
