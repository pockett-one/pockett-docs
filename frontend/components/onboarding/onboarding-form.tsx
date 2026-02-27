'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { isValidEmail, isGoogleEmail, isPotentiallyGoogleWorkspace, generateDefaultOrgName } from '@/lib/email-utils'
import { AuthService } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Mail, ArrowRight } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { OTPInput } from '@/components/onboarding/otp-input'
import { Turnstile } from '@marsidev/react-turnstile'
import { sendOTPWithTurnstile } from '@/app/actions/send-otp'
import { sendEvent, ANALYTICS_EVENTS } from "@/lib/analytics"
import { logger } from '@/lib/logger'

type OnboardingStep = 'info' | 'auth-method' | 'otp-verify'

/**
 * Parse firstname.lastname from email if it matches the pattern.
 * Returns null if pattern doesn't match.
 */
function parseNameFromEmail(email: string): { firstName: string; lastName: string } | null {
    if (!email || !email.includes('@')) return null
    const localPart = email.split('@')[0]
    // Check for firstname.lastname pattern (exactly one dot)
    const parts = localPart.split('.')
    if (parts.length !== 2) return null
    const [first, last] = parts
    if (!first || !last) return null
    // Capitalize first letter of each name
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
    return {
        firstName: capitalize(first),
        lastName: capitalize(last)
    }
}

