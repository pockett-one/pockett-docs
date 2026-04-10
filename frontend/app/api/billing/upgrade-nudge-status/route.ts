import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { resolveBillingAnchorFirmId } from '@/lib/billing/billing-group'

export async function GET() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const membership = await prisma.firmMember.findFirst({
        where: { userId: user.id, isDefault: true, firm: { deletedAt: null } },
        select: { firmId: true },
    })
    if (!membership?.firmId) return NextResponse.json({ shouldShow: false })

    const anchorFirmId = await resolveBillingAnchorFirmId(membership.firmId)
    const anchor = await prisma.firm.findUnique({
        where: { id: anchorFirmId },
        select: {
            settings: true,
            subscriptionStatus: true,
            pricingModel: true,
        },
    })
    if (!anchor) return NextResponse.json({ shouldShow: false })

    const settings = (anchor.settings as Record<string, unknown> | null) ?? {}
    const onboarding = (settings.onboarding as Record<string, unknown> | undefined) ?? {}
    const subscription = (onboarding.subscription as Record<string, unknown> | undefined) ?? {}
    const paidPlan = subscription.paidPlan
    const subscriptionStatus = (anchor.subscriptionStatus ?? 'none').toLowerCase()
    const hasPaid = anchor.pricingModel === 'recurring_subscription' && ['active', 'trialing', 'past_due'].includes(subscriptionStatus)

    return NextResponse.json({
        shouldShow: paidPlan === 'skipped' && !hasPaid,
        paidPlan,
        hasPaid,
    })
}

