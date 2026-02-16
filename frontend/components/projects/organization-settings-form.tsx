'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateOrganization, deleteOrganization } from '@/lib/actions/organizations'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { FileText, AlertTriangle } from 'lucide-react'

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
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        setName(initialName)
    }, [initialName])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateOrganization(orgSlug, { name })
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
                <p className="text-sm text-gray-500 mb-4">Name shown in the organization workspace.</p>
                <div className="space-y-4 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="org-name" className="text-gray-700 font-medium">Name</Label>
                        <Input
                            id="org-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Organization name"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
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
