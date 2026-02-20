'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthService } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react'
import { OTPInput } from '@/components/onboarding/otp-input'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Turnstile } from '@marsidev/react-turnstile'
import { sendOTPWithTurnstile } from '@/app/actions/send-otp'
import { sendEvent, ANALYTICS_EVENTS } from "@/lib/analytics"

const SIGNIN_EMAIL_KEY = 'pockett_signin_email'

type SignInStep = 'email' | 'otp-verify'

function getStoredEmail(): string {
    if (typeof window === 'undefined') return ''
    try {
        return sessionStorage.getItem(SIGNIN_EMAIL_KEY) || ''
    } catch {
        return ''
    }
}

export default function SignInPage() {
    const router = useRouter()
    const { signInWithGoogle } = useAuth()
    const [step, setStep] = useState<SignInStep>('email')
    const [email, setEmail] = useState('')
    const emailInputRef = useRef<HTMLInputElement>(null)
    const [otpCode, setOtpCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
    const [showTurnstile, setShowTurnstile] = useState(false)

    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // User is already logged in, redirect to default organization
                const redirectTo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
                const goToOnboarding = redirectTo === '/onboarding' || (redirectTo && redirectTo.startsWith('/onboarding'))
                if (goToOnboarding && redirectTo) {
                    router.push(redirectTo)
                    return
                }
                try {
                    const response = await fetch('/api/organizations/default-slug')
                    if (response.ok) {
                        const data = await response.json()
                        if (data.slug && data.onboardingComplete) {
                            router.push(`/d/o/${data.slug}`)
                            return
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch default org slug:', error)
                }
                router.push('/onboarding')
            }
        }
        checkSession()
    }, [router])

    // Pre-fill email from query parameter, or restore from session (survives remount/refresh)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const emailParam = params.get('email')
        if (emailParam) {
            setEmail(emailParam)
            try {
                sessionStorage.setItem(SIGNIN_EMAIL_KEY, emailParam)
            } catch { /* ignore */ }
            return
        }
        const stored = getStoredEmail()
        if (stored) setEmail(stored)
    }, [])

    // Persist email so it survives remounts (e.g. after restart / first load)
    useEffect(() => {
        if (!email) return
        try {
            sessionStorage.setItem(SIGNIN_EMAIL_KEY, email)
        } catch { /* ignore */ }
    }, [email])

    // Send OTP using a Turnstile token (used by button and by Turnstile onSuccess to avoid double-click)
    const sendOTPWithToken = async (token: string) => {
        setLoading(true)
        setError('')
        const result = await sendOTPWithTurnstile(email, token)
        if (!result.success) {
            setError(result.error || 'Failed to send verification code')
            setLoading(false)
            setTurnstileToken(null)
            setShowTurnstile(false)
            return
        }
        setLoading(false)
        setStep('otp-verify')
        setTurnstileToken(null)
        setShowTurnstile(false)
    }

    // Step 1: Email entry and auth method selection
    const handleEmailSubmit = async (method: 'google' | 'otp') => {
        if (!email.trim()) {
            setError('Please enter your email')
            return
        }

        setError('')

        if (method === 'google') {
            setLoading(true)
            // Google OAuth sign in via auth context with email hint
            try {
                await signInWithGoogle(email.trim())
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
                setLoading(false)
            }
            // Redirect happens automatically via OAuth
            sendEvent({
                action: ANALYTICS_EVENTS.LOGIN,
                category: 'User',
                label: 'Login Success',
                method: 'google'
            })
        } else {
            // OTP: if no Turnstile token yet, show widget; when user completes it, onSuccess will auto-send
            if (!turnstileToken) {
                setShowTurnstile(true)
                return
            }
            setLoading(true)
            await sendOTPWithToken(turnstileToken)
        }
    }

    // Step 2: Verify OTP
    const handleVerifyOTP = async (codeOverride?: string) => {
        setLoading(true)
        setError('')

        const codeToVerify = (codeOverride || otpCode).trim()

        if (codeToVerify.length !== 6) {
            setError('Please enter the 6-digit code')
            setLoading(false)
            return
        }

        const result = await AuthService.verifyOTP(email, codeToVerify)

        if (!result.success) {
            setError(result.error || 'Invalid verification code')
            setLoading(false)
            return
        }

        // Check if user has an organization and redirect (respect redirect param, normalize /dash → /d)
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            sendEvent({
                action: ANALYTICS_EVENTS.LOGIN,
                category: 'User',
                label: 'Login Success',
                method: 'otp'
            })
            const redirectTo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
            const isSafeRedirect = redirectTo && redirectTo.startsWith('/') && (
                redirectTo === '/d' || redirectTo.startsWith('/d/o/') || redirectTo.startsWith('/d/') ||
                redirectTo === '/dash' || redirectTo.startsWith('/dash/') ||
                redirectTo === '/onboarding' || redirectTo.startsWith('/onboarding')
            )
            if (isSafeRedirect && redirectTo) {
                const normalized = (redirectTo === '/dash' || redirectTo.startsWith('/dash/')) ? '/d' + (redirectTo === '/dash' ? '' : redirectTo.slice(5)) : redirectTo
                router.push(normalized)
                return
            }
            try {
                const response = await fetch('/api/organizations/default-slug')
                if (response.ok) {
                    const data = await response.json()
                    if (data.slug && data.onboardingComplete) {
                        router.push(`/d/o/${data.slug}`)
                        return
                    }
                }
            } catch {
                // ignore
            }
            router.push('/onboarding')
        } else {
            setError('Failed to establish session')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-400 selection:text-white relative overflow-hidden flex items-center justify-center p-4">
            <div className="w-full max-w-md relative z-10">
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
                        <Logo size="lg" />
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
                    <p className="text-slate-600">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                    {step === 'email' && (
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="email" className="text-slate-700">Email address</Label>
                                <Input
                                    ref={emailInputRef}
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit('otp')}
                                    placeholder="you@example.com"
                                    className="mt-2 bg-white border border-slate-200 focus:border-slate-500 focus:ring-slate-500"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Email OTP - Primary action */}
                            <div className="space-y-4">
                                <Button
                                    onClick={() => handleEmailSubmit('otp')}
                                    disabled={loading || !email.trim() || (showTurnstile && !turnstileToken)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                                >
                                    <Mail className="w-4 h-4 mr-2" />
                                    {loading ? 'Sending code...' : 'Continue with Email'}
                                </Button>

                                {/* Turnstile - Only shown when email OTP is clicked */}
                                {showTurnstile && (
                                    <div className="flex justify-center">
                                        <Turnstile
                                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                            onSuccess={(token) => {
                                                setTurnstileToken(token)
                                                setError('')
                                                // Auto-send OTP so user doesn't have to click "Continue with Email" again
                                                sendOTPWithToken(token)
                                            }}
                                            onError={() => {
                                                setError('Captcha verification failed. Please try again.')
                                                setTurnstileToken(null)
                                            }}
                                            onExpire={() => {
                                                setTurnstileToken(null)
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-slate-500">or</span>
                                </div>
                            </div>

                            {/* Social/OAuth Sign In Options */}
                            <Button
                                onClick={() => handleEmailSubmit('google')}
                                disabled={loading}
                                className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all"
                                variant="outline"
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </Button>

                            {/* Sign up link */}
                            <p className="text-center text-sm text-slate-600">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-slate-600 hover:text-slate-800 font-medium hover:underline">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    )}

                    {step === 'otp-verify' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setStep('email')}
                                className="flex items-center text-sm text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back
                            </button>

                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
                                <p className="text-slate-600">
                                    We sent a 6-digit code to <strong>{email}</strong>
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <OTPInput
                                value={otpCode}
                                onChange={setOtpCode}
                                onComplete={(code) => handleVerifyOTP(code)}
                                disabled={loading}
                            />

                            <Button
                                onClick={() => handleVerifyOTP()}
                                disabled={loading || otpCode.length !== 6}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        Verifying...
                                    </>
                                ) : (
                                    'Verify Code'
                                )}
                            </Button>

                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        setTurnstileToken(null)
                                        setShowTurnstile(true)
                                    }}
                                    disabled={loading}
                                    className="w-full text-sm text-slate-600 hover:text-slate-800 font-medium hover:underline"
                                >
                                    Resend code
                                </button>

                                {/* Turnstile for resend */}
                                {showTurnstile && step === 'otp-verify' && (
                                    <div className="flex justify-center">
                                        <Turnstile
                                            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                            onSuccess={(token) => {
                                                setTurnstileToken(token)
                                                // Auto-trigger resend after Turnstile success (stays on otp-verify step)
                                                sendOTPWithToken(token)
                                            }}
                                            onError={() => {
                                                setError('Captcha verification failed. Please try again.')
                                                setTurnstileToken(null)
                                            }}
                                            onExpire={() => {
                                                setTurnstileToken(null)
                                            }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
