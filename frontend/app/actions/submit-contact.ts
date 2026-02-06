'use server'

import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

import { serverActionWrapper, ActionResponse } from '@/lib/server-action-wrapper'

const WINDOW_SIZE = 60 * 60 * 1000 // 1 hour
const MAX_REQUESTS = 5 // 5 requests per hour

export async function submitContactForm(formData: FormData, token: string): Promise<ActionResponse<string>> {
    return serverActionWrapper(async () => {
        const headersList = await headers()
        const ip = headersList.get('x-forwarded-for') || 'unknown'

        // Initialize Supabase client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(supabaseUrl, supabaseKey, {
            db: { schema: 'public' },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // 1. Database-based Rate Limit Check
        const oneHourAgo = new Date(Date.now() - WINDOW_SIZE).toISOString()

        const { data: recentSubmissions, error: rateLimitError } = await supabase
            .from('contact_submissions')
            .select('id')
            .eq('ip_address', ip)
            .gte('created_at', oneHourAgo)

        if (rateLimitError) {
            console.error('Rate limit check error:', rateLimitError)
            // Continue anyway - don't block legitimate users due to DB issues
        } else if (recentSubmissions && recentSubmissions.length >= MAX_REQUESTS) {
            throw new Error('Too many requests. Please try again later.')
        }

        // 2. Honeypot Check
        const honeypot = formData.get('website')
        if (honeypot) {
            // Silently fail for bots
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


        // 4. Supabase Insert (reuse the supabase client from rate limiting)
        const rawData = {
            ip_address: ip,
            email: formData.get('email') as string,
            plan: formData.get('plan') as string,
            role: formData.get('role') as string,
            team_size: formData.get('teamSize') as string,
            pain_point: formData.get('painPoint') as string,
            feature_request: formData.get('featureRequest') as string,
            comments: formData.get('comments') as string,
        }

        const { error } = await supabase
            .from('contact_submissions')
            .insert(rawData)

        if (error) {
            console.error('Supabase insert error:', error)
            throw new Error('Database error occurred.')
        }

        return 'Feedback received!'
    }, 'submitContactForm')
}
