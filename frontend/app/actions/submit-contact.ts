'use server'

import { headers } from 'next/headers'

import { CONTACT_MESSAGE_MAX_LENGTH } from '@/lib/contact-form-limits'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { serverActionWrapper, ActionResponse } from '@/lib/server-action-wrapper'

const WINDOW_SIZE = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5 // 5 requests per hour

export async function submitContactForm(formData: FormData, token: string): Promise<ActionResponse<string>> {
    return serverActionWrapper(async () => {
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        // 1. Database-based rate limit (Prisma → system.contact_submissions; not Supabase REST / public)
        const oneHourAgo = new Date(Date.now() - WINDOW_SIZE)
        let recentCount = 0
        try {
            recentCount = await prisma.contactSubmission.count({
                where: {
                    ipAddress: ip,
                    createdAt: { gte: oneHourAgo },
                },
            })
        } catch (e) {
            console.error('Rate limit check error:', e)
            // Continue — don't block legitimate users due to DB issues
        }
        if (recentCount >= MAX_REQUESTS) {
            throw new Error('Too many requests. Please try again later.')
        }

        // 2. Honeypot Check
        const honeypot = formData.get('website')
        if (honeypot) {
            return 'Received!'
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

        const messageRaw = (formData.get('message') as string | null) ?? ''
        const messageTrimmed = messageRaw.trim()
        if (!messageTrimmed) {
            throw new Error('Please enter a message.')
        }
        // Hard cap to CONTACT_MESSAGE_MAX_LENGTH. Do not throw on overlong payloads: the UI uses
        // maxLength={CONTACT_MESSAGE_MAX_LENGTH}, but Server Action / FormData decoding can rarely
        // yield a string slightly longer than the browser’s value (UTF-16 / transport edge cases).
        const messageForStore = messageTrimmed.slice(0, CONTACT_MESSAGE_MAX_LENGTH)
        if (messageTrimmed.length > CONTACT_MESSAGE_MAX_LENGTH) {
            logger.warn('Contact message clamped to max length', 'submitContactForm', {
                receivedLength: messageTrimmed.length,
                max: CONTACT_MESSAGE_MAX_LENGTH,
            })
        }

        // 4. Persist via Prisma (table lives in system schema; PostgREST does not expose it on public)
        try {
            await prisma.contactSubmission.create({
                data: {
                    ipAddress: ip,
                    email: (formData.get('email') as string) || null,
                    role: (formData.get('role') as string) || null,
                    teamSize: (formData.get('teamSize') as string) || null,
                    inquiryType: (formData.get('inquiryType') as string) || null,
                    message: messageForStore,
                },
            })
        } catch (err) {
            console.error('Contact submission insert error:', err)
            throw new Error('Database error occurred.')
        }

        return 'Feedback received!'
    }, 'submitContactForm')
}
