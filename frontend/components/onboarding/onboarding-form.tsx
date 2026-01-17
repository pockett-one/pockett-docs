'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidEmail, isGoogleEmail, isPotentiallyGoogleWorkspace, generateDefaultOrgName } from '@/lib/email-utils'
import { AuthService } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Mail, ArrowRight, Loader2 } from 'lucide-react'
import { OTPInput } from '@/components/onboarding/otp-input'
import { Turnstile } from '@marsidev/react-turnstile'
import { sendOTPWithTurnstile } from '@/app/actions/send-otp'
import { sendEvent, ANALYTICS_EVENTS } from "@/lib/analytics"

type OnboardingStep = 'info' | 'auth-method' | 'otp-verify'

export function OnboardingForm() {
    const router = useRouter()
    const { user } = useAuth()

    // Form state
    const [step, setStep] = useState<OnboardingStep>('info')
    const [email, setEmail] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [otpCode, setOtpCode] = useState('')

    // UI state
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
    const [showGoogleOption, setShowGoogleOption] = useState(false)
    const [showOTPOption, setShowOTPOption] = useState(false)

    // Step 1: Collect user info and check if user exists
    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validation
        if (!email || !firstName || !lastName) {
            setError('All fields are required')
            return
        }

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address')
            return
        }

        setLoading(true)

        // Check if user already exists by attempting to get user with this email
        try {
            // Try to check if email exists in auth system
            const { data: existingUsers } = await supabase.auth.admin.listUsers()
            const userExists = existingUsers?.users?.some(u => u.email === email.toLowerCase())

            if (userExists) {
                setError('This email is already registered. Redirecting to sign in...')
                setTimeout(() => {
                    router.push(`/signin?email=${encodeURIComponent(email)}`)
                }, 2000)
                return
            }
        } catch (err) {
            // If we can't check (e.g., no admin access), continue anyway
            console.log('Could not check existing users, continuing with signup')
        }

        setLoading(false)

        // Detect Google account for auth method selection
        const isGoogle = isGoogleEmail(email)
        const mightBeWorkspace = isPotentiallyGoogleWorkspace(email)

        setStep('auth-method')
    }

    // Step 2a: Google OAuth
    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')

        const result = await AuthService.signInWithGoogle({
            email,
            firstName,
            lastName
        })

        if (!result.success) {
            setError(result.error || 'Failed to sign in with Google')
            setLoading(false)
            return
        }

        // Redirect will happen automatically
        sendEvent({
            action: ANALYTICS_EVENTS.SIGN_UP,
            category: 'User',
            label: 'Signup Success',
            method: 'google'
        })
    }

    // Step 2b: Send OTP with Turnstile protection
    const handleSendOTP = async () => {
        // Show Turnstile if not already verified
        if (!turnstileToken) {
            setShowTurnstile(true)
            return
        }

        setLoading(true)
        setError('')

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

    // Step 3: Verify OTP and create organization
    const handleVerifyOTP = async (codeOverride?: string) => {
        setLoading(true)
        setError('')

        // Use override code if provided (from onComplete), otherwise use state
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

        // OTP verified successfully - now create organization automatically
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                setError('Failed to establish session')
                setLoading(false)
                return
            }

            // Create organization with user's first name as default
            const response = await fetch('/api/organizations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    firstName,
                    lastName,
                    organizationName: firstName // Use first name as default
                })
            })

            if (!response.ok) {
                throw new Error('Failed to create organization')
            }

            // Clear onboarding data
            AuthService.clearOnboardingData()

            // Success! Redirect to dashboard
            sendEvent({
                action: ANALYTICS_EVENTS.SIGN_UP,
                category: 'User',
                label: 'Signup Success',
                method: 'email'
            })
            router.push('/dash')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create organization')
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Progress indicator */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    {['Info', 'Auth', 'Verify', 'Setup'].map((label, idx) => {
                        const stepIndex = ['info', 'auth-method', 'otp-verify', 'org-setup'].indexOf(step)
                        const isActive = idx <= stepIndex
                        return (
                            <div key={label} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
                                    }`}>
                                    {idx + 1}
                                </div>
                                {idx < 3 && (
                                    <div className={`w-12 h-0.5 transition-colors ${isActive ? 'bg-purple-600' : 'bg-slate-100'}`} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 animate-in fade-in slide-in-from-top-2">
                    {error}
                </div>
            )}

            {/* Step 1: User Info */}
            {step === 'info' && (
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="text-slate-700">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="bg-white/50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                required
                                className="bg-white/50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>

                        <div>
                            <Label htmlFor="lastName" className="text-slate-700">Last Name</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                required
                                className="bg-white/50 border-slate-200 focus:border-purple-500 focus:ring-purple-500"
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all">
                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </form>
            )}

            {/* Step 2: Auth Method Selection */}
            {step === 'auth-method' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Choose authentication method</h2>
                        <p className="text-sm text-slate-600">
                            How would you like to sign in?
                        </p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Google OAuth - Show for Google emails or potential workspace emails */}
                    {(isGoogleEmail(email) || isPotentiallyGoogleWorkspace(email)) && (
                        <Button
                            onClick={handleGoogleSignIn}
                            disabled={loading}
                            variant="outline"
                            className="w-full bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            Continue with Google
                        </Button>
                    )}

                    {/* Divider - Show only if Google option is visible */}
                    {(isGoogleEmail(email) || isPotentiallyGoogleWorkspace(email)) && (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">Or</span>
                            </div>
                        </div>
                    )}

                    {/* Email OTP - Always available */}
                    <div className="space-y-4">
                        <Button
                            onClick={handleSendOTP}
                            disabled={loading || (showTurnstile && !turnstileToken)}
                            variant="outline"
                            className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Mail className="mr-2 h-4 w-4" />
                            )}
                            Continue with Email Code
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
                </div>
            )}

            {/* Step 3: OTP Verification */}
            {step === 'otp-verify' && (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
                        <p className="text-sm text-slate-600">
                            We sent a 6-digit code to <strong>{email}</strong>
                        </p>
                    </div>

                    <OTPInput
                        value={otpCode}
                        onChange={setOtpCode}
                        onComplete={(code) => handleVerifyOTP(code)}
                        disabled={loading}
                    />

                    <Button
                        onClick={() => handleVerifyOTP()}
                        disabled={loading || otpCode.length !== 6}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all"
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

                    <div className="text-center space-y-4">
                        <button
                            onClick={() => {
                                setTurnstileToken(null)
                                setShowTurnstile(true)
                            }}
                            disabled={loading}
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium hover:underline"
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
                                        handleSendOTP()
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
    )
}
