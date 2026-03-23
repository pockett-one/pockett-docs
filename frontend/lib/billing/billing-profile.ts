import { prisma } from '@/lib/prisma'
import { resolveBillingAnchorFirmId } from '@/lib/billing/billing-group'

export type BillingProfilePayload = {
    workspaceFirm: {
        id: string
        name: string
        slug: string
        sandboxOnly: boolean
    }
    billingAnchor: {
        id: string
        name: string
        slug: string
        subscriptionStatus: string | null
        subscriptionPlan: string | null
        subscriptionCurrentPeriodEnd: Date | null
        polarCustomerId: string | null
        sandboxOnly: boolean
    }
}

export async function getBillingProfileForUser(userId: string): Promise<BillingProfilePayload | null> {
    const membership = await prisma.firmMember.findFirst({
        where: { userId, isDefault: true, firm: { deletedAt: null } },
        include: {
            firm: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    sandboxOnly: true,
                },
            },
        },
    })

    if (!membership?.firm) {
        const fallback = await prisma.firmMember.findFirst({
            where: { userId, firm: { deletedAt: null } },
            orderBy: { createdAt: 'asc' },
            include: {
                firm: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        sandboxOnly: true,
                    },
                },
            },
        })
        if (!fallback?.firm) return null
        return buildPayload(fallback.firm)
    }

    return buildPayload(membership.firm)
}

async function buildPayload(workspaceFirm: {
    id: string
    name: string
    slug: string
    sandboxOnly: boolean
}): Promise<BillingProfilePayload> {
    const anchorId = await resolveBillingAnchorFirmId(workspaceFirm.id)
    const anchor = await prisma.firm.findUnique({
        where: { id: anchorId },
        select: {
            id: true,
            name: true,
            slug: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
            subscriptionCurrentPeriodEnd: true,
            polarCustomerId: true,
            sandboxOnly: true,
        },
    })

    if (!anchor) {
        return {
            workspaceFirm,
            billingAnchor: {
                id: workspaceFirm.id,
                name: workspaceFirm.name,
                slug: workspaceFirm.slug,
                subscriptionStatus: null,
                subscriptionPlan: null,
                subscriptionCurrentPeriodEnd: null,
                polarCustomerId: null,
                sandboxOnly: workspaceFirm.sandboxOnly,
            },
        }
    }

    return {
        workspaceFirm,
        billingAnchor: anchor,
    }
}
