'use server'

import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { serverActionWrapper, ActionResponse } from '@/lib/server-action-wrapper'

const WINDOW_SIZE = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 3 // 3 requests per hour per IP

interface WaitlistResponse {
    message: string
    isDuplicate?: boolean
    status?: {
        position: number
        ahead: number
        behind: number
        plan: string
    }
    referralCode?: string
}

export async function submitWaitlistForm(formData: FormData, token: string): Promise<ActionResponse<WaitlistResponse>> {
    return serverActionWrapper(async () => {
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'

        // 1. Database-based Rate Limit Check
        const oneHourAgo = new Date(Date.now() - WINDOW_SIZE)

        const recentSubmissions = await prisma.waitlist.count({
            where: {
                ipAddress: ip,
                createdAt: {
                    gte: oneHourAgo
                }
            }
        })

        if (recentSubmissions >= MAX_REQUESTS) {
            throw new Error('Too many requests. Please try again later.')
        }

        // 2. Honeypot Check
        const honeypot = formData.get('website')
        if (honeypot) {
            // Silently fail for bots
            return 'Thank you for joining!'
        }

        // 3. Turnstile Verification
        if (!token) {
            throw new Error('Captcha validation failed (missing token).')
        }

        const secretKey = process.env.TURNSTILE_SECRET_KEY
        if (!secretKey) {
            console.error('TURNSTILE_SECRET_KEY is not set')
            throw new Error('Server configuration error.')
        }

        try {
            const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    secret: secretKey,
                    response: token,
                    remoteip: ip,
                }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyData.success) {
                console.error('Turnstile verification failed:', verifyData)
                throw new Error('Captcha validation failed.')
            }
        } catch (err) {
            console.error('Turnstile verify error:', err)
            throw new Error('Failed to verify captcha.')
        }

        // 4. Check for duplicate email
        const email = formData.get('email') as string
        if (!email || !email.includes('@')) {
            throw new Error('Valid email is required.')
        }

        const existing = await prisma.waitlist.findFirst({
            where: { email: email.toLowerCase().trim() },
            select: {
                id: true,
                email: true,
                createdAt: true,
            },
        })

        if (existing) {
            // Calculate position
            const aheadCount = await prisma.waitlist.count({
                where: {
                    createdAt: {
                        lt: existing.createdAt,
                    },
                },
            })

            const behindCount = await prisma.waitlist.count({
                where: {
                    createdAt: {
                        gt: existing.createdAt,
                    },
                },
            })

            const position = aheadCount + 1

            return {
                message: 'You\'re already on the waitlist!',
                isDuplicate: true,
                status: {
                    position,
                    ahead: aheadCount,
                    behind: behindCount,
                    plan: existing.plan,
                },
            }
        }

        // 5. Process referral if present
        const referralCode = formData.get('referralCode') as string | null
        let referrerEmail: string | null = null
        let referrerId: string | null = null
        let isReferralSignup = false

        if (referralCode) {
            // Validate referral code exists and is not self-referral
            const referrer = await prisma.waitlist.findUnique({
                where: { referralCode: referralCode.trim().toUpperCase() },
                select: { email: true, id: true },
            })

            if (referrer && referrer.email.toLowerCase() !== email.toLowerCase().trim()) {
                referrerEmail = referrer.email
                referrerId = referrer.id
                isReferralSignup = true
            }
            // If invalid referral code, just ignore it (don't fail signup)
        }

        // 6. Insert waitlist entry
        const plan = (formData.get('plan') as string) || 'Standard'
        const normalizedEmail = email.toLowerCase().trim()

        // Generate unique referral code (8 characters, uppercase alphanumeric)
        const generateReferralCode = (): string => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Exclude confusing chars (0, O, I, 1)
            let code = ''
            for (let i = 0; i < 8; i++) {
                code += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return code
        }

        let referralCodeForNewUser = generateReferralCode()
        // Ensure uniqueness (very unlikely collision, but check anyway)
        let exists = await prisma.waitlist.findUnique({
            where: { referralCode: referralCodeForNewUser },
        })
        while (exists) {
            referralCodeForNewUser = generateReferralCode()
            exists = await prisma.waitlist.findUnique({
                where: { referralCode: referralCodeForNewUser },
            })
        }

        const newEntry = await prisma.waitlist.create({
            data: {
                email: normalizedEmail,
                plan: plan,
                companyName: formData.get('companyName') as string || null,
                companySize: formData.get('companySize') as string || null,
                role: formData.get('role') as string || null,
                comments: formData.get('comments') as string || null,
                ipAddress: ip,
                referralCode: referralCodeForNewUser,
                referredBy: referralCode || null,
            }
        })

        // 7. Process referral benefits
        if (isReferralSignup && referrerId) {
            // Update referrer's stats
            await prisma.waitlist.update({
                where: { id: referrerId },
                data: {
                    referralCount: { increment: 1 },
                    positionBoost: { increment: 3 }, // Move up 3 positions per referral
                },
            })

            // Give referee position boost (skip ahead 10 positions)
            // This is done by adjusting createdAt timestamp
            const boostMinutes = 10 // Equivalent to 10 people signing up before them
            await prisma.waitlist.update({
                where: { id: newEntry.id },
                data: {
                    createdAt: new Date(newEntry.createdAt.getTime() - boostMinutes * 60 * 1000),
                },
            })
        }

        const successMessage = isReferralSignup
            ? 'Thank you for joining via referral! You\'ve skipped ahead 10 positions. We\'ll notify you when Pro plan features are ready.'
            : 'Thank you for joining the waitlist! We\'ll notify you when Pro plan features are ready.'

        return {
            message: successMessage,
            isDuplicate: false,
            referralCode: referralCodeForNewUser,
        }
    }, 'submitWaitlistForm')
}
