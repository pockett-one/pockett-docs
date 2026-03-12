'use server'

import { prisma } from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { sendEmail } from '@/lib/email'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'
import { BRAND_NAME } from '@/config/brand'
import { safeInngestSend } from '@/lib/inngest/client'
import { invalidateUserSettingsPlus } from '@/lib/actions/user-settings'
import { createAdminClient } from '@/utils/supabase/admin'

/**
 * Invite a member to a project (V2)
 */
export async function inviteMember(projectId: string, email: string, personaId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // 1. Check if invitation exists (V2)
    const existing = await (prisma as any).projectInvitation.findUnique({
        where: { projectId_email: { projectId, email } }
    })

    const token = crypto.randomUUID()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7)

    if (existing) {
        if (existing.status === 'JOINED') {
            throw new Error("User has already joined the project")
        }

        await (prisma as any).projectInvitation.update({
            where: { id: existing.id },
            data: {
                personaId,
                status: 'PENDING',
                token,
                expireAt,
                updatedAt: new Date()
            }
        })

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
        await sendEmail(
            email,
            `You've been invited to join a project on ${BRAND_NAME}`,
            `<p>You have been invited to join a project on ${BRAND_NAME}.</p>
             <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
        )

        return existing
    }

    // 2. Create new invite (V2)
    const invite = await (prisma as any).projectInvitation.create({
        data: {
            projectId,
            email,
            personaId,
            token,
            status: 'PENDING',
            expireAt
        }
    })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    await sendEmail(
        email,
        `You've been invited to join a project on ${BRAND_NAME}`,
        `<p>You have been invited to join a project on ${BRAND_NAME}.</p>
         <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
    )

    return invite
}

/**
 * Resend invitation (V2)
 */
export async function resendInvitation(invitationId: string) {
    const invite = await (prisma as any).projectInvitation.findUnique({ where: { id: invitationId } })
    if (!invite) throw new Error("Invitation not found")
    if (invite.status === 'JOINED') throw new Error("User has already joined")

    const token = crypto.randomUUID()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7)

    const updated = await (prisma as any).projectInvitation.update({
        where: { id: invitationId },
        data: { token, updatedAt: new Date(), status: 'PENDING', expireAt }
    })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    await sendEmail(
        invite.email,
        `You've been invited to join a project on ${BRAND_NAME}`,
        `<p>You have been invited to join a project on ${BRAND_NAME}.</p>
         <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
    )

    return updated
}

/**
 * Verify invitation token (V2)
 */
export async function verifyInvitation(token: string) {
    if (!token || token.trim().length === 0) throw new Error("Invalid token")

    const invite = await (prisma as any).projectInvitation.findUnique({
        where: { token },
        include: {
            persona: true,
            project: {
                include: {
                    client: {
                        include: { organization: true }
                    }
                }
            }
        }
    })

    if (!invite) throw new Error("Invalid token")

    if (invite.expireAt && new Date() > invite.expireAt) {
        if (invite.status !== 'EXPIRED') {
            await (prisma as any).projectInvitation.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } })
        }
        throw new Error("Invitation expired")
    }

    if (invite.status === 'EXPIRED') throw new Error("Invitation expired")

    if (invite.status === 'PENDING') {
        await (prisma as any).projectInvitation.update({
            where: { id: invite.id },
            data: { status: 'ACCEPTED', acceptedAt: new Date() }
        })
        invite.status = 'ACCEPTED'
    }

    return {
        id: invite.id,
        token: invite.token,
        email: invite.email,
        status: invite.status,
        project: { name: invite.project.name },
        persona: {
            role: { displayLabel: invite.persona.displayName },
            organization: { name: invite.project.client.organization.name }
        }
    }
}

export async function acceptInvitationAction(token: string) {
    try {
        return await acceptInvitation(token)
    } catch (e: any) {
        logger.error("Accept Invitation Action Error (V2)", e as Error)
        return { success: false, error: e.message }
    }
}

/**
 * Accept invitation and join project/org (V2)
 */
export async function acceptInvitation(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Must be logged in")

    const invite = await (prisma as any).projectInvitation.findUnique({
        where: { token },
        include: {
            persona: true,
            project: {
                include: {
                    client: {
                        include: { organization: true }
                    }
                }
            }
        }
    })

    if (!invite) throw new Error("Invalid invitation")

    if (invite.status === 'JOINED') {
        const orgSlug = invite.project.client.organization.slug
        const clientSlug = invite.project.client.slug
        const projectSlug = invite.project.slug
        return { success: true, redirectUrl: `/d/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}/files` }
    }

    if (invite.expireAt && new Date() > invite.expireAt) throw new Error("Invitation expired")

    if (user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new Error(`This invitation is for ${invite.email}`)
    }

    const orgId = invite.project.client.organization.id
    const clientId = invite.project.client.id
    let newOrgMemberCreated = false
    let newOrgIsDefault = false

    await prisma.$transaction(async (tx: any) => {
        // 1. Create ProjectMember (RBAC v2: use role from invite persona)
        const projectRole = invite.persona.slug as 'proj_admin' | 'proj_member' | 'proj_ext_collaborator' | 'proj_viewer'
        await tx.projectMember.create({
            data: {
                projectId: invite.projectId,
                userId: user.id,
                role: projectRole
            }
        })

        // 2. Create ClientMember if not already a member (ClientMember still uses personaId)
        const existingClientMember = await tx.clientMember.findFirst({
            where: { clientId, userId: user.id }
        })
        if (!existingClientMember) {
            const clientPersona = await tx.persona.findUnique({ where: { slug: invite.persona.slug } })
            if (clientPersona) {
                await tx.clientMember.create({
                    data: { clientId, userId: user.id, personaId: clientPersona.id }
                })
            }
        }

        // 3. Add as Org Member if needed (RBAC v2: use role enum)
        const orgMember = await tx.orgMember.findFirst({
            where: { organizationId: orgId, userId: user.id }
        })

        if (!orgMember) {
            const hasDefault = await tx.orgMember.findFirst({
                where: { userId: user.id, isDefault: true },
                select: { id: true }
            })
            newOrgIsDefault = !hasDefault
            await tx.orgMember.create({
                data: {
                    organizationId: orgId,
                    userId: user.id,
                    role: 'org_member',
                    membershipType: 'external',
                    isDefault: newOrgIsDefault
                }
            })
            newOrgMemberCreated = true
        }

        // 4. Update Invitation Status
        await tx.projectInvitation.update({
            where: { id: invite.id },
            data: { status: 'JOINED', joinedAt: new Date() }
        })
    })

    await invalidateUserSettingsPlus(user.id)

    // Update JWT app_metadata so the user's active org is set correctly after accepting
    if (newOrgMemberCreated && newOrgIsDefault) {
        try {
            const adminClient = createAdminClient()
            await adminClient.auth.admin.updateUserById(user.id, {
                app_metadata: {
                    active_org_id: orgId,
                    active_persona: 'org_member'
                }
            })
            logger.info('JWT app_metadata updated after invitation acceptance', { userId: user.id, orgId })
        } catch (jwtError) {
            logger.error('Failed to update JWT app_metadata after invitation acceptance', jwtError as Error)
        }
    }

    // 4. Grant Google Drive folder access
    if (user.email && invite.project.connectorRootFolderId) {
        try {
            const connectorId = invite.project.client.organization.connectorId
            if (connectorId) {
                const folderIds = await googleDriveConnector.getProjectFolderIds(connectorId, invite.project.slug)

                // Simplified: Grant write access to general folder for all members
                if (folderIds.generalFolderId) {
                    await googleDriveConnector.grantFolderPermission(
                        connectorId,
                        folderIds.generalFolderId,
                        user.email,
                        'writer'
                    )
                }

                // Confidential access only for proj_admin
                if (invite.persona.slug === 'proj_admin' && folderIds.confidentialFolderId) {
                    await googleDriveConnector.grantFolderPermission(
                        connectorId,
                        folderIds.confidentialFolderId,
                        user.email,
                        'writer'
                    )
                }
            }
        } catch (error) {
            logger.error('Error granting Drive folder access (V2)', error as Error)
        }
    }

    // 5. Fire Inngest event
    await safeInngestSend('project.member.added', {
        projectId: invite.projectId,
        organizationId: invite.project.client.organization.id,
        memberId: invite.id,
        userId: user.id,
        email: user.email || '',
        personaSlug: invite.persona.slug,
        timestamp: new Date().toISOString()
    })

    const orgSlug = invite.project.client.organization.slug
    const clientSlug = invite.project.client.slug
    const projectSlug = invite.project.slug

    return { success: true, redirectUrl: `/d/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}/files` }
}
