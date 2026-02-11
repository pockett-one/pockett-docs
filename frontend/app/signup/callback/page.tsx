'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthService } from '@/lib/auth-service'
// import { Loader2 } from 'lucide-react'
import { LoadingSpinner } from "@/components/ui/loading-spinner"

// Wrap in Suspense because usage of searchParams
function CallbackContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading } = useAuth()

    useEffect(() => {
        console.log('[Callback] State check. Loading:', loading, 'User:', !!user)

        if (loading) return

        if (!user) {
            console.log('[Callback] No user found, redirecting to signin')
            router.push('/signin')
            return
        }

        // Just handle redirection logic
        console.log('[Callback] User authenticated. Clearing onboarding data.')
        AuthService.clearOnboardingData()

        const next = searchParams.get('next')
        console.log('[Callback] Next param:', next)

        if (next && next.startsWith('/')) {
            console.log('[Callback] Redirecting to next:', next)
            router.push(next)
        } else {
            // Redirect to default organization if available, otherwise to /d
            // Fetch default org slug via API call
            try {
                const response = await fetch('/api/organizations/default-slug')
                if (response.ok) {
                    const data = await response.json()
                    if (data.slug) {
                        console.log('[Callback] Redirecting to default organization:', data.slug)
                        router.push(`/d/o/${data.slug}`)
                        return
                    }
                }
            } catch (error) {
                console.error('[Callback] Failed to fetch default org slug:', error)
            }
            // Fallback to organizations list
            console.log('[Callback] No default org, redirecting to organizations list')
            router.push('/d')
        }
    }, [user, loading, router, searchParams])

    // Fallback watchdog
    useEffect(() => {
        const timer = setTimeout(() => {
            console.warn('[Callback] Watchdog: stuck for 8s. Loading:', loading, 'User:', !!user)
            if (!loading && user) {
                // Force redirect
                const next = searchParams.get('next')
                const target = (next && next.startsWith('/')) ? next : '/d'
                // Use window.location as hard refresh/navigation if router hangs
                window.location.href = target
            } else if (!loading && !user) {
                router.push('/signin')
            }
        }, 8000)
        return () => clearTimeout(timer)
    }, [loading, user, router, searchParams])

    return (
        <div className="min-h-screen flex items-center justify-center">
            <LoadingSpinner
                message="Completing sign up..."
                showDots={true}
                size="lg"
            />
        </div>
    )
}

export default function OnboardingCallbackPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
            <CallbackContent />
        </Suspense>
    )
}
