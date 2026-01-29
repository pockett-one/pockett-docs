'use server'

import { ROLES } from '@/lib/roles'
import { prisma } from "@/lib/prisma"
import { createClient } from "@/utils/supabase/server"

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
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 7)

    if (existing) {
        if (existing.status === 'JOINED') {
            throw new Error("User has already joined the project")
        }
        // Update existing invite (reset to PENDING if expired or re-inviting)
        return await prisma.projectInvitation.update({
            where: { id: existing.id },
            data: {
                personaId,
                status: 'PENDING',
                token,
                expirationDate,
                updatedAt: new Date()
            }
        })
    }

    // Create new invite
    const invite = await prisma.projectInvitation.create({
        data: {
            projectId,
            email,
            personaId,
            token,
            status: 'PENDING',
            expirationDate
        }
    })

    // Send Email (Mock)
    console.log(`[EMAIL] Sending Invite to ${email} for Project ${projectId} with token ${token}`)

    return invite
}

export async function resendInvitation(invitationId: string) {
    // Regenerate token and send email
    const invite = await prisma.projectInvitation.findUnique({ where: { id: invitationId } })
    if (!invite) throw new Error("Invitation not found")

    if (invite.status === 'JOINED') throw new Error("User has already joined")

    const token = crypto.randomUUID()
    const expirationDate = new Date()
    expirationDate.setDate(expirationDate.getDate() + 7)

    const updated = await prisma.projectInvitation.update({
        where: { id: invitationId },
        data: {
            token,
            updatedAt: new Date(),
            status: 'PENDING',
            expirationDate
        }
    })

    console.log(`[EMAIL] Resending Invite to ${invite.email} with token ${token}`)
    return updated
}

export async function verifyInvitation(token: string) {
    // This would be used on the "Accept Invite" page
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

    if (!invite) throw new Error("Invalid token")

    // Check Expiry
    if (invite.expirationDate && new Date() > invite.expirationDate) {
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
                        include: { organization: true }
                    }
                }
            }
        }
    })

    if (!invite) throw new Error("Invalid invitation")

    // Check Status: Must be ACCEPTED (since verifyInvitation handles PENDING->ACCEPTED) or PENDING (failsafe)
    // But CANNOT be JOINED or EXPIRED
    if (invite.status === 'JOINED') throw new Error("You have already joined this project")
    if (invite.expirationDate && new Date() > invite.expirationDate) throw new Error("Invitation expired")

    // 1. Create ProjectMember
    await prisma.projectMember.create({
        data: {
            project: { connect: { id: invite.projectId } },
            userId: user.id,
            persona: { connect: { id: invite.personaId } },
            canView: (invite.persona.permissions as any)?.can_view ?? false,
            canEdit: (invite.persona.permissions as any)?.can_edit ?? false,
            canManage: (invite.persona.permissions as any)?.can_manage ?? false
        }
    })

    // 2. Add as Organization Member if needed
    const orgMember = await prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId: invite.persona.organizationId, userId: user.id } },
        include: { role: true }
    })

    if (!orgMember) {
        // Check if user has a default org
        const hasDefault = await prisma.organizationMember.findFirst({
            where: { userId: user.id, isDefault: true },
            select: { id: true }
        })

        // Create Org Member. Role depends on Persona system role.
        await prisma.organizationMember.create({
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
            await prisma.organizationMember.update({
                where: { id: orgMember.id },
                data: { role: { connect: { id: invite.persona.roleId } } }
            })
        }
    }

    // 3. Update Invitation Status to JOINED
    await prisma.projectInvitation.update({
        where: { id: invite.id },
        data: {
            status: 'JOINED',
            joinedAt: new Date()
        }
    })

    // 4. Calculate Redirect URL
    const orgSlug = invite.project.client.organization.slug
    const clientSlug = invite.project.client.slug
    const projectSlug = invite.project.slug

    return { success: true, redirectUrl: `/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}` }
}
