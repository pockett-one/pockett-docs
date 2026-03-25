import { Polar } from '@polar-sh/sdk'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { resolveBillingAnchorFirmId } from '@/lib/billing/billing-group'

function polarServer(): 'production' | 'sandbox' {
    return process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'
}

export async function GET(request: Request) {
    const supabase = await createClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reqUrl = new URL(request.url)
    const firmId = reqUrl.searchParams.get('firmId')?.trim()
    if (!firmId) {
        return NextResponse.json({ error: 'Missing firmId' }, { status: 400 })
    }

    const membership = await prisma.firmMember.findFirst({
        where: {
            firmId,
            userId: session.user.id,
            firm: { deletedAt: null },
        },
        select: { id: true, role: true },
    })
    if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const anchorId = await resolveBillingAnchorFirmId(firmId)
    const anchor = await prisma.firm.findUnique({
        where: { id: anchorId },
        select: {
            subscriptionStatus: true,
            subscriptionPlan: true,
            pricingModel: true,
            subscriptionCurrentPeriodEnd: true,
            polarSubscriptionId: true,
            polarCustomerId: true,
        },
    })

    let periodEnd = anchor?.subscriptionCurrentPeriodEnd ?? null
    const isTrialing = (anchor?.subscriptionStatus ?? '').toLowerCase() === 'trialing'
    if (isTrialing && !periodEnd && anchor?.polarSubscriptionId) {
        const token = process.env.POLAR_ACCESS_TOKEN?.trim()
        if (token) {
            try {
                const polar = new Polar({ accessToken: token, server: polarServer() })
                const sub = await polar.subscriptions.get({ id: anchor.polarSubscriptionId })
                periodEnd = sub.trialEnd ?? sub.currentPeriodEnd ?? null
            } catch {
                // Best-effort fallback only.
            }
        }
    }

    const isFirmBillingAdmin = membership.role === 'firm_admin'

    return NextResponse.json(
        {
            current: {
                subscriptionStatus: anchor?.subscriptionStatus ?? null,
                subscriptionPlan: anchor?.subscriptionPlan ?? null,
                pricingModel:
                    anchor?.pricingModel === 'recurring_subscription' ||
                    anchor?.pricingModel === 'one_time_purchase'
                        ? anchor.pricingModel
                        : null,
                periodEndIso: periodEnd?.toISOString() ?? null,
                canOpenCustomerPortal: Boolean(anchor?.polarCustomerId),
                isFirmBillingAdmin,
            },
        },
        {
            headers: {
                // Critical: users may return from Polar after changing plans; don't show stale state.
                'Cache-Control': 'no-store',
            },
        }
    )
}
