'use client'

import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { getProjectMembers } from '@/lib/actions/members'
import { getOrganizationPersonas } from '@/lib/actions/personas'
import { ProjectPersona } from '@prisma/client'
import { MemberList } from './member-list'
import { InviteMemberModal } from './invite-member-modal'
import { logger } from '@/lib/logger'

interface ProjectMembersTabProps {
    projectId: string
    orgSlug: string
}

export function ProjectMembersTab({ projectId, orgSlug }: ProjectMembersTabProps) {
    const [members, setMembers] = useState<any[]>([])
    const [invitations, setInvitations] = useState<any[]>([])
    const [personas, setPersonas] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

    const refreshData = async () => {
        setIsLoading(true)
        try {
            const [membersData, personasData] = await Promise.all([
                getProjectMembers(projectId),
                getOrganizationPersonas(orgSlug)
            ])
            setMembers(membersData.members)
            setInvitations(membersData.invitations)
            setPersonas(personasData)
        } catch (error) {
            logger.error("Failed to fetch members data", error instanceof Error ? error : new Error(String(error)), 'ProjectMembers', { projectId })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        refreshData()
    }, [projectId, orgSlug])

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Project Members</h2>
                    <p className="text-sm text-slate-500">Manage access and roles for this project.</p>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Invite Member
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 bg-slate-50">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                    </div>
                ) : (
                    <MemberList
                        members={members}
                        invitations={invitations}
                        personas={personas}
                        onRefresh={refreshData}
                    />
                )}
            </div>

            <InviteMemberModal
                projectId={projectId}
                open={isInviteModalOpen}
                onOpenChange={setIsInviteModalOpen}
                personas={personas}
                onSuccess={refreshData}
            />
        </div>
    )
}
