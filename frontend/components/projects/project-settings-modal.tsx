'use client'

import React, { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateProject, closeProject, reopenProject, deleteProject } from '@/lib/actions/project'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'

interface ProjectSettingsModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    orgSlug: string
    clientSlug: string
    initialName: string
    initialDescription?: string
    isClosed: boolean
    onSaved?: () => void
}

export function ProjectSettingsModal({
    open,
    onOpenChange,
    projectId,
    orgSlug,
    clientSlug,
    initialName,
    initialDescription = '',
    isClosed,
    onSaved,
}: ProjectSettingsModalProps) {
    const router = useRouter()
    const { addToast } = useToast()
    const [name, setName] = useState(initialName)
    const [description, setDescription] = useState(initialDescription)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (open) {
            setName(initialName)
            setDescription(initialDescription ?? '')
        }
    }, [open, initialName, initialDescription])
    const [closing, setClosing] = useState(false)
    const [reopening, setReopening] = useState(false)
    const [deleting, setDeleting] = useState(false)

    const handleSaveProperties = async () => {
        setSaving(true)
        try {
            await updateProject(projectId, { name, description }, orgSlug, clientSlug)
            addToast({ type: 'success', title: 'Saved', message: 'Project properties updated.' })
            onSaved?.()
            onOpenChange(false)
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
            onOpenChange(false)
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
            onOpenChange(false)
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
            onOpenChange(false)
            router.push(`/o/${orgSlug}/c/${clientSlug}`)
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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Project settings</DialogTitle>
                    <DialogDescription>Edit properties, close, or delete this project.</DialogDescription>
                </DialogHeader>

                {/* Project Properties */}
                <div className="space-y-4 py-2">
                    {isClosed && (
                        <p className="text-xs text-slate-500">Reopen the project to edit properties.</p>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Name</Label>
                        <Input
                            id="project-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Project name"
                            className="bg-white"
                            disabled={isClosed}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="project-description">Description</Label>
                        <textarea
                            id="project-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description"
                            rows={3}
                            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400 disabled:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                            disabled={isClosed}
                        />
                    </div>
                    <Button onClick={handleSaveProperties} disabled={saving || isClosed} className="w-full sm:w-auto">
                        {saving ? 'Saving...' : 'Save'}
                    </Button>
                </div>

                <div className="border-t border-slate-200 pt-4 space-y-3">
                    {/* Close / Reopen project */}
                    <div className="flex flex-col gap-2">
                        {isClosed ? (
                            <>
                                <p className="text-sm text-slate-600">
                                    Reopen project to allow editing again for current members.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleReopenProject}
                                    disabled={reopening}
                                    className="w-full sm:w-auto border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                                >
                                    {reopening ? 'Reopening...' : 'Reopen project'}
                                </Button>
                            </>
                        ) : (
                            <>
                                <p className="text-sm text-slate-600">
                                    Close project: project becomes view-only for current members.
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={handleCloseProject}
                                    disabled={closing}
                                    className="w-full sm:w-auto border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900"
                                >
                                    {closing ? 'Closing...' : 'Close project'}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Delete project */}
                    <div className="flex flex-col gap-2">
                        <p className="text-sm text-slate-600">
                            Delete project: remove all members and revoke Drive access in Pockett. The project folder stays in Google Drive for the org admin.
                        </p>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                            disabled={deleting}
                            className="w-full sm:w-auto"
                        >
                            {deleting ? 'Deleting...' : 'Delete project'}
                        </Button>
                    </div>
                </div>

                <DialogFooter className="sr-only">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
