'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Shield, Mail, Clock, CheckCircle2, Trash2, RefreshCcw } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { removeMember, revokeInvitation, updateMemberPersona } from '@/lib/actions/members'
import { resendInvitation } from '@/lib/actions/invitations'
import { useToast } from "@/components/ui/toast"

interface MemberListProps {
    members: any[]
    invitations: any[]
    personas: any[]
    onRefresh: () => void
}

export function MemberList({ members, invitations, personas, onRefresh }: MemberListProps) {
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [editingMember, setEditingMember] = useState<any>(null)
    const [selectedPersonaId, setSelectedPersonaId] = useState<string>("")
    const { addToast } = useToast()

    const handleOpenEdit = (member: any) => {
        setEditingMember(member)
        setSelectedPersonaId(member.personaId)
    }

    const handleUpdateRole = async () => {
        if (!editingMember || !selectedPersonaId) return
        // Use a distinct loading state key for dialog
        setActionLoading("DIALOG_UPDATING")
        try {
            await updateMemberPersona(editingMember.id, selectedPersonaId)
            addToast({ type: 'success', title: 'Role Updated', message: 'Member role has been updated.' })
            onRefresh()
            setEditingMember(null)
        } catch (e: any) {
            console.error(e)
            addToast({ type: 'error', title: 'Update Failed', message: e.message || 'Could not update role.' })
        } finally {
            setActionLoading(null)
        }
    }

    const handleRemoveMember = async (id: string) => {
        if (!confirm("Are you sure? This will remove the user's access.")) return
        setActionLoading(id)
        try {
            await removeMember(id)
            addToast({ type: 'success', title: 'Member Removed', message: 'User access has been revoked.' })
            onRefresh()
        } catch (e) {
            console.error(e)
            addToast({ type: 'error', title: 'Error', message: 'Failed to remove member.' })
        } finally {
            setActionLoading(null)
        }
    }

    const handleRevokeInvite = async (id: string) => {
        if (!confirm("Cancel this invitation?")) return
        setActionLoading(id)
        try {
            await revokeInvitation(id)
            addToast({ type: 'success', title: 'Invitation Cancelled', message: 'The invitation has been successfully revoked.' })
            onRefresh()
        } catch (e) {
            console.error(e)
            addToast({ type: 'error', title: 'Error', message: 'Failed to revoke invitation.' })
        } finally {
            setActionLoading(null)
        }
    }

    const handleResendInvite = async (id: string) => {
        setActionLoading(id)
        try {
            await resendInvitation(id)
            addToast({ type: 'success', title: 'Invitation Sent', message: 'The invitation has been resent.' })
            onRefresh()
        } catch (e) {
            console.error(e)
            addToast({ type: 'error', title: 'Failed to Send', message: 'Could not resend the invitation.' })
        } finally {
            setActionLoading(null)
        }
    }

    const getInitials = (name: string) => {
        return name ? name.substring(0, 2).toUpperCase() : '??'
    }

    return (
        <div className="space-y-8">
            {/* Active Members */}
            <div>
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Active Members ({members.length})</h3>
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-10 w-10 border border-slate-200">
                                    <AvatarImage src={member.user.avatarUrl} />
                                    <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-slate-900">{member.user.name}</p>
                                    <p className="text-sm text-slate-500">{member.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200">
                                    {member.persona?.name || 'Unknown Role'}
                                </Badge>

                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                                            Change Role
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => handleRemoveMember(member.id)}
                                            disabled={actionLoading === member.id}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Remove Member
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="p-8 text-center text-slate-500">
                            No members yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Pending Invitations */}
            {invitations.length > 0 && (
                <div>
                    <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Pending Invitations ({invitations.length})</h3>
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm divide-y divide-slate-100">
                        {invitations.map((invite) => (
                            <div key={invite.id} className="flex items-center justify-between p-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 text-slate-400">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">{invite.email}</p>
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Clock className="h-3 w-3" />
                                            <span className="capitalize">
                                                {invite.status === 'PENDING' ? 'Pending Acceptance' :
                                                    invite.status === 'ACCEPTED' ? 'Signing Up...' :
                                                        invite.status.toLowerCase()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge variant="outline" className="border-dashed border-slate-300 text-slate-500">
                                        Invited as: {invite.persona?.name}
                                    </Badge>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-8"
                                            onClick={() => handleResendInvite(invite.id)}
                                            disabled={actionLoading === invite.id}
                                        >
                                            <ResendIcon className="h-3 w-3 mr-2" />
                                            Resend
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => handleRevokeInvite(invite.id)}
                                            disabled={actionLoading === invite.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Change Member Role</DialogTitle>
                        <DialogDescription>
                            Select a new role for {editingMember?.user.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <RadioGroup value={selectedPersonaId} onValueChange={setSelectedPersonaId} className="gap-4">
                            {personas.map((persona) => (
                                <div key={persona.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedPersonaId(persona.id)}>
                                    <RadioGroupItem value={persona.id} id={persona.id} />
                                    <div className="flex-1 cursor-pointer">
                                        <Label htmlFor={persona.id} className="font-medium cursor-pointer">{persona.name}</Label>
                                        <p className="text-sm text-slate-500">{persona.description || 'No description'}</p>
                                    </div>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingMember(null)}>Cancel</Button>
                        <Button
                            onClick={handleUpdateRole}
                            disabled={actionLoading === "DIALOG_UPDATING"}
                        >
                            {actionLoading === "DIALOG_UPDATING" ? 'Updating...' : 'Update Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function ResendIcon({ className }: { className?: string }) {
    return <RefreshCcw className={className} />
}

