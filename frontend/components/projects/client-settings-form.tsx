'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateClient, deleteClient } from '@/lib/actions/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/toast'
import { FileText, AlertTriangle } from 'lucide-react'

export interface ClientSettingsFormProps {
    orgSlug: string
    clientSlug: string
    initialName: string
    initialIndustry?: string
    initialSector?: string
    onSaved?: () => void
}

export function ClientSettingsForm({
    orgSlug,
    clientSlug,
    initialName,
    initialIndustry = '',
    initialSector = '',
    onSaved,
}: ClientSettingsFormProps) {
    const router = useRouter()
    const { addToast } = useToast()
    const [name, setName] = useState(initialName)
    const [industry, setIndustry] = useState(initialIndustry)
    const [sector, setSector] = useState(initialSector)
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        setName(initialName)
        setIndustry(initialIndustry ?? '')
        setSector(initialSector ?? '')
    }, [initialName, initialIndustry, initialSector])

    const handleSave = async () => {
        setSaving(true)
        try {
            await updateClient(orgSlug, clientSlug, {
                name,
                industry: industry || undefined,
                sector: sector || undefined,
            })
            addToast({ type: 'success', title: 'Saved', message: 'Client details updated.' })
            onSaved?.()
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Update failed',
                message: e instanceof Error ? e.message : 'Could not update client.',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (
            !confirm(
                'Permanently delete this client? All projects and members will be removed. This cannot be undone.'
            )
        )
            return
        setDeleting(true)
        try {
            await deleteClient(orgSlug, clientSlug)
            addToast({ type: 'success', title: 'Client deleted', message: 'Client has been removed.' })
            onSaved?.()
            router.push(`/d/o/${orgSlug}`)
        } catch (e: unknown) {
            addToast({
                type: 'error',
                title: 'Delete failed',
                message: e instanceof Error ? e.message : 'Could not delete client.',
            })
        } finally {
            setDeleting(false)
        }
    }

    const buttonClass = 'min-w-[11rem] sm:w-[11rem]'

    return (
        <div className="space-y-0">
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Client settings</h2>
                <p className="text-sm text-gray-500 mt-1">Edit details or remove the client.</p>
            </div>

            <section className="rounded-lg border border-gray-200 bg-white p-6 mb-12">
                <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-gray-500" aria-hidden />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Details</h3>
                </div>
                <p className="text-sm text-gray-500 mb-4">Name and optional business details.</p>
                <div className="space-y-4 w-full">
                    <div className="space-y-2">
                        <Label htmlFor="client-name" className="text-gray-700 font-medium">Name</Label>
                        <Input
                            id="client-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Client name"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client-industry" className="text-gray-700 font-medium">Industry (optional)</Label>
                        <Input
                            id="client-industry"
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            placeholder="e.g. Technology"
                            className="bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus-visible:ring-gray-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client-sector" className="text-gray-700 font-medium">Sector (optional)</Label>
                        <Input
                            id="client-sector"
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            placeholder="e.g. B2B"
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
                        Permanently delete this client. All projects and members will be removed. This cannot be undone.
                    </p>
                    <Button
                        onClick={handleDelete}
                        disabled={deleting}
                        className={`${buttonClass} bg-red-800 text-white hover:bg-red-900 border-0`}
                    >
                        {deleting ? 'Deleting...' : 'Delete client'}
                    </Button>
                </section>
            </div>
        </div>
    )
}