export function OnboardingForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth()
    const firstNameInputRef = useRef<HTMLInputElement>(null)

    // Form state
    const [step, setStep] = useState<OnboardingStep>('info')
    const [email, setEmail] = useState(searchParams.get('email') || '')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [otpCode, setOtpCode] = useState('')

    // UI state
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
    const [showTurnstile, setShowTurnstile] = useState(false)
    const [emailVerifiedNewUser, setEmailVerifiedNewUser] = useState(false)
    const [isReturningUser, setIsReturningUser] = useState(false) // User exists, OTP already sent

    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // User is already logged in; let onboarding page decide (step 0 / resume / org).
                router.push('/onboarding')
            }
        }
        checkSession()
    }, [router])

    // Handle email check via OTP (called after Turnstile success)
    const handleEmailCheckWithOTP = async (token: string) => {
        setLoading(true)
        setError('')

        try {
            // Send OTP with checkExistingFirst=true to detect existing users
            const result = await sendOTPWithTurnstile(email, token, true)
            
            if (!result.success) {
                setError(result.error || 'Failed to verify email')
                setLoading(false)
                setTurnstileToken(null)
                setShowTurnstile(false)
                return
            }

            if (result.data?.userExists) {
                // Existing user - OTP already sent, go directly to verify
                setIsReturningUser(true)
                setStep('otp-verify')
            } else {
                // New user - show name fields
                const parsedName = parseNameFromEmail(email)
                if (parsedName) {
                    setFirstName(parsedName.firstName)
                    setLastName(parsedName.lastName)
                }
                setEmailVerifiedNewUser(true)
                // Focus firstName field after render
                setTimeout(() => {
                    firstNameInputRef.current?.focus()
                }, 100)
            }
        } catch (err) {
            logger.error('Email check failed', err as Error)
            setError('Something went wrong. Please try again.')
        }

        setLoading(false)
        setTurnstileToken(null)
        setShowTurnstile(false)
    }

    // Step 1: Collect user info
    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email) {
            setError('Please enter your email')
            return
        }
        if (!isValidEmail(email)) {
            setError('Please enter a valid email address')
            return
        }

        // If name fields are already shown, validate and proceed to auth method
        if (emailVerifiedNewUser) {
            if (!firstName?.trim() || !lastName?.trim()) {
                setError('Please enter your first and last name')
                return
            }
            setStep('auth-method')
            return
        }

        // First submission: show Turnstile to verify human before checking email
        if (!turnstileToken) {
            setShowTurnstile(true)
            return
        }

        // Turnstile already verified, proceed with email check
        await handleEmailCheckWithOTP(turnstileToken)
    }

    // Step 2a: Google OAuth
    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')

        const result = await AuthService.signInWithGoogle({
            email,
            firstName,
            lastName
        }, searchParams.get('next'))

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

    // Step 2b: Send OTP with Turnstile protection
    const handleSendOTP = async () => {
        if (!turnstileToken) {
            setShowTurnstile(true)
            return
        }
        await sendOTPWithToken(turnstileToken)
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

        // OTP verified successfully

        // Clear onboarding data
        AuthService.clearOnboardingData()

        const nextRel = searchParams.get('next')

        // Success! Redirect
        sendEvent({
            action: ANALYTICS_EVENTS.SIGN_UP,
            category: 'User',
            label: 'Signup Success',
            method: 'email'
        })

        if (nextRel && nextRel.startsWith('/')) {
            router.push(nextRel)
        } else {
            try {
                const res = await fetch('/api/onboarding/domain-choice')
                if (res.ok) {
                    const data = await res.json()
                    if (data.show) {
                        router.push('/onboarding')
                        return
                    }
                }
            } catch (e) {
                logger.error('Domain-choice check failed', e as Error)
            }
            router.push('/onboarding')
        }
    }

    return (
        <div className="w-full max-w-md mx-auto">
            {/* Progress indicator — always visible; shows current step (1, 2, or 3) */}
            <div className="mb-8">
                <div className="flex items-center justify-center">
                    {(['info', 'auth-method', 'otp-verify'] as const).map((stepKey, idx) => {
                        const stepIndex = ['info', 'auth-method', 'otp-verify'].indexOf(step)
                        const isCompleted = idx < stepIndex
                        const isCurrent = idx === stepIndex
                        const isPending = idx > stepIndex
                        const label = ['Info', 'Auth', 'Verify'][idx]
                        return (
                            <div key={stepKey} className="flex items-center">
                                <div className="flex flex-col items-center">
                                    <div
                                        className={`
                                            w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                                            ${isCurrent ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2' : ''}
                                            ${isCompleted ? 'bg-slate-800 text-white' : ''}
                                            ${isPending ? 'bg-slate-100 text-slate-400' : ''}
                                        `}
                                    >
                                        {idx + 1}
                                    </div>
                                    <span className={`text-xs mt-1.5 font-medium ${isCurrent ? 'text-slate-900' : isCompleted ? 'text-slate-600' : 'text-slate-400'}`}>
                                        {label}
                                    </span>
                                </div>
                                {idx < 2 && (
                                    <div className={`w-12 h-0.5 mx-2 rounded transition-colors ${isCompleted ? 'bg-slate-800' : 'bg-slate-200'}`} />
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

            {/* Step 1: User Info — email only first; after we confirm email is new, show name */}
            {step === 'info' && (
                <form onSubmit={handleInfoSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email" className="text-slate-700">Email</Label>
                        <div className="flex gap-2 mt-1">
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !emailVerifiedNewUser) {
                                        e.preventDefault()
                                        handleInfoSubmit(e)
                                    }
                                }}
                                placeholder="you@example.com"
                                required
                                disabled={!!searchParams.get('email') || emailVerifiedNewUser}
                                className="flex-1 bg-white/50 border-slate-200 focus:border-slate-500 focus:ring-slate-500 disabled:opacity-70 disabled:cursor-not-allowed"
                            />
                            {!emailVerifiedNewUser && (
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={loading || !email.trim()}
                                    className="bg-slate-900 hover:bg-slate-800 text-white h-10 w-10 flex-shrink-0"
                                >
                                    {loading ? <LoadingSpinner size="sm" /> : <ArrowRight className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                        {!emailVerifiedNewUser && (
                            <p className="text-xs text-slate-500 mt-1.5">We&apos;ll check if you already have an account.</p>
                        )}
                        
                        {/* Turnstile - shown after email submitted, before check */}
                        {showTurnstile && step === 'info' && !emailVerifiedNewUser && (
                            <div className="flex justify-center mt-4">
                                <Turnstile
                                    siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                                    onSuccess={(token) => {
                                        setTurnstileToken(token)
                                        // Auto-trigger email check after Turnstile success
                                        handleEmailCheckWithOTP(token)
                                    }}
                                    onError={() => {
                                        setError('Captcha verification failed. Please try again.')
                                        setTurnstileToken(null)
                                        setShowTurnstile(false)
                                    }}
                                    onExpire={() => {
                                        setTurnstileToken(null)
                                        setShowTurnstile(false)
                                    }}
                                />
                            </div>
                        )}
                    </div>
                    {emailVerifiedNewUser && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div>
                                <Label htmlFor="firstName" className="text-slate-700">First Name</Label>
                                <Input
                                    ref={firstNameInputRef}
                                    id="firstName"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="John"
                                    required
                                    className="bg-white/50 border-slate-200 focus:border-slate-500 focus:ring-slate-500"
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
                                    className="bg-white/50 border-slate-200 focus:border-slate-500 focus:ring-slate-500"
                                />
                            </div>
                        </div>
                    )}
                    {emailVerifiedNewUser && (
                        <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all" disabled={loading}>
                            {loading ? <LoadingSpinner size="sm" /> : <><span>Continue</span><ArrowRight className="ml-2 h-4 w-4" /></>}
                        </Button>
                    )}
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

                    {/* Email OTP - Primary action, always available */}
                    <div className="space-y-4">
                        <Button
                            onClick={handleSendOTP}
                            disabled={loading || (showTurnstile && !turnstileToken)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                        >
                            {loading ? (
                                <LoadingSpinner size="sm" />
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

                    {/* Divider - Show only if Google option is visible */}
                    {(isGoogleEmail(email) || isPotentiallyGoogleWorkspace(email)) && (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-slate-500">or</span>
                            </div>
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
                                <LoadingSpinner size="sm" />
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
                </div>
            )}

            {/* Step 3: OTP Verification */}
            {step === 'otp-verify' && (
                <div className="space-y-6">
                    <div className="text-center">
                        {isReturningUser ? (
                            <>
                                <h2 className="text-xl font-semibold text-slate-900 mb-2">Welcome back!</h2>
                                <p className="text-sm text-slate-600">
                                    We found your account. Enter the code sent to <strong>{email}</strong>
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-xl font-semibold text-slate-900 mb-2">Check your email</h2>
                                <p className="text-sm text-slate-600">
                                    We sent a 6-digit code to <strong>{email}</strong>
                                </p>
                            </>
                        )}
                    </div>

                    <OTPInput
                        value={otpCode}
                        onChange={setOtpCode}
                        onComplete={(code) => handleVerifyOTP(code)}
                        disabled={loading}
                        loading={loading}
                    />

                    <Button
                        onClick={() => handleVerifyOTP()}
                        disabled={loading || otpCode.length !== 6}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white transition-all"
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

                    <div className="text-center space-y-4">
                        <button
                            onClick={() => {
                                setTurnstileToken(null)
                                setShowTurnstile(true)
                            }}
                            disabled={loading}
                            className="text-sm text-slate-600 hover:text-slate-800 font-medium hover:underline"
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
