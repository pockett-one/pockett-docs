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
import { Mail, ArrowLeft, Shield, Lock, ArrowRight } from 'lucide-react'
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
    const [mounted, setMounted] = useState(false)
    const [stepTransition, setStepTransition] = useState<'idle' | 'exiting' | 'entering'>('idle')
    const [emailFocused, setEmailFocused] = useState(false)
    const [continueHovered, setContinueHovered] = useState(false)
    const [clipOrigin, setClipOrigin] = useState({ x: 85, y: 50 })
    const continueButtonRef = useRef<HTMLButtonElement>(null)
    const continueArrowRef = useRef<HTMLSpanElement>(null)

    // Page entrance animation
    useEffect(() => {
        const id = setTimeout(() => setMounted(true), 50)
        return () => clearTimeout(id)
    }, [])

    // Check if user is already logged in
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // User is already logged in, redirect to default organization
                const redirectTo = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null
                const goToOnboarding = redirectTo === '/d/onboarding' || (redirectTo && redirectTo.startsWith('/d/onboarding'))
                if (goToOnboarding && redirectTo) {
                    router.push(redirectTo)
                    return
                }
                try {
                    const response = await fetch('/api/organizations/default-slug', { cache: 'no-store' })
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
                router.push('/d/onboarding')
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

    // Sync email state from input when browser autofill populates the field (autofill often doesn't fire onChange)
    const syncEmailFromInput = () => {
        const value = emailInputRef.current?.value?.trim() ?? ''
        if (value) setEmail(value)
    }
    useEffect(() => {
        const t1 = setTimeout(syncEmailFromInput, 100)
        const t2 = setTimeout(syncEmailFromInput, 400)
        const t3 = setTimeout(syncEmailFromInput, 800)
        const t4 = setTimeout(syncEmailFromInput, 1500)
        const t5 = setTimeout(syncEmailFromInput, 2500)
        const interval = setInterval(syncEmailFromInput, 300)
        const stopInterval = setTimeout(() => clearInterval(interval), 3000)
        return () => {
            clearTimeout(t1)
            clearTimeout(t2)
            clearTimeout(t3)
            clearTimeout(t4)
            clearTimeout(t5)
            clearInterval(interval)
            clearTimeout(stopInterval)
        }
        const stored = getStoredEmail()
        if (stored) setEmail(stored)
    }, [])

    // Continue button hover – compute clip-path origin from arrow icon
    const handleContinueMouseEnter = () => {
        setContinueHovered(true)
        if (!continueArrowRef.current || !continueButtonRef.current) return
        const btnRect = continueButtonRef.current.getBoundingClientRect()
        const arrowRect = continueArrowRef.current.getBoundingClientRect()
        setClipOrigin({
            x: ((arrowRect.left + arrowRect.width / 2 - btnRect.left) / btnRect.width) * 100,
            y: ((arrowRect.top + arrowRect.height / 2 - btnRect.top) / btnRect.height) * 100,
        })
    }

    // Animated step transition
    const animateToStep = (nextStep: SignInStep) => {
        setStepTransition('exiting')
        setTimeout(() => {
            setStep(nextStep)
            setStepTransition('entering')
            setTimeout(() => setStepTransition('idle'), 300)
        }, 200)
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
        setTurnstileToken(null)
        setShowTurnstile(false)
        animateToStep('otp-verify')
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
                redirectTo === '/d/onboarding' || redirectTo.startsWith('/d/onboarding')
            )
            if (isSafeRedirect && redirectTo) {
                const normalized = (redirectTo === '/dash' || redirectTo.startsWith('/dash/')) ? '/d' + (redirectTo === '/dash' ? '' : redirectTo.slice(5)) : redirectTo
                router.push(normalized)
                return
            }

            // Small delay to ensure server-side cookies are propagated after OTP verification
            await new Promise(resolve => setTimeout(resolve, 150))

            try {
                const response = await fetch('/api/organizations/default-slug', { cache: 'no-store' })
                if (response.ok) {
                    const data = await response.json()
                    // If user has an org slug, AND onboarding is complete, redirect to dashboard
                    if (data.slug && data.onboardingComplete) {
                        router.push(`/d/o/${data.slug}`)
                        return
                    }
                }
            } catch {
                // ignore — fall through to onboarding
            }
            router.push('/d/onboarding')
        } else {
            setError('Failed to establish session')
            setLoading(false)
        }
    }

    // Step content transition styles
    const stepContentClass = stepTransition === 'exiting'
        ? 'opacity-0 translate-y-2 transition-all duration-200'
        : stepTransition === 'entering'
            ? 'opacity-0 translate-y-2 animate-[fadeSlideIn_300ms_ease-out_forwards]'
            : ''

    // Floating label: label is "up" when focused or has content
    const emailHasValue = email.length > 0
    const labelFloated = emailFocused || emailHasValue

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-slate-400 selection:text-white relative overflow-hidden flex items-center justify-center p-4">
            {/* Inline keyframes */}
            <style>{`
                @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes focusLineReveal {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
            `}</style>

            <div className={`w-full max-w-md relative z-10 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                {/* Header */}
                <div className={`text-center mb-10 transition-all duration-700 ease-out delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                    <Link href="/" className="inline-block mb-8 hover:opacity-80 transition-opacity">
                        <Logo size="lg" />
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-1.5">Welcome back</h1>
                    <p className="text-slate-500 text-[15px]">Sign in to your account</p>
                </div>

                {/* Card */}
                <div className={`bg-white border border-slate-200/80 rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_24px_rgba(0,0,0,0.04)] p-8 sm:p-10 transition-all duration-700 ease-out delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
                    {step === 'email' && (
                        <div className={`space-y-7 ${stepContentClass}`}>
                            {/* Floating label email input */}
                            <div className="relative">
                                <div className="relative">
                                    <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] pointer-events-none transition-colors duration-200 ${emailFocused ? 'text-slate-700' : 'text-slate-400'}`} />
                                    <input
                                        ref={emailInputRef}
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => { setEmailFocused(false); syncEmailFromInput() }}
                                        onFocus={() => { setEmailFocused(true); syncEmailFromInput() }}
                                        onAnimationStart={(e) => { if (e.animationName) syncEmailFromInput() }}
                                        onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit('otp')}
                                        autoFocus
                                        autoComplete="email"
                                        className="peer w-full h-14 pl-11 pr-4 pt-4 pb-1 text-[15px] text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all duration-200 focus:bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 placeholder-transparent"
                                        placeholder="Email address"
                                    />
                                    {/* Floating label */}
                                    <label
                                        htmlFor="email"
                                        className={`absolute left-11 pointer-events-none transition-all duration-200 ease-out ${labelFloated
                                            ? 'top-2 text-[11px] font-medium text-slate-500'
                                            : 'top-1/2 -translate-y-1/2 text-[15px] text-slate-400'
                                            }`}
                                    >
                                        Email address
                                    </label>
                                    {/* Focus underline accent */}
                                    <div
                                        className="absolute bottom-0 left-3 right-3 h-[2px] bg-slate-900 rounded-full origin-center transition-transform duration-300"
                                        style={{ transform: emailFocused ? 'scaleX(1)' : 'scaleX(0)' }}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Primary action */}
                            <div className="space-y-4">
                                <button
                                    ref={continueButtonRef}
                                    onClick={() => handleEmailSubmit('otp')}
                                    disabled={loading || !email.trim() || (showTurnstile && !turnstileToken)}
                                    onMouseEnter={handleContinueMouseEnter}
                                    onMouseLeave={() => setContinueHovered(false)}
                                    className="group relative w-full h-12 bg-slate-900 border-2 border-slate-900 text-white rounded-xl font-medium text-[15px] transition-all active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none overflow-hidden cursor-pointer"
                                >
                                    {/* Circle fill that expands from arrow */}
                                    <span
                                        className="absolute inset-0 z-0 bg-white"
                                        style={{
                                            clipPath: `circle(${continueHovered && !loading ? '150%' : '0%'} at ${clipOrigin.x}% ${clipOrigin.y}%)`,
                                            transition: 'clip-path 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }}
                                    />
                                    {loading ? (
                                        <span className="relative z-10 flex items-center justify-center">
                                            <LoadingSpinner size="sm" />
                                            <span className="ml-2">Sending code...</span>
                                        </span>
                                    ) : (
                                        <span className="relative z-10 flex items-center justify-center gap-2">
                                            <span className={`transition-colors duration-300 ${continueHovered ? 'text-slate-900' : 'text-white'}`}>
                                                Continue
                                            </span>
                                            <span ref={continueArrowRef}>
                                                <ArrowRight className={`w-4 h-4 transition-all duration-300 group-hover:translate-x-1 ${continueHovered ? 'text-slate-900' : 'text-white'}`} />
                                            </span>
                                        </span>
                                    )}
                                </button>

                                {/* Turnstile */}
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

                            {/* Divider */}
                            <div className="relative py-1">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="px-4 bg-white text-[11px] uppercase tracking-widest text-slate-400 font-medium">or</span>
                                </div>
                            </div>

                            {/* Google OAuth */}
                            <Button
                                onClick={() => handleEmailSubmit('google')}
                                disabled={loading}
                                className="w-full h-12 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 rounded-xl font-medium text-[15px] transition-all active:scale-[0.98]"
                                variant="outline"
                            >
                                <svg className="w-5 h-5 mr-2.5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                {loading ? 'Signing in...' : 'Continue with Google'}
                            </Button>

                            {/* Sign up link */}
                            <p className="text-center text-sm text-slate-400 pt-1">
                                Don&apos;t have an account?{' '}
                                <Link href="/signup" className="text-slate-600 hover:text-slate-900 font-medium hover:underline transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    )}

                    {step === 'otp-verify' && (
                        <div className={`space-y-7 ${stepContentClass}`}>
                            <button
                                onClick={() => animateToStep('email')}
                                className="flex items-center text-sm text-slate-400 hover:text-slate-900 transition-colors group"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-0.5" />
                                Back
                            </button>

                            <div className="text-center">
                                <h2 className="text-xl font-semibold tracking-tight text-slate-900 mb-2">Check your email</h2>
                                <p className="text-slate-500 text-[15px]">
                                    We sent a 6-digit code to <strong className="text-slate-700 font-medium">{email}</strong>
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

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
                                className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-medium text-[15px] transition-all active:scale-[0.98] shadow-sm hover:shadow-md disabled:opacity-50 disabled:shadow-none"
                            >
                                {loading ? (
                                    <>
                                        <LoadingSpinner size="sm" />
                                        <span className="ml-2">Verifying...</span>
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
                                    className="w-full text-sm text-slate-400 hover:text-slate-700 font-medium hover:underline transition-colors"
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

                {/* Trust indicators */}
                <div className={`flex items-center justify-center gap-6 mt-8 transition-all duration-700 ease-out delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 tracking-wide">
                        <Lock className="w-3 h-3" />
                        <span>Encrypted</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200" />
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 tracking-wide">
                        <Shield className="w-3 h-3" />
                        <span>No passwords stored</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
