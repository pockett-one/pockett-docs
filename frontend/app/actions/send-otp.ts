'use server'

import { headers } from 'next/headers'

import { serverActionWrapper, ActionResponse } from '@/lib/server-action-wrapper'

interface SendOTPResult {
    userExists: boolean
}

/**
 * Server action to verify Turnstile and send OTP
 * Protects against bot spam attacks on email quota
 * 
 * @param email - User's email address
 * @param turnstileToken - Cloudflare Turnstile token
 * @param checkExistingFirst - If true, first checks if user exists (for signup flow)
 * @returns { userExists: boolean } - Whether the user already existed
 */
export async function sendOTPWithTurnstile(
    email: string,
    turnstileToken: string,
    checkExistingFirst: boolean = false
): Promise<ActionResponse<SendOTPResult>> {
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

        // 2. Turnstile verified - now send OTP
        const { createClient } = await import('@supabase/supabase-js')
        const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321")
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        let userExists = false

        if (checkExistingFirst) {
            // Try sending OTP without creating user first (to detect existing users)
            const { error: existingError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    shouldCreateUser: false
                }
            })

            if (!existingError) {
                // OTP sent successfully - user exists
                userExists = true
                return { userExists }
            }

            // User doesn't exist - error expected, continue to create user
            // The error is typically "Signups not allowed for otp" or similar
        }

        // Send OTP (create user if needed)
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                shouldCreateUser: true
            }
        })

        if (error) {
            throw new Error(error.message)
        }

        return { userExists }
    }, 'sendOTPWithTurnstile')
}
