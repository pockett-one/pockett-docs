'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AuthService } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { sendOTPWithTurnstile } from '@/app/actions/send-otp'
import { sendEvent, ANALYTICS_EVENTS } from '@/lib/analytics'

export const SIGNIN_EMAIL_KEY = 'fm_signin_email'

export type SignInStep = 'email' | 'otp-verify'

function getStoredEmail(): string {
  if (typeof window === 'undefined') return ''
  try {
    return sessionStorage.getItem(SIGNIN_EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

export function useSignInFlow() {
  const router = useRouter()
  const { signInWithGoogle } = useAuth()
  const [step, setStep] = useState<SignInStep>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [showTurnstile, setShowTurnstile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [stepTransition, setStepTransition] = useState<'idle' | 'exiting' | 'entering'>('idle')

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 50)
    return () => clearTimeout(id)
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const redirectTo = params?.get('redirect') || params?.get('next') || null
        const isSafe = redirectTo && redirectTo.startsWith('/')
        if (isSafe && redirectTo) {
          router.push(redirectTo)
          return
        }
        try {
          const response = await fetch('/api/firms/default-slug', { cache: 'no-store' })
          if (response.ok) {
            const data = await response.json()
            if (data.slug && data.onboardingComplete) {
              router.push(`/d/f/${data.slug}`)
              return
            }
          }
        } catch (err) {
          console.error('Failed to fetch default org slug:', err)
        }
        router.push('/d/onboarding')
      }
    }
    checkSession()
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get('email')
    if (emailParam) {
      setEmail(emailParam)
      try {
        sessionStorage.setItem(SIGNIN_EMAIL_KEY, emailParam)
      } catch {
        /* ignore */
      }
      return
    }
    const stored = getStoredEmail()
    if (stored) setEmail(stored)
  }, [])

  useEffect(() => {
    if (!email) return
    try {
      sessionStorage.setItem(SIGNIN_EMAIL_KEY, email)
    } catch {
      /* ignore */
    }
  }, [email])

  const animateToStep = useCallback((nextStep: SignInStep) => {
    setStepTransition('exiting')
    setTimeout(() => {
      setStep(nextStep)
      setStepTransition('entering')
      setTimeout(() => setStepTransition('idle'), 300)
    }, 200)
  }, [])

  const sendOTPWithToken = useCallback(
    async (token: string) => {
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
    },
    [email, animateToStep],
  )

  const handleEmailSubmit = useCallback(
    async (method: 'google' | 'otp') => {
      if (!email.trim()) {
        setError('Please enter your email')
        return
      }

      setError('')

      if (method === 'google') {
        setGoogleLoading(true)
        try {
          const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
          const nextParam = params?.get('redirect') || params?.get('next') || undefined
          await signInWithGoogle(email.trim(), nextParam)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
          setGoogleLoading(false)
        }
        sendEvent({
          action: ANALYTICS_EVENTS.LOGIN,
          category: 'User',
          label: 'Login Success',
          method: 'google',
        })
      } else {
        if (!turnstileToken) {
          setShowTurnstile(true)
          return
        }
        setLoading(true)
        await sendOTPWithToken(turnstileToken)
      }
    },
    [email, signInWithGoogle, turnstileToken, sendOTPWithToken],
  )

  const handleVerifyOTP = useCallback(
    async (codeOverride?: string) => {
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

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        sendEvent({
          action: ANALYTICS_EVENTS.LOGIN,
          category: 'User',
          label: 'Login Success',
          method: 'otp',
        })
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
        const redirectTo = params?.get('redirect') || params?.get('next') || null
        const isSafeRedirect = redirectTo && redirectTo.startsWith('/')
        if (isSafeRedirect && redirectTo) {
          const normalized =
            redirectTo === '/dash' || redirectTo.startsWith('/dash/')
              ? '/d' + (redirectTo === '/dash' ? '' : redirectTo.slice(5))
              : redirectTo
          window.location.href = normalized
          return
        }

        await new Promise((resolve) => setTimeout(resolve, 150))

        try {
          const response = await fetch('/api/firms/default-slug', { cache: 'no-store' })
          if (response.ok) {
            const data = await response.json()
            if (data.slug && data.onboardingComplete) {
              window.location.href = `/d/f/${data.slug}`
              return
            }
          }
        } catch {
          /* fall through */
        }
        window.location.href = '/d/onboarding'
      } else {
        setError('Failed to establish session')
        setLoading(false)
      }
    },
    [email, otpCode],
  )

  const stepContentClass =
    stepTransition === 'exiting'
      ? 'opacity-0 translate-y-2 transition-all duration-200'
      : stepTransition === 'entering'
        ? 'opacity-0 translate-y-2 animate-[signinFadeSlideIn_300ms_ease-out_forwards]'
        : ''

  return {
    step,
    email,
    setEmail,
    otpCode,
    setOtpCode,
    loading,
    googleLoading,
    error,
    setError,
    turnstileToken,
    setTurnstileToken,
    showTurnstile,
    setShowTurnstile,
    mounted,
    stepContentClass,
    animateToStep,
    sendOTPWithToken,
    handleEmailSubmit,
    handleVerifyOTP,
  }
}
