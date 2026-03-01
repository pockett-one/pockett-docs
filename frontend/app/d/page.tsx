'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { OrganizationsView } from '@/components/projects/organizations-view'

export default function OrganizationsPage() {
    const router = useRouter()

    useEffect(() => {
        const checkOrganizations = async () => {
            try {
                // Check if user is authenticated via the organization endpoint
                const userCheckResponse = await fetch('/api/organization')
                console.log('[/d] Organization API response status:', userCheckResponse.status)

                if (!userCheckResponse.ok) {
                    console.log('[/d] API not ok, redirecting to', userCheckResponse.status === 401 ? '/signin' : '/d/onboarding')
                    if (userCheckResponse.status === 401) {
                        router.push('/signin')
                    } else {
                        router.push('/d/onboarding')
                    }
                    return
                }

                const data = await userCheckResponse.json()
                console.log('[/d] Organization data:', data)

                if (!data.organization) {
                    // No org - redirect to onboarding
                    console.log('[/d] No organization, redirecting to onboarding')
                    router.push('/d/onboarding')
                    return
                }

                // Check if onboarding is complete
                const org = data.organization
                const settings = org.settings as any
                const onboarding = settings?.onboarding

                console.log('[/d] Organization:', org.name, 'Onboarding complete:', onboarding?.isComplete)

                if (!onboarding?.isComplete) {
                    // Onboarding not complete - redirect to onboarding
                    console.log('[/d] Onboarding not complete, redirecting to onboarding')
                    router.push('/d/onboarding')
                    return
                }

                // User has organization and onboarding is complete, page will render
                console.log('[/d] Onboarding complete, rendering organizations page')
            } catch (error) {
                console.error('[/d] Error checking organizations:', error)
                router.push('/d/onboarding')
            }
        }

        checkOrganizations()
    }, [router])

    return (
        <div className="h-full flex flex-col">
            <OrganizationsView organizations={[]} />
        </div>
    )
}
