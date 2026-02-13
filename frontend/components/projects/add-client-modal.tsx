'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { createClient } from '@/lib/actions/client'
// import { toast } from "sonner"

interface AddClientModalProps {
    orgSlug: string
    trigger?: React.ReactNode
}

export function AddClientModal({ orgSlug, trigger }: AddClientModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState('')
    const [industry, setIndustry] = useState('')
    const [sector, setSector] = useState('')

    const [error, setError] = useState<string | null>(null)

    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const newClient = await createClient(orgSlug, {
                name,
                industry: industry || undefined,
                sector: sector || undefined
            })
            setOpen(false)
            setName('')
            setIndustry('')
            setSector('')
            setError(null)

            // Select the new client: update URL and refresh sidebar so dropdown shows it
            if (newClient?.slug) {
                router.push(`/d/o/${orgSlug}/c/${newClient.slug}`)
                window.dispatchEvent(new Event('pockett:refresh-clients'))
                router.refresh()
            }
        } catch (error: any) {
            console.error(error)
            setError(error.message || "Failed to create client")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white">
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-slate-900">Add Client Workspace</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Create a new workspace to organize projects for a client.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {error && (
                        <div className="bg-slate-50 border border-slate-200 text-slate-700 text-sm px-3 py-2 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-900">Client Name <span className="text-slate-500">*</span></Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Acme Corp"
                            required
                            className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="industry" className="text-slate-900">Industry</Label>
                            <Input
                                id="industry"
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                placeholder="e.g. Technology"
                                className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sector" className="text-slate-900">Sector</Label>
                            <Input
                                id="sector"
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                placeholder="e.g. SaaS"
                                className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={isLoading || !name.trim()}>
                            {isLoading && <LoadingSpinner size="sm" />}
                            Create Client
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
