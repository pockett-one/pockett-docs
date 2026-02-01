'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MoreHorizontal, Mail, Clock, Trash2, RefreshCcw, Plus, Info } from 'lucide-react'
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { removeMember, revokeInvitation, updateMemberPersona } from '@/lib/actions/members'
import { resendInvitation } from '@/lib/actions/invitations'
import { useToast } from "@/components/ui/toast"

interface MemberListProps {
    members: any[]
    invitations: any[]
    personas: any[]
    onRefresh: () => void
    onInviteWithPersona?: (personaId: string) => void
}

export function MemberList({ members, invitations, personas, onRefresh, onInviteWithPersona }: MemberListProps) {
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

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return '-'
        try {
            const d = typeof date === 'string' ? new Date(date) : date
            return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        } catch {
            return '-'
        }
    }

    // Group members by persona
    const membersByPersona = personas.reduce((acc, persona) => {
        acc[persona.id] = {
            persona,
            members: members.filter(m => m.personaId === persona.id),
            invitations: invitations.filter(i => i.personaId === persona.id)
        }
        return acc
    }, {} as Record<string, { persona: any, members: any[], invitations: any[] }>)

    // Also include members/invitations without a persona (shouldn't happen, but handle gracefully)
    const membersWithoutPersona = members.filter(m => !m.personaId || !personas.find(p => p.id === m.personaId))
    const invitationsWithoutPersona = invitations.filter(i => !i.personaId || !personas.find(p => p.id === i.personaId))

    return (
        <TooltipProvider>
            <div className="space-y-6">
                {/* Group by Persona */}
                {personas.length > 0 ? (
                    personas.map((persona) => {
                        const group = membersByPersona[persona.id]
                        const personaMembers = group?.members || []
                        const personaInvitations = group?.invitations || []

                    return (
                        <div key={persona.id} className="bg-white rounded-lg border border-slate-200 shadow-sm">
                            {/* Persona Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold text-slate-900">{persona.name}</h3>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <button className="text-slate-400 hover:text-slate-600">
                                                <Info className="h-4 w-4" />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="text-sm">{persona.description || 'No description available'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <div className="flex items-center gap-4">
                                    {onInviteWithPersona && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2"
                                            onClick={() => onInviteWithPersona(persona.id)}
                                        >
                                            <Plus className="h-4 w-4" />
                                            Invite Member
                                        </Button>
                                    )}
                                    <span className="text-sm text-slate-500">Joined On</span>
                                </div>
                            </div>

                            {/* Members Table */}
                            {personaMembers.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {personaMembers.map((member: any) => (
                                        <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                                            <div className="flex items-center gap-4 flex-1">
                                                <Avatar className="h-10 w-10 border border-slate-200">
                                                    <AvatarImage src={member.user.avatarUrl} />
                                                    <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900">{member.user.name}</p>
                                                    <p className="text-sm text-slate-500">{member.user.email}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-slate-500 min-w-[100px] text-right">
                                                    {formatDate(member.createdAt)}
                                                </span>
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
                                </div>
                            ) : null}

                            {/* Invitations for this Persona */}
                            {personaInvitations.length > 0 && (
                                <div className="border-t border-slate-100 divide-y divide-slate-100">
                                    {personaInvitations.map((invite: any) => (
                                        <div key={invite.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="h-10 w-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-200 text-slate-400">
                                                    <Mail className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-slate-900">{invite.email}</p>
                                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                                        <Clock className="h-3 w-3" />
                                                        <span className="capitalize">
                                                            {invite.status === 'PENDING' ? 'Invite Pending' :
                                                                invite.status === 'ACCEPTED' ? 'Invited Accepted' :
                                                                    invite.status.toLowerCase()}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-slate-500 min-w-[100px] text-right">
                                                    -
                                                </span>
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
                            )}

                            {/* Empty State */}
                            {personaMembers.length === 0 && personaInvitations.length === 0 && (
                                <div className="px-6 py-8 text-center text-slate-500">
                                    No members in this role yet.
                                </div>
                            )}
                        </div>
                    )
                    })
                ) : (
                    // Fallback: Show all members if no personas exist
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-base font-semibold text-slate-900">Members</h3>
                            <span className="text-sm text-slate-500">Joined On</span>
                        </div>
                        {members.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {members.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                                        <div className="flex items-center gap-4 flex-1">
                                            <Avatar className="h-10 w-10 border border-slate-200">
                                                <AvatarImage src={member.user.avatarUrl} />
                                                <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">{member.user.name}</p>
                                                <p className="text-sm text-slate-500">{member.user.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm text-slate-500 min-w-[100px] text-right">
                                                {formatDate(member.createdAt)}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
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
                            </div>
                        ) : (
                            <div className="px-6 py-8 text-center text-slate-500">
                                No members yet.
                            </div>
                        )}
                    </div>
                )}

                {/* Members/Invitations without persona (fallback) */}
                {(membersWithoutPersona.length > 0 || invitationsWithoutPersona.length > 0) && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="text-base font-semibold text-slate-900">Other Members</h3>
                            <span className="text-sm text-slate-500">Joined On</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {membersWithoutPersona.map((member: any) => (
                                <div key={member.id} className="flex items-center justify-between px-6 py-4">
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
                                        <span className="text-sm text-slate-500">{formatDate(member.createdAt)}</span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleOpenEdit(member)}>
                                                    Change Role
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => handleRemoveMember(member.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Remove Member
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Change Role Dialog */}
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
        </TooltipProvider>
    )
}

function ResendIcon({ className }: { className?: string }) {
    return <RefreshCcw className={className} />
}
