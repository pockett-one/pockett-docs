'use client'

import React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProjectSettingsForm } from './project-settings-form'

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
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Project settings</DialogTitle>
                    <DialogDescription>Edit properties, close, or delete this project.</DialogDescription>
                </DialogHeader>
                <ProjectSettingsForm
                    projectId={projectId}
                    orgSlug={orgSlug}
                    clientSlug={clientSlug}
                    initialName={initialName}
                    initialDescription={initialDescription}
                    isClosed={isClosed}
                    onSaved={() => {
                        onSaved?.()
                        onOpenChange(false)
                    }}
                />
                <DialogFooter className="sr-only">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
