'use server'

import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from "next/cache"
import { InvitationStatus } from '@prisma/client'
import { logger } from '@/lib/logger'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { safeInngestSend } from '@/lib/inngest/client'

// Admin Client for fetching user details
const supabaseAdmin = createSupabaseAdmin(
    (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** Resolve avatar URL from Supabase user */
function getAvatarUrlFromSupabaseUser(dbUser: any): string | null {
    if (!dbUser) return null
    const meta = dbUser.user_metadata
    const fromMeta = (meta?.avatar_url ?? meta?.picture) as string | undefined
    if (fromMeta) return fromMeta
    const firstIdentity = dbUser.identities?.[0]?.identity_data
    const fromIdentity = (firstIdentity?.avatar_url ?? firstIdentity?.picture) as string | undefined
    return fromIdentity ?? null
}

export async function getProjectMembers(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Fetch Members (V2)
    const members = await (prisma as any).projectMember.findMany({
        where: { projectId },
        include: { persona: true },
        orderBy: { id: 'asc' } // V2 doesn't have createdAt on ProjectMember yet? let's check schema
    })

    // 2. Fetch Pending Invitations (V2)
    const invitations = await (prisma as any).projectInvitation.findMany({
        where: {
            projectId,
            status: { not: InvitationStatus.JOINED }
        },
        include: { persona: true },
        orderBy: { createdAt: 'desc' }
    })

    // 3. Enrich Members with User Data
    const enrichedMembers = await Promise.all(members.map(async (m: any) => {
        try {
            const { data: { user: dbUser } } = await supabaseAdmin.auth.admin.getUserById(m.userId)
            return {
                ...m,
                user: {
                    email: dbUser?.email,
                    name: dbUser?.user_metadata?.full_name || dbUser?.user_metadata?.name || dbUser?.email?.split('@')[0],
                    avatarUrl: getAvatarUrlFromSupabaseUser(dbUser)
                }
            }
        } catch (e) {
            return {
                ...m,
                user: { email: 'Unknown', name: 'Unknown User' }
            }
        }
    }))

    return {
        members: enrichedMembers,
        invitations
    }
}

export type ProjectMemberSummaryUser = { name: string; email: string; avatarUrl?: string | null; personaName?: string }
export type ProjectMemberSummary = {
    projectLeads: ProjectMemberSummaryUser[]
    teamMembers: ProjectMemberSummaryUser[]
    external: ProjectMemberSummaryUser[]
}

/** Lightweight member summaries per project */
export async function getProjectMemberSummaries(projectIds: string[]): Promise<Record<string, ProjectMemberSummary>> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return {}

    if (projectIds.length === 0) return {}

    const members = await (prisma as any).projectMember.findMany({
        where: { projectId: { in: projectIds } },
        select: {
            projectId: true,
            userId: true,
            persona: { select: { displayName: true } }
        }
    })

    const result: Record<string, ProjectMemberSummary> = {}
    for (const id of projectIds) {
        result[id] = { projectLeads: [], teamMembers: [], external: [] }
    }

    for (const m of members) {
        const displayPersonaName = m.persona?.displayName ?? ''
        let userData: ProjectMemberSummaryUser
        try {
            const { data: { user: dbUser } } = await supabaseAdmin.auth.admin.getUserById(m.userId)
            userData = {
                name: dbUser?.user_metadata?.full_name || dbUser?.user_metadata?.name || dbUser?.email?.split('@')[0] || 'Unknown',
                email: dbUser?.email || '',
                avatarUrl: getAvatarUrlFromSupabaseUser(dbUser),
                personaName: displayPersonaName || undefined
            }
        } catch {
            userData = { name: 'Unknown', email: '', personaName: displayPersonaName || undefined }
        }
        const personaLower = displayPersonaName.toLowerCase()
        if (personaLower.includes('lead')) result[m.projectId].projectLeads.push(userData)
        else if (personaLower.includes('team')) result[m.projectId].teamMembers.push(userData)
        else result[m.projectId].external.push(userData)
    }

    return result
}

export async function removeMember(memberId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        const member = await (prisma as any).projectMember.findUnique({
            where: { id: memberId },
            include: {
                project: {
                    select: {
                        id: true,
                        connectorRootFolderId: true,
                        client: {
                            select: {
                                organizationId: true
                            }
                        }
                    }
                }
            }
        })

        if (!member) throw new Error("Member not found")

        // Revoke Google Drive folder access
        if (member.project.connectorRootFolderId) {
            try {
                const { data: { user: memberUser } } = await supabaseAdmin.auth.admin.getUserById(member.userId)
                const memberEmail = memberUser?.email

                if (memberEmail) {
                    const org = await (prisma as any).organization.findUnique({
                        where: { id: member.project.client.organizationId },
                        include: { connector: true }
                    })
                    // In V2, organization might have connectorId directly
                    const connectorId = org.connectorId

                    if (connectorId) {
                        await googleDriveConnector.revokeFolderPermissionByEmail(
                            connectorId,
                            member.project.connectorRootFolderId,
                            memberEmail
                        )
                    }
                }
            } catch (error) {
                logger.error('Error revoking Drive folder access', error as Error)
            }
        }

        await (prisma as any).projectMember.delete({ where: { id: memberId } })

        const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
        await invalidateUserSettingsPlus(member.userId)

        revalidatePath('/o/[slug]/c/[clientSlug]/p/[projectSlug]')
    } catch (error) {
        logger.error('Failed to remove member (V2)', error as Error)
        throw error
    }
}

