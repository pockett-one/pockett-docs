'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProjectPersona, Role } from '@prisma/client'
import { inviteMember } from '@/lib/actions/invitations'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, Briefcase, Eye } from 'lucide-react'
import { ROLES } from '@/lib/roles'

type ProjectPersonaWithRole = ProjectPersona & { role: Role }

interface InviteMemberModalProps {
    projectId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    personas: ProjectPersonaWithRole[]
    preselectedPersonaId?: string | null
    onSuccess: () => void
}

export function InviteMemberModal({ projectId, open, onOpenChange, personas, preselectedPersonaId, onSuccess }: InviteMemberModalProps) {
    const [email, setEmail] = useState('')
    const [selectedPersonaId, setSelectedPersonaId] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    // Set preselected persona when modal opens
    useEffect(() => {
        if (open && preselectedPersonaId) {
            setSelectedPersonaId(preselectedPersonaId)
        } else if (!open) {
            // Reset when modal closes
            setSelectedPersonaId('')
            setEmail('')
            setError('')
        }
    }, [open, preselectedPersonaId])

    const selectedPersona = personas.find(p => p.id === selectedPersonaId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsSubmitting(true)

        try {
            await inviteMember(projectId, email, selectedPersonaId)
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || 'Failed to send invitation')
        } finally {
            setIsSubmitting(false)
        }
    }

    const getPersonaIcon = (name: string) => {
        if (name.includes('Owner')) return <Shield className="h-4 w-4" />
        if (name.includes('Internal')) return <Users className="h-4 w-4" />
        if (name.includes('Client')) return <Eye className="h-4 w-4" />
        return <Briefcase className="h-4 w-4" />
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Invite to Project</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                    {/* Email Input */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="colleague@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Persona Selection */}
                    <div className="space-y-2">
                        <Label>Role (Persona)</Label>
                        <Select value={selectedPersonaId} onValueChange={setSelectedPersonaId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a persona" />
                            </SelectTrigger>
                            <SelectContent>
                                {personas.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        <span className="font-medium">{p.name}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Persona Description Preview */}
                        {selectedPersona && (
                            <div className="mt-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                                <div className="flex items-center gap-2 font-medium text-slate-900 mb-1">
                                    {getPersonaIcon(selectedPersona.name)}
                                    {selectedPersona.name}
                                </div>
                                <p className="text-slate-600 mb-2">{selectedPersona.description}</p>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="text-xs bg-white">
                                        {(selectedPersona.permissions as any)?.can_manage ? 'Manage' :
                                            (selectedPersona.permissions as any)?.can_edit ? 'Edit' : 'View'}
                                    </Badge>
                                    <Badge variant="secondary" className="text-xs">
                                        {selectedPersona.role?.name === ROLES.ORG_MEMBER ? 'Internal' : 'Guest'}
                                    </Badge>
                                </div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 p-2 rounded">{error}</p>
                    )}

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !selectedPersonaId || !email}>
                            {isSubmitting ? 'Sending...' : 'Send Invitation'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
