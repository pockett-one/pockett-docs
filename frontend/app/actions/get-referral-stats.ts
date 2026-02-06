'use server'

import { prisma } from '@/lib/prisma'
import { serverActionWrapper, ActionResponse } from '@/lib/server-action-wrapper'

interface ReferralStats {
    referralCode: string
    referralLink: string
    referralCount: number
    positionBoost: number
    plan: string
    upgradedToProPlus: boolean
}

export async function getReferralStats(email: string): Promise<ActionResponse<ReferralStats>> {
    return serverActionWrapper(async () => {
        if (!email || !email.includes('@')) {
            throw new Error('Valid email is required.')
        }

        const normalizedEmail = email.toLowerCase().trim()

        const entry = await prisma.waitlist.findFirst({
            where: { email: normalizedEmail },
            select: {
                referralCode: true,
                referralCount: true,
                positionBoost: true,
                plan: true,
            },
        })

        if (!entry) {
            throw new Error('Email not found on waitlist.')
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pockett.io'
        const referralLink = `${appUrl}/waitlist?ref=${entry.referralCode}&utm_source=referral&utm_medium=link&utm_campaign=waitlist`

        // Check if they've earned Pro Plus upgrade (5+ referrals)
        const upgradedToProPlus = entry.referralCount >= 5

        return {
            referralCode: entry.referralCode,
            referralLink,
            referralCount: entry.referralCount,
            positionBoost: entry.positionBoost,
            plan: upgradedToProPlus ? 'Pro Plus' : entry.plan,
            upgradedToProPlus,
        }
    }, 'getReferralStats')
}
