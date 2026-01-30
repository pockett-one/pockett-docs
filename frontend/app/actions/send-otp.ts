'use server'

import { headers } from 'next/headers'
import { AuthService } from '@/lib/auth-service'

import { serverActionWrapper, ActionResponse } from '@/lib/server-action-wrapper'

/**
 * Server action to verify Turnstile and send OTP
 * Protects against bot spam attacks on email quota
 */
export async function sendOTPWithTurnstile(
    email: string,
    turnstileToken: string
): Promise<ActionResponse<void>> {
    return serverActionWrapper(async () => {
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        // 1. Verify Turnstile token
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
                    response: turnstileToken,
                    remoteip: ip,
                }),
            })

            const verifyData = await verifyRes.json()
            if (!verifyData.success) {
                console.error('Turnstile verification failed:', verifyData)
                throw new Error('Captcha validation failed. Please try again.')
            }
        } catch (err) {
            if (err instanceof Error && err.message === 'Captcha validation failed. Please try again.') {
                throw err
            }
            throw new Error('Failed to verify captcha.')
        }

        // 2. Turnstile verified - now send OTP via AuthService
        // Note: AuthService.sendOTP is client-side, so we need to call Supabase directly
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true
            }
        })

        if (error) {
            throw new Error(error.message)
        }
    }, 'sendOTPWithTurnstile')
}
