'use client'

import { useState } from 'react'
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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2, X, UserPlus, Shield, User } from "lucide-react"
import { createProject, InviteMemberData } from '@/lib/actions/project'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface AddProjectModalProps {
    orgSlug: string
    clientSlug: string
    trigger?: React.ReactNode
}

export function AddProjectModal({ orgSlug, clientSlug, trigger }: AddProjectModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    // Project Fields
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')

    // Invite State
    const [invites, setInvites] = useState<InviteMemberData[]>([])
    const [currentEmail, setCurrentEmail] = useState('')
    const [currentRole, setCurrentRole] = useState<'ORG_MEMBER' | 'ORG_GUEST'>('ORG_MEMBER')
    const [guestCanEdit, setGuestCanEdit] = useState(false)

    const addInvite = () => {
        if (!currentEmail.trim()) return

        setInvites([...invites, {
            email: currentEmail,
            role: currentRole,
            canEdit: currentRole === 'ORG_GUEST' ? guestCanEdit : undefined
        }])

        setCurrentEmail('')
        setCurrentRole('ORG_MEMBER') // Reset to default
        setGuestCanEdit(false) // Reset
    }

    const removeInvite = (index: number) => {
        setInvites(invites.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            await createProject(orgSlug, clientSlug, {
                name,
                description,
                invites
            })
            setOpen(false)
            setName('')
            setDescription('')
            setInvites([])
        } catch (error) {
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button size="sm" className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        New Project
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Set up a project and invite your team.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="projectName">Project Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="projectName"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Website Redesign"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief summary of the project goals..."
                                className="h-20"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <Label className="mb-3 block">Invite Members (Optional)</Label>

                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-3">
                            <div className="flex items-start gap-2">
                                <div className="flex-1 space-y-2">
                                    <Input
                                        value={currentEmail}
                                        onChange={(e) => setCurrentEmail(e.target.value)}
                                        placeholder="colleague@example.com"
                                        className="bg-white"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                addInvite()
                                            }
                                        }}
                                    />
                                </div>
                                <div className="w-32">
                                    <Select
                                        value={currentRole}
                                        onValueChange={(v: any) => setCurrentRole(v)}
                                    >
                                        <SelectTrigger className="bg-white">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ORG_MEMBER">Member</SelectItem>
                                            <SelectItem value="ORG_GUEST">Guest</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button type="button" size="icon" variant="secondary" onClick={addInvite}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>

                            {currentRole === 'ORG_GUEST' && (
                                <div className="flex items-center gap-2 px-2 text-sm text-slate-600 animate-in fade-in slide-in-from-top-1">
                                    <Switch
                                        checked={guestCanEdit}
                                        onCheckedChange={setGuestCanEdit}
                                        id="guest-edit"
                                    />
                                    <Label htmlFor="guest-edit" className="font-normal cursor-pointer">
                                        Allow guest to <strong>edit</strong> content
                                    </Label>
                                </div>
                            )}

                            {currentRole === 'ORG_MEMBER' && (
                                <p className="text-[11px] text-slate-400 px-2">
                                    Members have full access (View, Edit, Manage) by default.
                                </p>
                            )}
                        </div>

                        {/* Invite List */}
                        {invites.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {invites.map((invite, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-white border border-slate-100 p-2 rounded-md">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                {invite.role === 'ORG_MEMBER' ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-900">{invite.email}</p>
                                                <p className="text-xs text-slate-500">
                                                    {invite.role === 'ORG_MEMBER' ? 'Full Member' : `Guest (${invite.canEdit ? 'Can Edit' : 'View Only'})`}
                                                </p>
                                            </div>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeInvite(idx)} className="h-6 w-6 text-slate-400 hover:text-red-500">
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
