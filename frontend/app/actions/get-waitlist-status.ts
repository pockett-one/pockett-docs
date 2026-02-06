'use server'

import { prisma } from '@/lib/prisma'
import { serverActionWrapper, ActionResponse } from '@/lib/server-action-wrapper'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'

interface WaitlistStatus {
    exists: boolean
    position: number | null
    ahead: number | null
    behind: number | null
    plan: string | null
    createdAt: Date | null
    referralCode: string | null
    referralCount: number | null
    positionBoost: number | null
    upgradedToProPlus: boolean | null
}

export async function getWaitlistStatus(email: string): Promise<ActionResponse<WaitlistStatus>> {
    return serverActionWrapper(async () => {
        if (!email || !email.includes('@')) {
            return {
                exists: false,
                position: null,
                ahead: null,
                behind: null,
                plan: null,
                createdAt: null,
            }
        }

        const normalizedEmail = email.toLowerCase().trim()

        try {
            // Find the user's entry
            const userEntry = await prisma.waitlist.findFirst({
                where: { email: normalizedEmail },
                orderBy: { createdAt: 'asc' },
                select: {
                    email: true,
                    plan: true,
                    createdAt: true,
                    referralCode: true,
                    referralCount: true,
                    positionBoost: true,
                },
            })

            if (!userEntry) {
                return {
                    exists: false,
                    position: null,
                    ahead: null,
                    behind: null,
                    plan: null,
                    createdAt: null,
                    referralCode: null,
                    referralCount: null,
                    positionBoost: null,
                    upgradedToProPlus: null,
                }
            }

            // Count entries before this user (ahead of them)
            const aheadCount = await prisma.waitlist.count({
                where: {
                    createdAt: {
                        lt: userEntry.createdAt,
                    },
                },
            })

            // Count entries after this user (behind them)
            const behindCount = await prisma.waitlist.count({
                where: {
                    createdAt: {
                        gt: userEntry.createdAt,
                    },
                },
            })

            // Position is 1-indexed (first person is position 1)
            const position = aheadCount + 1

            // Check if they've earned Pro Plus upgrade (5+ referrals)
            const upgradedToProPlus = userEntry.referralCount >= 5

            return {
                exists: true,
                position,
                ahead: aheadCount,
                behind: behindCount,
                plan: upgradedToProPlus ? 'Pro Plus' : userEntry.plan,
                createdAt: userEntry.createdAt,
                referralCode: userEntry.referralCode,
                referralCount: userEntry.referralCount,
                positionBoost: userEntry.positionBoost,
                upgradedToProPlus,
            }
        } catch (error) {
            // Handle database connection errors specifically
            if (error instanceof PrismaClientKnownRequestError) {
                // P1001 = Can't reach database server
                if (error.code === 'P1001') {
                    throw new Error('Unable to connect to database. Please try again in a moment.')
                }
                // P1002 = Database connection timeout
                if (error.code === 'P1002') {
                    throw new Error('Database connection timed out. Please try again.')
                }
                // P1003 = Database does not exist
                if (error.code === 'P1003') {
                    throw new Error('Database configuration error. Please contact support.')
                }
                // P2021 = Table does not exist
                // P2022 = Column does not exist
                if (error.code === 'P2021' || error.code === 'P2022') {
                    throw new Error('Database schema is out of sync. Please contact support.')
                }
            }
            // Re-throw to be handled by serverActionWrapper
            throw error
        }
    }, 'getWaitlistStatus')
}
