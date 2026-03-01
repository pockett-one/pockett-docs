"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { CheckCircle2, ArrowRight, Building2, LogIn, PlusCircle, Settings, Lock, AlertCircle, Users, Briefcase } from "lucide-react"
import { GoogleDriveIcon } from "@/components/ui/google-drive-icon"
import {
    joinOrganizationByDomain,
    type DomainOnboardingOptions,
    type DomainOrgOption
} from "@/lib/actions/domain-onboarding"
import { useOnboarding } from "@/lib/onboarding-context"
import { createTestOrganization } from "@/lib/services/test-org-generator"
import { detectAllOrganizations, importMultipleOrganizations } from "@/lib/services/auto-import"
import { BRAND_NAME } from "@/config/brand"
import { logger } from '@/lib/logger'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase } from "@/lib/supabase"

/**
 * Get current access token.
 * Calls getUser() first (server-side verification) to satisfy Supabase's security recommendation,
 * then reads the session token. Each API call also verifies the token server-side.
 */
async function getAccessToken(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

const OnboardingContent = () => {
    const { session, user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setOnboarding, markStepSkipped } = useOnboarding()

    // Refs to prevent duplicate calls
    const initialCheckDoneRef = useRef(false)
    const detectOrgsDoneRef = useRef(false)

    // State
    const [step, setStep] = useState<number | null>(null) // Start null to show loader
    const [isLoading, setIsLoading] = useState(true) // Global loading for initial check
    const [isSubmitting, setIsSubmitting] = useState(false) // For form submission
    const [error, setError] = useState<string | null>(null)

    // Step 0: Domain Choice
    const [domainOptions, setDomainOptions] = useState<DomainOnboardingOptions | null>(null)
    const [domainJoiningId, setDomainJoiningId] = useState<string | null>(null)
    const [domainError, setDomainError] = useState<string | null>(null)

    // Step 1: Google Drive Connection
    const [authUrl, setAuthUrl] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionDetails, setConnectionDetails] = useState<{ accessToken?: string, connectionId?: string, clientId?: string } | null>(null)
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null)

    // Step 3: Organization Setup & Auto-Import
    const [orgName, setOrgName] = useState("")
    const [detectedOrgs, setDetectedOrgs] = useState<any[]>([])
    const [detectedOrgsLoading, setDetectedOrgsLoading] = useState(false)
    const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
    const [importingOrgs, setImportingOrgs] = useState(false)
    const [newOrgCreated, setNewOrgCreated] = useState(false)
    const [newOrgSlug, setNewOrgSlug] = useState("")
    const [defaultOrgSlug, setDefaultOrgSlug] = useState("")
    const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

    // Step 4: Client Setup
    const [clientName, setClientName] = useState("")
    const [creatingClient, setCreatingClient] = useState(false)
    const [clientCreated, setClientCreated] = useState(false)
    const [createdClientId, setCreatedClientId] = useState<string | null>(null)
    const [createTestClient, setCreateTestClient] = useState(true)
    const [createMyClient, setCreateMyClient] = useState(true)

    // Step 5: Project Setup
    const [projectName, setProjectName] = useState("")
    const [creatingProject, setCreatingProject] = useState(false)
    const [createTestProject, setCreateTestProject] = useState(true)
    const [createMyProject, setCreateMyProject] = useState(true)

    // General
    const [existingOrg, setExistingOrg] = useState<any>(null)
    const [isFinalizing, setIsFinalizing] = useState(false)

    const handleFinish = async () => {
        // If we have the default org slug in state, use it directly
        if (defaultOrgSlug) {
            router.push(`/d/o/${defaultOrgSlug}`)
            return
        }

        // Otherwise, fetch the user's default org slug
        const token = await getAccessToken()
        if (token) {
            try {
                const res = await fetch('/api/organization', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    const org = data.organization
                    if (org?.slug) {
                        router.push(`/d/o/${org.slug}`)
                        return
                    }
                }
            } catch (e) {
                logger.error("Failed to fetch org for redirect", e as Error)
            }
        }

        // Fallback to /d if all else fails
        router.push('/d')
    }

    const handleConnectDrive = () => {
        if (authUrl) {
            window.location.href = authUrl
        }
    }

    const handleContinueClients = async () => {
        if (createMyClient && !clientName.trim()) {
            setError('Please enter a client name, or uncheck "Add my own client"')
            return
        }

        setCreatingClient(true)
        setError(null)

        try {
            const token = await getAccessToken()
            if (!token) {
                setError('Session expired. Please sign in again.')
                return
            }

            let lastClientId: string | null = null

            if (createTestClient) {
                const res = await fetch('/api/onboarding/create-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ organizationId: createdOrgId, name: 'Sample Client' })
                })
                if (res.ok) { const d = await res.json(); lastClientId = d.clientId }
            }

            if (createMyClient && clientName.trim()) {
                const res = await fetch('/api/onboarding/create-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ organizationId: createdOrgId, name: clientName.trim() })
                })
                if (res.ok) { const d = await res.json(); lastClientId = d.clientId }
            }

            if (lastClientId) {
                setCreatedClientId(lastClientId)
                setClientCreated(true)
            } else {
                markStepSkipped(4)
            }

            setStep(5)
        } catch (err: any) {
            setError(err.message || 'Failed to create client')
            logger.error('Error creating client', err as Error)
        } finally {
            setCreatingClient(false)
        }
    }

    const handleContinueProjects = async () => {
        if (!clientCreated) { await handleFinish(); return }

        if (createMyProject && !projectName.trim()) {
            setError('Please enter a project name, or uncheck "Add my own project"')
            return
        }

        setCreatingProject(true)
        setError(null)

        try {
            const token = await getAccessToken()
            if (!token) {
                setError('Session expired. Please sign in again.')
                return
            }

            if (createTestProject) {
                await fetch('/api/onboarding/create-project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ organizationId: createdOrgId, clientId: createdClientId, name: 'Sample Project' })
                })
            }

            if (createMyProject && projectName.trim()) {
                await fetch('/api/onboarding/create-project', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ organizationId: createdOrgId, clientId: createdClientId, name: projectName.trim() })
                })
            }

            if (!createTestProject && !createMyProject) markStepSkipped(5)

            await handleFinish()
        } catch (err: any) {
            setError(err.message || 'Failed to create project')
            logger.error('Error creating project', err as Error)
        } finally {
            setCreatingProject(false)
        }
    }

    const handleDetectOrganizations = async () => {
        setDetectedOrgsLoading(true)
        setError(null)

        try {
            const token = await getAccessToken()
            if (!token) {
                setError('Session expired. Please sign in again.')
                setDetectedOrgsLoading(false)
                return
            }

            if (!connectionDetails?.connectionId) {
                setError('Google Drive not connected. Please go back and connect.')
                setDetectedOrgsLoading(false)
                return
            }

            const res = await fetch('/api/onboarding/detect-orgs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    connectionId: connectionDetails.connectionId
                })
            })

            if (res.ok) {
                const data = await res.json()
                setDetectedOrgs(data.organizations || [])
            } else {
                const err = await res.json()
                setError(err.error || 'Failed to detect organizations')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to detect organizations')
            logger.error('Error detecting orgs', err as Error)
        } finally {
            setDetectedOrgsLoading(false)
        }
    }

    const handleImportOrganizations = async () => {
        setImportingOrgs(true)
        setError(null)

        try {
            const token = await getAccessToken()
            if (!token) {
                setError('Session expired. Please sign in again.')
                setImportingOrgs(false)
                return
            }

            const res = await fetch('/api/onboarding/import-orgs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    connectionId: connectionDetails?.connectionId,
                    selectedOrgIds: selectedOrgIds,
                    newOrgName: orgName.trim() ? orgName : undefined
                })
            })

            if (res.ok) {
                const data = await res.json()
                setNewOrgSlug(data.defaultOrgSlug)
                setDefaultOrgSlug(data.defaultOrgSlug)
                setNewOrgCreated(true)
                if (data.organizationId) {
                    setCreatedOrgId(data.organizationId)
                }
                // Move to Step 4 (Client Setup)
                setStep(4)
            } else {
                const err = await res.json()
                setError(err.error || 'Failed to import organizations')
            }
        } catch (err: any) {
            setError(err.message || 'Failed to import organizations')
            logger.error('Error importing orgs', err as Error)
        } finally {
            setImportingOrgs(false)
        }
    }

    // Initial check: Params & Existing Org (use getSession() so token is valid right after OTP redirect)
    useEffect(() => {
        // Prevent duplicate calls
        if (initialCheckDoneRef.current) return
        initialCheckDoneRef.current = true

        const checkStatus = async () => {
            try {
                const token = await getAccessToken()
                if (!token) {
                    setStep(1) // New users start at Step 1 (Google Drive connection)
                    return
                }

                const success = searchParams?.get('success')
                const errorParam = searchParams?.get('error')

                // 1. If returning from Google Drive callback, set isConnected and move to Step 2
                if (success === 'google_drive_connected') {
                    setIsConnected(true)
                    // Fetch connector details so connectionId is available for Steps 2 & 3
                    try {
                        const statusRes = await fetch('/api/connectors/google-drive?action=status', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        if (statusRes.ok) {
                            const statusData = await statusRes.json()
                            if (statusData.connector?.id) {
                                setConnectionDetails({ connectionId: statusData.connector.id })
                                logger.debug('Onboarding: connectionDetails set from status after OAuth', statusData.connector.id)
                            }
                        }
                    } catch (err) {
                        logger.warn('Failed to fetch connector status after OAuth redirect', err as Error)
                    }
                    setStep(3) // Skip Sandbox — go straight to Organization setup
                } else if (errorParam) {
                    setStep(1)
                    setError(`Google Drive connection failed: ${errorParam}`)
                } else {
                    // 2. Normal load: Check if user already has an org
                    try {
                        const res = await fetch('/api/organization', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        if (res.ok) {
                            const data = await res.json()
                            logger.debug("Onboarding: Fetched Org Data:", data)

                            // API returns { organization: { ... } } or { organization: null }
                            const org = data.organization

                            // If no org found, ensure one is created before proceeding
                            let resolvedOrg = org
                            if (!resolvedOrg?.id) {
                                try {
                                    logger.debug("Onboarding: No org found, calling ensure-org...")
                                    const ensureRes = await fetch('/api/onboarding/ensure-org', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                    if (ensureRes.ok) {
                                        resolvedOrg = await ensureRes.json()
                                        logger.debug("Onboarding: ensure-org returned:", resolvedOrg)
                                    }
                                } catch (err) {
                                    logger.error("ensure-org failed", err as Error)
                                }
                            }

                            if (resolvedOrg && resolvedOrg.id) {
                                setExistingOrg(resolvedOrg)
                                setOrgName(resolvedOrg.name || "")
                                setNewOrgSlug(resolvedOrg.slug)
                                setDefaultOrgSlug(resolvedOrg.slug)

                                const settings = (resolvedOrg as any).settings as any
                                const onboarding = settings?.onboarding

                                // If onboarding is complete, show domain choice (Step 0) to continue or create new
                                if (onboarding?.isComplete) {
                                    try {
                                        const domainRes = await fetch('/api/onboarding/domain-options', {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        })
                                        if (domainRes.ok) {
                                            const opts = await domainRes.json()
                                            if (opts && (opts.orgsToJoin.length > 0 || opts.orgsAlreadyIn.length > 0)) {
                                                setDomainOptions(opts)
                                                setStep(0) // Show domain choice screen
                                                setOnboarding(true, 0)
                                            } else {
                                                // No domain options (private email), go to Step 1
                                                setStep(1)
                                            }
                                        } else {
                                            setStep(1)
                                        }
                                    } catch (err) {
                                        logger.error('Failed to load domain options', err as Error)
                                        setStep(1)
                                    }
                                } else {
                                    // Onboarding incomplete: Resume from current step
                                    // Map old step 2 (Sandbox, now removed) → step 3
                                    const rawStep = onboarding?.currentStep ?? 1
                                    const currentStep = rawStep === 2 ? 3 : rawStep
                                    setStep(Math.max(currentStep, 1))
                                }
                            } else {
                                // Could not create/find org — start at Step 1
                                setStep(1)
                            }
                        } else {
                            setStep(1)
                        }
                    } catch (err) {
                        logger.error("Failed to check org status", err as Error)
                        setStep(1)
                    }
                }
            } catch (err) {
                logger.error("Error in checkStatus", err as Error)
                setStep(1)
            } finally {
                setIsLoading(false)
            }
        }

        checkStatus()
        // Set onboarding mode in layout context
        setOnboarding(true)
        return () => setOnboarding(false)
    }, [])

    // Sync local step → OnboardingContext so the sidebar highlights the correct step
    useEffect(() => {
        if (step !== null) {
            setOnboarding(true, step)
        }
    }, [step])

    // Fetch Domain Options when step is 0
    useEffect(() => {
        if (step === 0 && !domainOptions) {
            const fetchOptions = async () => {
                try {
                    const token = await getAccessToken()
                    if (!token) {
                        setDomainOptions(null)
                        return
                    }
                    const res = await fetch('/api/onboarding/domain-options', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (res.ok) {
                        const opts = await res.json()
                        setDomainOptions(opts || null)
                    } else {
                        setDomainOptions(null)
                    }
                } catch (err) {
                    logger.error("Failed to fetch domain options", err as Error)
                    setDomainOptions(null)
                }
            }
            fetchOptions()
        }
    }, [step, domainOptions])

    // Detect organizations when step is 3 (and they haven't been loaded yet)
    useEffect(() => {
        if (step === 3 && detectedOrgs.length === 0 && !detectedOrgsLoading && !detectOrgsDoneRef.current) {
            detectOrgsDoneRef.current = true
            handleDetectOrganizations()
        }
    }, [step, detectedOrgs.length, detectedOrgsLoading])

    // Fetch authUrl when step is 1 (Google Drive connection)
    useEffect(() => {
        if (step === 1 && !authUrl && !isConnected && user?.id) {
            const fetchAuthUrl = async () => {
                try {
                    const token = await getAccessToken()
                    if (!token) {
                        setError('Session expired. Please sign in again.')
                        return
                    }

                    // Check if user already has an active connector — if so, reuse it (skip OAuth)
                    try {
                        const statusRes = await fetch('/api/connectors/google-drive?action=status', {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                        if (statusRes.ok) {
                            const statusData = await statusRes.json()
                            if (statusData.isConnected && statusData.connector?.id) {
                                logger.debug("Onboarding Step 1: Existing connector found, reusing", statusData.connector)
                                setIsConnected(true)
                                // Ensure org is linked to this connector
                                if (existingOrg?.id && statusData.connector.id) {
                                    await fetch('/api/onboarding/ensure-org', {
                                        method: 'POST',
                                        headers: { 'Authorization': `Bearer ${token}` }
                                    })
                                }
                                return
                            }
                        }
                    } catch (err) {
                        logger.warn("Failed to check connector status", err as Error)
                    }

                    // Fetch user's default organization to pass in OAuth state
                    let organizationId: string | undefined = existingOrg?.id
                    if (!organizationId) {
                        try {
                            const orgRes = await fetch('/api/organization', {
                                headers: { 'Authorization': `Bearer ${token}` }
                            })
                            if (orgRes.ok) {
                                const orgData = await orgRes.json()
                                organizationId = orgData.organization?.id
                            }
                        } catch (err) {
                            logger.warn("Failed to fetch default organization", err as Error)
                        }
                    }

                    const res = await fetch('/api/connectors/google-drive', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            action: 'initiate',
                            userId: user?.id,
                            organizationId
                        })
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setAuthUrl(data.authUrl)
                    } else {
                        const err = await res.json()
                        setError(err.error || 'Failed to initiate Google Drive connection')
                    }
                } catch (err: any) {
                    setError(err.message || 'Failed to connect to Google Drive')
                    logger.error("Error fetching auth URL", err as Error)
                }
            }
            fetchAuthUrl()
        }
    }, [step, authUrl, isConnected, user?.id])

    // Fetch connection details on component mount (to resume from URL redirect)
    useEffect(() => {
        const fetchConnectionDetails = async () => {
            const token = await getAccessToken()
            if (!token || !user?.id) return

            const code = searchParams?.get('code')
            const connectionId = searchParams?.get('connectionId')

            if (code && connectionId && step === 1 && !isConnected) {
                try {
                    setIsSubmitting(true)
                    const res = await fetch('/api/connectors/google-drive', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            action: 'finalize',
                            connectionId,
                            parentFolderId: 'root'
                        })
                    })

                    if (res.ok) {
                        const data = await res.json()
                        setConnectionDetails(data)
                        setConnectedEmail(data.email)
                        setIsConnected(true)

                        // Move to Step 3 (Organization Setup) after short delay
                        setTimeout(() => {
                            setStep(3)
                        }, 1500)
                    } else {
                        const err = await res.json()
                        setError(err.error || 'Failed to finalize connection')
                    }
                } catch (err: any) {
                    setError(err.message || 'An error occurred while connecting')
                    logger.error("Error finalizing connection", err as Error)
                } finally {
                    setIsSubmitting(false)
                }
            }
        }

        fetchConnectionDetails()
    }, [searchParams, step, user?.id, isConnected])


    return (
        <>
            {isLoading ? (
                <div className="min-h-screen flex items-center justify-center">
                    <LoadingSpinner message="Setting up your workspace..." showDots={true} size="lg" />
                </div>
            ) : (
                <div className="w-full h-full overflow-y-auto p-12 flex items-center justify-center">
                    <div className="w-full max-w-2xl">
                        {/* Domain Choice Screen (Step 0) */}
                        {step === 0 && domainOptions && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8">
                                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Choose your workspace</h1>
                                    <p className="text-lg text-slate-600">
                                        Your email is part of an organization that uses {BRAND_NAME}
                                    </p>
                                </div>

                                {user?.email && (
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-8 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-800 font-bold">
                                            {user.email.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-medium text-slate-900">{user.email}</p>
                                    </div>
                                )}

                                <div className="space-y-3 mb-6">
                                    {domainOptions.orgsAlreadyIn.map((org: DomainOrgOption) => (
                                        <button
                                            key={org.id}
                                            type="button"
                                            className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-left transition-colors group"
                                            onClick={() => router.push(`/d/o/${org.slug}`)}
                                        >
                                            <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200">
                                                <Building2 className="h-5 w-5 text-slate-700" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-slate-900">Continue to {org.name}</p>
                                                <p className="text-xs text-slate-500">You're already a member</p>
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                                        </button>
                                    ))}
                                </div>

                                {domainOptions.orgsToJoin.length > 0 && (
                                    <>
                                        <div className="relative mb-6">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-slate-200" />
                                            </div>
                                            <div className="relative flex justify-center text-xs">
                                                <span className="px-2 bg-white text-slate-500">or</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 mb-6">
                                            {domainOptions.orgsToJoin.map((org: DomainOrgOption) => (
                                                <button
                                                    key={org.id}
                                                    type="button"
                                                    disabled={domainJoiningId !== null}
                                                    className="w-full flex items-center gap-4 p-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 text-left transition-colors disabled:opacity-50 group"
                                                    onClick={async () => {
                                                        setDomainJoiningId(org.id)
                                                        setDomainError(null)
                                                        const result = await joinOrganizationByDomain(org.id)
                                                        if (result.ok) {
                                                            router.push(`/d/o/${result.slug}`)
                                                        } else {
                                                            setDomainError(result.error)
                                                            setDomainJoiningId(null)
                                                        }
                                                    }}
                                                >
                                                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-200">
                                                        {domainJoiningId === org.id ? (
                                                            <LoadingSpinner size="sm" />
                                                        ) : (
                                                            <LogIn className="h-5 w-5 text-slate-700" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-900">Join {org.name}</p>
                                                        <p className="text-xs text-slate-500">Request access</p>
                                                    </div>
                                                    <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                )}

                                <button
                                    type="button"
                                    disabled={domainJoiningId !== null}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition-colors disabled:opacity-50"
                                    onClick={() => setStep(1)}
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    Create a new workspace
                                </button>

                                {domainError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                        {domainError}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 1: Google Drive Connection */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 mx-auto">
                                        <GoogleDriveIcon size={32} />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Connect Google Drive</h1>
                                    <p className="text-slate-500">
                                        Link your Google Drive to start organizing your files
                                    </p>
                                </div>

                                {isConnected ? (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-start gap-4">
                                                {/* Google Drive icon with Completed subtext */}
                                                <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                                                    <GoogleDriveIcon size={28} />
                                                    <span className="flex items-center gap-0.5 text-xs font-medium text-green-600">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Completed
                                                    </span>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-green-900 mb-1">Google Drive Connected</h3>
                                                    {connectedEmail && (
                                                        <p className="text-sm text-green-700">Connected as {connectedEmail}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <Button
                                            onClick={() => setStep(3)}
                                            className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition-colors"
                                        >
                                            Continue
                                            <ArrowRight className="inline-block ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                                            <h3 className="font-semibold text-slate-900 mb-4">Why connect Google Drive?</h3>
                                            <ul className="space-y-3 text-sm text-slate-600">
                                                <li className="flex items-start gap-3">
                                                    <GoogleDriveIcon size={20} className="flex-shrink-0 mt-0.5" />
                                                    <span>Auto-sync your existing folder structure</span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <Lock className="h-5 w-5 text-slate-700 flex-shrink-0 mt-0.5" />
                                                    <span>Secure access to your files</span>
                                                </li>
                                                <li className="flex items-start gap-3">
                                                    <Settings className="h-5 w-5 text-slate-700 flex-shrink-0 mt-0.5" />
                                                    <span>Organize and manage files in one place</span>
                                                </li>
                                            </ul>
                                        </div>

                                        {error && (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                                <div className="flex items-start gap-3">
                                                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                    <span>{error}</span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-3">
                                            <Button
                                                onClick={handleConnectDrive}
                                                disabled={!authUrl || isSubmitting}
                                                className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition-colors disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Connecting...' : 'Connect Google Drive'}
                                                {!isSubmitting && <ArrowRight className="inline-block ml-2 h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Organization Setup & Auto-Import */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 mx-auto">
                                        <Building2 className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Set up your organization</h1>
                                    <p className="text-slate-500">
                                        Name your workspace — or import an existing structure from Google Drive
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {!detectedOrgsLoading && detectedOrgs.length === 0 && (
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                                            <p className="text-sm text-slate-600">
                                                No existing organizations found in your Google Drive.
                                            </p>
                                        </div>
                                    )}

                                    {detectedOrgsLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <LoadingSpinner message="Detecting organizations..." size="lg" />
                                        </div>
                                    ) : (
                                        <>
                                            {detectedOrgs.length > 0 && (
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-slate-900">Detected organizations:</h3>
                                                    <div className="space-y-3 border border-slate-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                                                        {detectedOrgs.map((org: any) => (
                                                            <label key={org.folderId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedOrgIds.includes(org.folderId)}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setSelectedOrgIds([...selectedOrgIds, org.folderId])
                                                                        } else {
                                                                            setSelectedOrgIds(selectedOrgIds.filter(id => id !== org.folderId))
                                                                        }
                                                                    }}
                                                                    disabled={importingOrgs}
                                                                    className="rounded"
                                                                />
                                                                <div className="flex-1">
                                                                    <p className="font-medium text-slate-900 text-sm">{org.name}</p>
                                                                    <p className="text-xs text-slate-500">{org.metadata?.type || 'organization'}</p>
                                                                </div>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Label htmlFor="newOrgName" className="text-sm font-semibold text-slate-900">
                                                    Organization name
                                                </Label>
                                                <Input
                                                    id="newOrgName"
                                                    type="text"
                                                    placeholder="e.g., Acme Corp"
                                                    value={orgName}
                                                    onChange={(e) => setOrgName(e.target.value)}
                                                    disabled={importingOrgs}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                                                />
                                            </div>
                                        </>
                                    )}

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                <span>{error}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Button
                                            onClick={handleImportOrganizations}
                                            disabled={importingOrgs || (selectedOrgIds.length === 0 && !orgName.trim())}
                                            className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition-colors disabled:opacity-50"
                                        >
                                            {importingOrgs ? (
                                                <>
                                                    <span className="inline-block animate-spin mr-2">⏳</span>
                                                    Importing...
                                                </>
                                            ) : (
                                                <>
                                                    Create Organization
                                                    <ArrowRight className="inline-block ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Client Setup */}
                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 mx-auto">
                                        <Users className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Add your clients</h1>
                                    <p className="text-slate-500">
                                        Clients are who you work for — projects live under them
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {/* Option 1: Test client */}
                                    <label
                                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${createTestClient
                                                ? 'border-slate-900 bg-slate-50'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={createTestClient}
                                            onChange={(e) => setCreateTestClient(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-slate-900"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm">Create sample client(s)</p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                We'll add <span className="font-semibold text-slate-700">"Sample Client"</span> to help you explore the app
                                            </p>
                                        </div>
                                    </label>

                                    {/* Option 2: Custom client */}
                                    <label
                                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${createMyClient
                                                ? 'border-slate-900 bg-slate-50'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={createMyClient}
                                            onChange={(e) => setCreateMyClient(e.target.checked)}
                                            className="mt-0.5 h-4 w-4 flex-shrink-0 accent-slate-900"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 text-sm">Create my own client</p>
                                            {createMyClient && (
                                                <div className="mt-2" onClick={(e) => e.preventDefault()}>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g., Acme Corp"
                                                        value={clientName}
                                                        onChange={(e) => setClientName(e.target.value)}
                                                        disabled={creatingClient}
                                                        autoFocus
                                                        onKeyDown={(e) => e.key === 'Enter' && handleContinueClients()}
                                                        className="w-full border-slate-300 text-sm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </label>

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <Button
                                        onClick={handleContinueClients}
                                        disabled={creatingClient}
                                        className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition-colors disabled:opacity-50 mt-2"
                                    >
                                        {creatingClient ? (
                                            <LoadingSpinner size="sm" message="Creating…" />
                                        ) : (
                                            <>
                                                {!createTestClient && !createMyClient ? 'Skip to Dashboard' : 'Continue'}
                                                <ArrowRight className="inline-block ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 5: Project Setup */}
                        {step === 5 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 mx-auto">
                                        <Briefcase className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Add your first project</h1>
                                    <p className="text-slate-500">
                                        Projects hold your documents and live under clients
                                    </p>
                                </div>

                                {clientCreated ? (
                                    <div className="space-y-3">
                                        {/* Option 1: Test project */}
                                        <label
                                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${createTestProject
                                                    ? 'border-slate-900 bg-slate-50'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={createTestProject}
                                                onChange={(e) => setCreateTestProject(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-slate-900"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 text-sm">Create sample project(s)</p>
                                                <p className="text-xs text-slate-500 mt-1">
                                                    We'll add <span className="font-semibold text-slate-700">"Sample Project"</span> to help you explore the app
                                                </p>
                                            </div>
                                        </label>

                                        {/* Option 2: Custom project */}
                                        <label
                                            className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all select-none ${createMyProject
                                                    ? 'border-slate-900 bg-slate-50'
                                                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={createMyProject}
                                                onChange={(e) => setCreateMyProject(e.target.checked)}
                                                className="mt-0.5 h-4 w-4 flex-shrink-0 accent-slate-900"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900 text-sm">Create my own project</p>
                                                {createMyProject && (
                                                    <div className="mt-2" onClick={(e) => e.preventDefault()}>
                                                        <Input
                                                            type="text"
                                                            placeholder="e.g., Website Redesign"
                                                            value={projectName}
                                                            onChange={(e) => setProjectName(e.target.value)}
                                                            disabled={creatingProject}
                                                            autoFocus
                                                            onKeyDown={(e) => e.key === 'Enter' && handleContinueProjects()}
                                                            className="w-full border-slate-300 text-sm"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </label>

                                        {error && (
                                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                                <span>{error}</span>
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleContinueProjects}
                                            disabled={creatingProject}
                                            className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium transition-colors disabled:opacity-50 mt-2"
                                        >
                                            {creatingProject ? (
                                                <LoadingSpinner size="sm" message="Creating…" />
                                            ) : (
                                                <>
                                                    {!createTestProject && !createMyProject ? 'Skip to Dashboard' : 'Continue to Dashboard'}
                                                    <ArrowRight className="inline-block ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                                            No clients were set up — you can add clients and projects any time from your dashboard.
                                        </div>
                                        <Button
                                            onClick={handleFinish}
                                            className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-medium"
                                        >
                                            Go to Dashboard
                                            <ArrowRight className="inline-block ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
            <OnboardingContent />
        </Suspense>
    )
}
