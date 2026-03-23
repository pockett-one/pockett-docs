import { prisma } from '@/lib/prisma'

const ELIGIBLE_STATUSES = ['active', 'trialing'] as const

/**
 * Non-sandbox firm creation requires at least one paid/trialing subscription
 * on any firm the user belongs to.
 */
export async function canCreateNonSandboxFirm(userId: string): Promise<boolean> {
    const membership = await prisma.firmMember.findFirst({
        where: {
            userId,
            firm: {
                deletedAt: null,
                subscriptionStatus: { in: [...ELIGIBLE_STATUSES] },
            },
        },
        select: { id: true },
    })
    return Boolean(membership)
}

export async function requireNonSandboxFirmCreationAccess(userId: string): Promise<void> {
    const ok = await canCreateNonSandboxFirm(userId)
    if (!ok) {
        throw new Error('Upgrade to Standard to create a new firm outside the Free Sandbox.')
    }
}
