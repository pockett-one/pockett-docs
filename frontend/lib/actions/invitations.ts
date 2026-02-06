'use server'

import { ROLES } from '@/lib/roles'
import { prisma } from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"
import { sendEmail } from '@/lib/email'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { logger } from '@/lib/logger'

export async function inviteMember(projectId: string, email: string, personaId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check Permissions
    // Ideally check if user can_manage on this project
    // For now, MVP assumes UI gating + basic Org membership check

    // Check if invitation exists
    const existing = await prisma.projectInvitation.findUnique({
        where: { projectId_email: { projectId, email } }
    })

    // Generate Token & Expiration (7 days)
    const token = crypto.randomUUID()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7)

    if (existing) {
        if (existing.status === 'JOINED') {
            const org = await prisma.project.findUnique({
                where: { id: projectId },
                select: { organizationId: true }
            });
            // check if user is in org?
            throw new Error("User has already joined the project")
        }
        // Update existing invite (reset to PENDING if expired or re-inviting)
        await prisma.projectInvitation.update({
            where: { id: existing.id },
            data: {
                personaId,
                status: 'PENDING',
                token,
                expireAt,
                updatedAt: new Date()
            }
        })

        // Send Email
        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
        await sendEmail(
            email,
            "You've been invited to join a project on Pockett",
            `<p>You have been invited to join a project on Pockett.</p>
             <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
        )

        return existing
    }

    // Create new invite
    const invite = await prisma.projectInvitation.create({
        data: {
            projectId,
            email,
            personaId,
            token,
            status: 'PENDING',
            expireAt
        }
    })

    // Send Email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    await sendEmail(
        email,
        "You've been invited to join a project on Pockett",
        `<p>You have been invited to join a project on Pockett.</p>
         <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
    )

    return invite
}

