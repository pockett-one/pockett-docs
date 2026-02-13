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

export async function verifyInvitation(token: string): Promise<{
    id: string
    token: string
    email: string
    status: string
    project: {
        name: string
    }
    persona: {
        role: {
            displayLabel: string
        }
        organization: {
            name: string
        }
    }
} | null> {
    // This would be used on the "Accept Invite" page
    if (!token || token.trim().length === 0) {
        throw new Error("Invalid token")
    }

    const invite = await prisma.projectInvitation.findUnique({
        where: { token },
        include: {
            persona: {
                include: {
                    rbacPersona: {
                        include: {
                            role: true
                        }
                    }
                }
            },
            project: {
                select: {
                    name: true,
                    client: {
                        select: {
                            id: true,
                            slug: true,
                            organization: { select: { slug: true, name: true } }
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

    // Transform to match expected structure
    return {
        id: invite.id,
        token: invite.token,
        email: invite.email,
        status: invite.status,
        project: {
            name: invite.project.name
        },
        persona: {
            role: {
                displayLabel: invite.persona.rbacPersona.role.displayName || invite.persona.rbacPersona.role.slug
            },
            organization: {
                name: invite.project.client.organization.name
            }
        }
    }
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
            persona: {
                include: {
                    rbacPersona: {
                        include: { role: true }
                    }
                }
            },
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
        return { success: true, redirectUrl: `/d/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}` }
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
            where: { organizationId_userId: { organizationId: invite.project.client.organization.id, userId: user.id } },
            include: {
                organizationPersona: {
                    include: {
                        rbacPersona: {
                            include: { role: true }
                        }
                    }
                }
            }
        })

        if (!orgMember) {
            // Check if user has a default org
            const hasDefault = await tx.organizationMember.findFirst({
                where: { userId: user.id, isDefault: true },
                select: { id: true }
            })

            // Get project persona's RBAC persona to determine org role
            const projectPersona = await tx.projectPersona.findUnique({
                where: { id: invite.personaId },
                include: {
                    rbacPersona: {
                        include: { role: true }
                    }
                }
            })

            // Determine appropriate org persona based on project persona's role
            // All project personas use org_member role, so assign org_admin persona (Organization Owner)
            // Find or create appropriate organization persona (use org_admin)
            const rbacPersona = await tx.rbacPersona.findFirst({
                where: {
                    slug: 'org_admin'
                }
            })

            if (!rbacPersona) {
                throw new Error(`RBAC persona org_admin not found`)
            }

            // Find or create organization persona
            let orgPersona = await tx.organizationPersona.findUnique({
                where: {
                    organizationId_rbacPersonaId: {
                        organizationId: invite.project.client.organization.id,
                        rbacPersonaId: rbacPersona.id
                    }
                }
            })

            if (!orgPersona) {
                // Create default organization persona if it doesn't exist
                orgPersona = await tx.organizationPersona.create({
                    data: {
                        organizationId: invite.project.client.organization.id,
                        rbacPersonaId: rbacPersona.id,
                        displayName: 'Organization Owner'
                    }
                })
            }

            // Create Org Member with organization persona
            await tx.organizationMember.create({
                data: {
                    organizationId: invite.project.client.organization.id,
                    userId: user.id,
                    organizationPersonaId: orgPersona.id,
                    isDefault: !hasDefault
                }
            })
        }
        // Note: We don't upgrade org roles automatically anymore
        // Org roles are managed separately via organizationPersona assignments

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
        const personaName = invite.persona.displayName.toLowerCase()
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
                                personaName: invite.persona.displayName
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
                                personaName: invite.persona.displayName
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

        return { success: true, redirectUrl: `/d/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}` }
}
