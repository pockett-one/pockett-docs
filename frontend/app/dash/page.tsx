"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { logger } from '@/lib/logger'
import { LoadingSpinner } from "@/components/ui/loading-spinner"

/**
 * /dash Dispatcher Page
 * 
 * This page is the landing point after login.
 * It is responsible for:
 * 1. Waiting for Auth to be ready.
 * 2. Calling the Provisioning API to ensure the user has a workspace.
 * 3. Redirecting the user to their specific Organization Workspace URL (/o/[slug]).
 */
export default function DashDispatcherPage() {
    const { user, session, loading, signOut } = useAuth()
    const router = useRouter()
    const [isProvisioning, setIsProvisioning] = useState(false)

    useEffect(() => {
        if (loading) return

        if (!user || !session) {
            router.push('/signin')
            return
        }

        const checkOrganization = async () => {
            setIsProvisioning(true)
            try {
                // Check if user has an existing default organization
                const response = await fetch('/api/organization', {
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()

                    // Handle API returning { organization: null } instead of 404
                    if (data.organization === null) {
                        logger.debug('No organization found (null), redirecting to onboarding')
                        router.push('/onboarding')
                        return
                    }

                    // Handle direct organization object return (legacy/standard) or { organization: {...} }
                    const org = data.organization || data

                    if (org && org.slug) {
                        // Check Onboarding Status
                        const settings = org.settings as any
                        const onboarding = settings?.onboarding

                        if (onboarding && onboarding.isComplete === false) {
                            logger.debug('Onboarding incomplete, resuming at step:', onboarding.currentStep)
                            router.push('/onboarding')
                            return
                        }

                        logger.debug('Redirecting to org:', org.slug)
                        router.push(`/o/${org.slug}`)
                        return
                    }
                } else if (response.status === 401) {
                    logger.debug('Session invalid (401), signing out and redirecting to signin')
                    try {
                        await signOut()
                    } catch (e) {
                        logger.error('Sign out failed', e as Error)
                    }
                    router.push('/signin')
                    return
                } else if (response.status === 404) {
                    // Fallback for legacy behavior
                    logger.debug('No organization found (404), redirecting to onboarding')
                    router.push('/onboarding')
                    return
                }

                // Fallback for other errors
                logger.error('Organization check failed', new Error(`Status: ${response.status}`))
                // If it's a server error (500), maybe stay here or retry? 
                // Redirecting to onboarding on 500 is confusing. 
                // Let's only redirect to onboarding on 404 or explicit null.
                if (response.status !== 500) {
                    router.push('/onboarding')
                }

            } catch (err) {
                logger.error('Organization check exception', err as Error)
                // Do not redirect blindly on exception
            } finally {
                // Keep loading while redir happens
            }
        }

        checkOrganization()

    }, [user, session, loading, router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="flex flex-col items-center space-y-6">
                <LoadingSpinner
                    message={isProvisioning ? 'Setting up your workspace' : 'Loading'}
                    showDots={true}
                    size="lg"
                />
            </div>
        </div>
    )
}