export async function revokeInvitation(invitationId: string) {
    try {
        await (prisma as any).projectInvitation.delete({ where: { id: invitationId } })
        revalidatePath('/o/[slug]/c/[clientSlug]/p/[projectSlug]')
    } catch (error) {
        logger.error('Failed to revoke invitation (V2)', error as Error)
        throw error
    }
}

export async function updateMemberPersona(memberId: string, personaId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("Unauthorized")

        const member = await (prisma as any).projectMember.findUnique({
            where: { id: memberId },
            include: {
                persona: true,
                project: { include: { client: true } }
            }
        })
        if (!member) throw new Error("Member not found")

        const newPersona = await (prisma as any).persona.findUnique({
            where: { id: personaId }
        })
        if (!newPersona) throw new Error("Persona not found")

        const oldPersonaSlug = member.persona?.slug ?? null

        await (prisma as any).projectMember.update({
            where: { id: memberId },
            data: { personaId }
        })

        const newPersonaSlug = newPersona.slug
        const timestamp = new Date().toISOString()

        await safeInngestSend('project.member.persona.updated', {
            projectId: member.projectId,
            organizationId: member.project.client.organizationId,
            memberId,
            userId: member.userId,
            oldPersonaId: member.personaId ?? null,
            newPersonaId: personaId,
            oldPersonaSlug,
            newPersonaSlug,
            timestamp,
            changedBy: user.id
        })

        const accessGrantingPersonas = ['project_viewer_guest', 'project_external_editor', 'project_editor', 'project_admin']
        if (accessGrantingPersonas.includes(newPersonaSlug)) {
            const { data: { user: memberUser } } = await supabaseAdmin.auth.admin.getUserById(member.userId)
            const memberEmail = memberUser?.email || memberUser?.user_metadata?.email

            if (memberEmail) {
                await safeInngestSend('project.member.added', {
                    projectId: member.projectId,
                    organizationId: member.project.client.organizationId,
                    memberId,
                    userId: member.userId,
                    email: memberEmail,
                    personaSlug: newPersonaSlug,
                    timestamp
                })
            }
        }

        const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
        await invalidateUserSettingsPlus(member.userId)

        return { success: true }
    } catch (error) {
        logger.error('Failed to update member persona (V2)', error as Error)
        throw error
    }
}
