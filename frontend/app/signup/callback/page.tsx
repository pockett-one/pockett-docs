'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthService } from '@/lib/auth-service'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function OnboardingCallbackPage() {
    const router = useRouter()
    const { user, loading } = useAuth()

    useEffect(() => {
        if (loading) return

        if (!user) {
            // No user, redirect to onboarding
            router.push('/dash')
            return
        }

        // User authenticated via Google OAuth
        handleGoogleCallback()
    }, [user, loading])

    const handleGoogleCallback = async () => {
        if (!user) return

        // Get onboarding data from localStorage
        const onboardingData = AuthService.getOnboardingData()

        if (!onboardingData) {
            // No onboarding data, redirect to dashboard
            // Organization should already exist if user is returning
            router.push('/dash')
            return
        }

        // Create organization via API route (not direct Prisma call)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/signup')
                return
            }

            const response = await fetch('/api/organizations', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: onboardingData.email,
                    firstName: onboardingData.firstName,
                    lastName: onboardingData.lastName,
                    organizationName: onboardingData.firstName
                })
            })

            if (!response.ok) {
                throw new Error('Failed to create organization')
            }

            // Clear onboarding data
            AuthService.clearOnboardingData()

            // Redirect to dashboard
            router.push('/dash')
        } catch (error) {
            console.error('Failed to create organization:', error)
            router.push('/dash')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Setting up your organization...</p>
            </div>
        </div>
    )
}
