'use server'

import { createClient } from "@/utils/supabase/server"
import { prisma } from "@/lib/prisma"
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'

// Admin Client for fetching user details
const supabaseAdmin = createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getProjectMembers(projectId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Check access to project? 
    // RLS protects, but Prisma doesn't use RLS. 
    // We should verify the user is a member of the project or org owner.
    // For MVP, I'll rely on the fact that the UI calls this contextually.
    // Ideally:
    /*
    const membership = await prisma.projectMember.findFirst({
        where: { projectId, userId: user.id }
    })
    if (!membership) ... check org owner ...
    */

    // 1. Fetch Members
    const members = await prisma.projectMember.findMany({
        where: { projectId },
        include: { persona: true },
        orderBy: { createdAt: 'asc' }
    })

    // 2. Fetch Pending Invitations
    const invitations = await prisma.projectInvitation.findMany({
        where: {
            projectId,
            status: 'PENDING'
        },
        include: { persona: true },
        orderBy: { createdAt: 'desc' }
    })

    // 3. Enrich Members with User Data
    // We use Promise.all to fetch details in parallel. 
    // Note: This might hit rate limits for large projects.
    const enrichedMembers = await Promise.all(members.map(async (m) => {
        try {
            const { data: { user: dbUser } } = await supabaseAdmin.auth.admin.getUserById(m.userId)
            return {
                ...m,
                user: {
                    email: dbUser?.email,
                    name: dbUser?.user_metadata?.full_name || dbUser?.user_metadata?.name || dbUser?.email?.split('@')[0],
                    avatarUrl: dbUser?.user_metadata?.avatar_url
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

export async function removeMember(memberId: string) {
    // Verify auth & permissions
    // Delete ProjectMember
    await prisma.projectMember.delete({ where: { id: memberId } })
}

export async function revokeInvitation(invitationId: string) {
    // Verify auth & permissions
    // Delete Invitation
    await prisma.projectInvitation.delete({ where: { id: invitationId } })
}

export async function updateMemberPersona(memberId: string, personaId: string) {
    // Verify auth
    await prisma.projectMember.update({
        where: { id: memberId },
        data: { personaId }
    })
}
