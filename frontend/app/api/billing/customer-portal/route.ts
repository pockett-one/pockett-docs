import { NextRequest, NextResponse } from 'next/server'
import { Polar } from '@polar-sh/sdk'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/utils/supabase/server'
import { resolveBillingAnchorFirmId } from '@/lib/billing/billing-group'

function polarServer(): 'production' | 'sandbox' {
    return process.env.POLAR_SERVER === 'production' ? 'production' : 'sandbox'
}

export async function POST(request: NextRequest) {
    const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim()
    if (!accessToken) {
        return NextResponse.json({ error: 'Polar is not configured.' }, { status: 503 })
    }

    const supabase = await createClient()
    const {
        data: { session },
    } = await supabase.auth.getSession()
    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const firmId = typeof body.firmId === 'string' ? body.firmId.trim() : ''
    if (!firmId) {
        return NextResponse.json({ error: 'Missing firmId' }, { status: 400 })
    }

    const userId = session.user.id
    const membership = await prisma.firmMember.findFirst({
        where: {
            firmId,
            userId,
            firm: { deletedAt: null },
        },
        select: { id: true },
    })
    if (!membership) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const anchorId = await resolveBillingAnchorFirmId(firmId)
    const anchor = await prisma.firm.findUnique({
        where: { id: anchorId },
        select: { polarCustomerId: true },
    })
    if (!anchor?.polarCustomerId) {
        return NextResponse.json(
            { error: 'No Polar customer on file yet. Complete onboarding or contact support.' },
            { status: 409 }
        )
    }

    const origin = request.headers.get('origin')?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || ''
    let returnUrl: string | null = null
    try {
        if (origin) {
            returnUrl = new URL('/d/profile', origin).toString()
        }
    } catch {
        returnUrl = null
    }

    const polar = new Polar({ accessToken, server: polarServer() })
    const customerSession = await polar.customerSessions.create({
        externalCustomerId: anchorId,
        returnUrl,
    })

    return NextResponse.json({ url: customerSession.customerPortalUrl })
}
