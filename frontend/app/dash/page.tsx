"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

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
                        console.log('No organization found (null), redirecting to onboarding')
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
                            console.log('Onboarding incomplete, resuming at step:', onboarding.currentStep)
                            router.push('/onboarding')
                            return
                        }

                        console.log('Redirecting to org:', org.slug)
                        router.push(`/o/${org.slug}`)
                        return
                    }
                } else if (response.status === 401) {
                    console.log('Session invalid (401), signing out and redirecting to signin')
                    try {
                        await signOut()
                    } catch (e) {
                        console.error('Sign out failed', e)
                    }
                    router.push('/signin')
                    return
                } else if (response.status === 404) {
                    // Fallback for legacy behavior
                    console.log('No organization found (404), redirecting to onboarding')
                    router.push('/onboarding')
                    return
                }

                // Fallback for other errors
                console.error('Organization check failed', response.status)
                // If it's a server error (500), maybe stay here or retry? 
                // Redirecting to onboarding on 500 is confusing. 
                // Let's only redirect to onboarding on 404 or explicit null.
                if (response.status !== 500) {
                    router.push('/onboarding')
                }

            } catch (err) {
                console.error('Organization check exception', err)
                // Do not redirect blindly on exception
            } finally {
                // Keep loading while redir happens
            }
        }

        checkOrganization()

    }, [user, session, loading, router])

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
            <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin text-slate-400" />
                <p className="text-sm text-slate-500 animate-pulse">
                    {isProvisioning ? 'Setting up your organization ...' : 'Loading...'}
                </p>
            </div>
        </div>
    )
}
