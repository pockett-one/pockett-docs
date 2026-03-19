'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { InvitationStatus } from '@prisma/client'
import { sendEmail } from '@/lib/email'
import { BRAND_NAME } from '@/config/brand'
import { canManageClient } from '@/lib/permission-helpers'

const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getAvatarUrlFromSupabaseUser(dbUser: any): string | null {
    if (!dbUser) return null
    const meta = dbUser.user_metadata
    const fromMeta = (meta?.avatar_url ?? meta?.picture) as string | undefined
    if (fromMeta) return fromMeta
    const firstIdentity = dbUser.identities?.[0]?.identity_data
    const fromIdentity = (firstIdentity?.avatar_url ?? firstIdentity?.picture) as string | undefined
    return fromIdentity ?? null
}

export async function getClientMembers(clientId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const members = await prisma.clientMember.findMany({
        where: { clientId },
        include: { persona: true },
        orderBy: { id: 'asc' }
    })

    const invitations = await prisma.clientInvitation.findMany({
        where: {
            clientId,
            status: { not: InvitationStatus.JOINED }
        },
        include: { persona: true },
        orderBy: { createdAt: 'desc' }
    })

    const enrichedMembers = await Promise.all(
        members.map(async (m) => {
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
            } catch {
                return {
                    ...m,
                    user: { email: 'Unknown', name: 'Unknown User', avatarUrl: null }
                }
            }
        })
    )

    return { members: enrichedMembers, invitations }
}

export async function inviteClientMember(firmId: string, clientId: string, email: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const canManage = await canManageClient(firmId, clientId)
    if (!canManage) throw new Error('Insufficient permissions to invite client members')

    const client = await prisma.client.findUnique({
        where: { id: clientId },
        include: { firm: { select: { sandboxOnly: true } } }
    })
    if (!client) throw new Error('Client not found')
    if (client.firm?.sandboxOnly) {
        throw new Error('Inviting members is restricted for Sandbox firms. Upgrade to invite teammates.')
    }

    const persona = await prisma.persona.findUnique({
        where: { slug: 'client_admin' }
    })
    if (!persona) throw new Error('System Error: client_admin persona not found')

    const normalizedEmail = email.trim().toLowerCase()

    const allMembers = await prisma.clientMember.findMany({ where: { clientId }, select: { userId: true } })
    let existingUserWithEmail: string | null = null
    for (const m of allMembers) {
        const uid = m.userId
        try {
            const { data: { user: u } } = await supabaseAdmin.auth.admin.getUserById(uid)
            if (u?.email?.toLowerCase() === normalizedEmail) {
                existingUserWithEmail = uid
                break
            }
        } catch {
            // skip
        }
    }
    if (existingUserWithEmail) {
        throw new Error('A member with this email is already in the client')
    }

    const token = crypto.randomUUID()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7)

    const existing = await prisma.clientInvitation.findUnique({
        where: { clientId_email: { clientId, email: normalizedEmail } }
    })

    if (existing) {
        if (existing.status === InvitationStatus.JOINED) {
            throw new Error('This user has already joined the client')
        }
        await prisma.clientInvitation.update({
            where: { id: existing.id },
            data: { status: 'PENDING', token, expireAt, updatedBy: user.id }
        })
    } else {
        await prisma.clientInvitation.create({
            data: {
                clientId,
                email: normalizedEmail,
                personaId: persona.id,
                status: 'PENDING',
                token,
                expireAt,
                createdBy: user.id,
                updatedBy: user.id,
            }
        })
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    await sendEmail(
        normalizedEmail,
        `You've been invited to join a client on ${BRAND_NAME}`,
        `<p>You have been invited to join a client on ${BRAND_NAME} as a Client Administrator.</p>
         <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
    )
    revalidatePath(`/d/f/[slug]/c/[clientSlug]`)
}

export async function resendClientInvitation(invitationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const invite = await prisma.clientInvitation.findUnique({
        where: { id: invitationId },
        include: { client: { select: { firmId: true } } }
    })
    if (!invite) throw new Error('Invitation not found')
    if (invite.status === InvitationStatus.JOINED) throw new Error('User has already joined')

    const canManage = await canManageClient(invite.client.firmId, invite.clientId)
    if (!canManage) throw new Error('Insufficient permissions')

    const token = crypto.randomUUID()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + 7)

    await prisma.clientInvitation.update({
        where: { id: invitationId },
        data: { token, status: 'PENDING', expireAt, updatedAt: new Date() }
    })

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`
    await sendEmail(
        invite.email,
        `You've been invited to join a client on ${BRAND_NAME}`,
        `<p>You have been invited to join a client on ${BRAND_NAME}.</p>
         <p>Click here to accept: <a href="${inviteUrl}">${inviteUrl}</a></p>`
    )
    revalidatePath(`/d/f/[slug]/c/[clientSlug]`)
}

export async function revokeClientInvitation(invitationId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const invite = await prisma.clientInvitation.findUnique({
        where: { id: invitationId },
        include: { client: { select: { firmId: true } } }
    })
    if (!invite) throw new Error('Invitation not found')

    const canManage = await canManageClient(invite.client.firmId, invite.clientId)
    if (!canManage) throw new Error('Insufficient permissions')

    await prisma.clientInvitation.delete({ where: { id: invitationId } })
    revalidatePath(`/d/f/[slug]/c/[clientSlug]`)
}
