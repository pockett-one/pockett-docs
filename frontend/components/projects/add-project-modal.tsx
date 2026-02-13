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
import { createProject } from '@/lib/actions/project'

interface AddProjectModalProps {
    orgSlug: string
    clientSlug: string
    trigger?: React.ReactNode
}

export function AddProjectModal({ orgSlug, clientSlug, trigger }: AddProjectModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            await createProject(orgSlug, clientSlug, {
                name,
                description: description || undefined
            })
            setOpen(false)
            setName('')
            setDescription('')
            setError(null)
            router.refresh()
        } catch (error: any) {
            console.error(error)
            setError(error.message || "Failed to create project")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                        <Plus className="h-4 w-4" />
                        New Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] border-slate-200">
                <DialogHeader>
                    <DialogTitle className="text-slate-900">New Project</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        Create a new project workspace for this client.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    {error && (
                        <div className="bg-slate-50 border border-slate-200 text-slate-700 text-sm px-3 py-2 rounded-md">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-900">Project Name <span className="text-slate-500">*</span></Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Q1 Audit"
                            required
                            className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-slate-900">Description (Optional)</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief project description"
                            className="border-slate-200 text-slate-900 placeholder:text-slate-400"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" className="border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-slate-900 hover:bg-slate-800 text-white" disabled={isLoading || !name.trim()}>
                            {isLoading && <LoadingSpinner size="sm" />}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
