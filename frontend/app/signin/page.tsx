'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AuthService } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { OTPInput } from '@/components/onboarding/otp-input'
import { Turnstile } from '@marsidev/react-turnstile'
import { sendOTPWithTurnstile } from '@/app/actions/send-otp'

type SignInStep = 'email' | 'otp-verify'

export default function SignInPage() {
    const router = useRouter()
    const { signInWithGoogle } = useAuth()
    const [step, setStep] = useState<SignInStep>('email')
    const [email, setEmail] = useState('')
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
                // User is already logged in, redirect to dashboard
                router.push('/dash')
            }
        }
        checkSession()
    }, [router])

    // Pre-fill email from query parameter
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const emailParam = params.get('email')
        if (emailParam) {
            setEmail(emailParam)
        }
    }, [])

    // Step 1: Email entry and auth method selection
    const handleEmailSubmit = async (method: 'google' | 'otp') => {
        if (!email.trim()) {
            setError('Please enter your email')
            return
        }

        setLoading(true)
        setError('')

        if (method === 'google') {
            // Google OAuth sign in via auth context with email hint
            try {
                await signInWithGoogle(email.trim())
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
                setLoading(false)
            }
            // Redirect happens automatically via OAuth
        } else {
            // OTP sign in - require Turnstile first
            if (!turnstileToken) {
                setShowTurnstile(true)
                setLoading(false)
                return
            }

            // Use server action with Turnstile verification
            const result = await sendOTPWithTurnstile(email, turnstileToken)
            if (!result.success) {
                setError(result.error || 'Failed to send verification code')
                setLoading(false)
                // Reset Turnstile on error
                setTurnstileToken(null)
                setShowTurnstile(false)
                return
            }
            setLoading(false)
            setStep('otp-verify')
            // Reset Turnstile after successful send
            setTurnstileToken(null)
            setShowTurnstile(false)
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

        // Check if user has an organization
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
            // Redirect to dashboard
            router.push('/dash')
        } else {
            setError('Failed to establish session')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block mb-4">
                        <ArrowLeft className="w-5 h-5 text-gray-600 hover:text-gray-900" />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
                    <p className="text-gray-600">Sign in to your Pockett account</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                    {step === 'email' && (
                        <div className="space-y-6">
                            <div>
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit('otp')}
                                    placeholder="you@example.com"
                                    className="mt-2"
                                    autoFocus
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Google Sign In */}
                            <Button
                                onClick={() => handleEmailSubmit('google')}
                                disabled={loading || !email.trim()}
                                className="w-full bg-white border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
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

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-4 bg-white text-gray-500">or</span>
                                </div>
                            </div>

                            {/* Email OTP */}
                            <div className="space-y-4">
                                <Button
                                    onClick={() => handleEmailSubmit('otp')}
                                    disabled={loading || !email.trim() || (showTurnstile && !turnstileToken)}
                                    className="w-full"
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

                            {/* Sign up link */}
                            <p className="text-center text-sm text-gray-600">
                                Don't have an account?{' '}
                                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    )}

                    {step === 'otp-verify' && (
                        <div className="space-y-6">
                            <button
                                onClick={() => setStep('email')}
                                className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back
                            </button>

                            <div className="text-center">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Check your email</h2>
                                <p className="text-gray-600">
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
                                className="w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                                    className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
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
                                                // Auto-trigger resend after Turnstile success
                                                handleEmailSubmit('otp')
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