export async function resendInvitation(invitationId: string) {
    // Regenerate token and send email
    const invite = await prisma.projectInvitation.findUnique({ where: { id: invitationId } })
    if (!invite) throw new Error("Invitation not found")

    if (invite.status === 'JOINED') throw new Error("User has already joined")

    const token = crypto.randomUUID()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7)

    const updated = await prisma.projectInvitation.update({
        where: { id: invitationId },
        data: {
            token,
            updatedAt: new Date(),
            status: 'PENDING',
            expireAt
        }
    })

    // Send Email
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    await sendEmail(
        invite.email,
        "You've been invited to join a project on Pockett",
        `<p>You have been invited to join a project on Pockett.</p>
         <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
    )

    return updated
}

export async function verifyInvitation(token: string) {
    // This would be used on the "Accept Invite" page
    if (!token || token.trim().length === 0) {
        throw new Error("Invalid token")
    }

    const invite = await prisma.projectInvitation.findUnique({
        where: { token },
        include: {
            persona: {
                include: {
                    role: true,
                    organization: {
                        select: { name: true }
                    }
                }
            },
            project: {
                include: {
                    client: {
                        select: {
                            id: true,
                            slug: true,
                            organization: { select: { slug: true } }
                        }
                    }
                }
            }
        }
    })

    if (!invite) {
        logger.debug('Invitation token not found', 'Invitations', { token: token.substring(0, 8) + '...' })
        throw new Error("Invalid token")
    }

    // Check Expiry
    if (invite.expireAt && new Date() > invite.expireAt) {
        if (invite.status !== 'EXPIRED') {
            await prisma.projectInvitation.update({ where: { id: invite.id }, data: { status: 'EXPIRED' } })
        }
        throw new Error("Invitation expired")
    }

    if (invite.status === 'EXPIRED') throw new Error("Invitation expired")

    // If PENDING, update to ACCEPTED immediately upon first view
    if (invite.status === 'PENDING') {
        await prisma.projectInvitation.update({
            where: { id: invite.id },
            data: {
                status: 'ACCEPTED',
                acceptedAt: new Date()
            }
        })
        invite.status = 'ACCEPTED'
    }

    return invite
}

export async function acceptInvitationAction(token: string): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
    try {
        const result = await acceptInvitation(token)
        return result
    } catch (e: any) {
        console.error("Accept Invitation Action Error", e)
        return { success: false, error: e.message }
    }
}

export async function acceptInvitation(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error("Must be logged in to accept invitation")

    const invite = await prisma.projectInvitation.findUnique({
        where: { token },
        include: {
            persona: { include: { role: true } },
            project: {
                include: {
                    client: {
                        include: {
                            organization: {
                                select: {
                                    id: true,
                                    slug: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!invite) throw new Error("Invalid invitation")

    // Check Status: Must be ACCEPTED (since verifyInvitation handles PENDING->ACCEPTED) or PENDING (failsafe)
    // If status is JOINED, check if it's the current user, then allow.
    if (invite.status === 'JOINED') {
        // Idempotency: If already joined, just redirect.
        const orgSlug = invite.project.client.organization.slug
        const clientSlug = invite.project.client.slug
        const projectSlug = invite.project.slug
        return { success: true, redirectUrl: `/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}` }
    }

    if (invite.expireAt && new Date() > invite.expireAt) throw new Error("Invitation expired")

    // Enforce email match
    if (user.email && invite.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new Error(`This invitation is for ${invite.email}. You are logged in as ${user.email}.`)
    }

    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
        // 1. Create ProjectMember
        await tx.projectMember.create({
            data: {
                project: { connect: { id: invite.projectId } },
                userId: user.id,
                persona: { connect: { id: invite.personaId } }
            }
        })

        // 2. Add as Organization Member if needed
        const orgMember = await tx.organizationMember.findUnique({
            where: { organizationId_userId: { organizationId: invite.persona.organizationId, userId: user.id } },
            include: { role: true }
        })

        if (!orgMember) {
            // Check if user has a default org
            const hasDefault = await tx.organizationMember.findFirst({
                where: { userId: user.id, isDefault: true },
                select: { id: true }
            })

            // Create Org Member
            await tx.organizationMember.create({
                data: {
                    organization: { connect: { id: invite.persona.organizationId } },
                    userId: user.id,
                    role: { connect: { id: invite.persona.roleId } }, // ORG_MEMBER or ORG_GUEST ID
                    isDefault: !hasDefault
                }
            })
        } else {
            // Upgrade role if necessary? 
            // Example: Inviting an ORG_GUEST as a Project Owner (requires ORG_MEMBER).
            // If persona.role is ORG_MEMBER and user is ORG_GUEST, we should upgrade.
            const inviteRoleName = invite.persona.role.name
            const currentRoleName = orgMember.role.name

            if (inviteRoleName === ROLES.ORG_MEMBER && currentRoleName === ROLES.ORG_GUEST) {
                await tx.organizationMember.update({
                    where: { id: orgMember.id },
                    data: { role: { connect: { id: invite.persona.roleId } } }
                })
            }
        }

        // 3. Update Invitation Status to JOINED
        await tx.projectInvitation.update({
            where: { id: invite.id },
            data: {
                status: 'JOINED',
                joinedAt: new Date()
            }
        })
    })

    // Invalidate UserSettingsPlus cache for the user (permissions changed)
    const { invalidateUserSettingsPlus } = await import('@/lib/actions/user-settings')
    await invalidateUserSettingsPlus(user.id)

    // 4. Grant Google Drive folder access based on persona
    if (user.email && invite.project.driveFolderId) {
        const personaName = invite.persona.name.toLowerCase()
        const isProjectLead = personaName === 'project lead'
        const isTeamMember = personaName === 'team member'
        const shouldGrantEditAccess = isProjectLead || isTeamMember

        if (shouldGrantEditAccess) {
            try {
                // Find the organization's Google Drive connector
                const connector = await prisma.connector.findFirst({
                    where: {
                        organizationId: invite.project.client.organization.id,
                        type: 'GOOGLE_DRIVE',
                        status: 'ACTIVE'
                    }
                })

                if (connector) {
                    // Get general and confidential folder IDs
                    const folderIds = await googleDriveConnector.getProjectFolderIds(connector.id, invite.project.name)
                    
                    // Grant access to general folder for Project Lead and Team Member
                    if (folderIds.generalFolderId) {
                        const generalPermissionId = await googleDriveConnector.grantFolderPermission(
                            connector.id,
                            folderIds.generalFolderId,
                            user.email,
                            'writer' // can_edit access
                        )
                        if (generalPermissionId) {
                            logger.info('Granted Drive access to general folder', 'Invitations', {
                                userId: user.id,
                                email: user.email,
                                projectId: invite.projectId,
                                folderId: folderIds.generalFolderId,
                                personaName: invite.persona.name
                            })
                        }
                    }

                    // Grant access to confidential folder for Project Lead only
                    if (isProjectLead && folderIds.confidentialFolderId) {
                        const confidentialPermissionId = await googleDriveConnector.grantFolderPermission(
                            connector.id,
                            folderIds.confidentialFolderId,
                            user.email,
                            'writer' // can_edit access
                        )
                        if (confidentialPermissionId) {
                            logger.info('Granted Drive access to confidential folder', 'Invitations', {
                                userId: user.id,
                                email: user.email,
                                projectId: invite.projectId,
                                folderId: folderIds.confidentialFolderId,
                                personaName: invite.persona.name
                            })
                        }
                    }
                } else {
                    logger.debug('No active Google Drive connector found for organization', 'Invitations', {
                        organizationId: invite.project.client.organization.id
                    })
                }
            } catch (error) {
                // Don't fail the invitation acceptance if Drive permission grant fails
                logger.error('Error granting Drive folder access', error instanceof Error ? error : new Error(String(error)), 'Invitations', {
                    userId: user.id,
                    email: user.email,
                    projectId: invite.projectId
                })
            }
        }
    }

    // 5. Calculate Redirect URL
    const orgSlug = invite.project.client.organization.slug
    const clientSlug = invite.project.client.slug
    const projectSlug = invite.project.slug

    return { success: true, redirectUrl: `/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}` }
}
