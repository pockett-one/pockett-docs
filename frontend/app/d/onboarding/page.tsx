"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { CheckCircle2, ArrowRight, Building2, LogIn, PlusCircle, Settings, Lock, AlertCircle, Users, Briefcase, HardDrive, FolderOpen, Folder, Plus } from "lucide-react"
import { GoogleDriveIcon } from "@/components/ui/google-drive-icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { GooglePickerButton } from "@/components/google-drive/google-picker-button"

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
    const [rootFolderId, setRootFolderId] = useState('')

    // Step 0: Domain Choice
    const [domainOptions, setDomainOptions] = useState<DomainOnboardingOptions | null>(null)
    const [domainJoiningId, setDomainJoiningId] = useState<string | null>(null)
    const [domainError, setDomainError] = useState<string | null>(null)
    const [selectionMode, setSelectionMode] = useState<'whole' | 'specific'>('specific')

    // Step 1: Google Drive Connection
    const [authUrl, setAuthUrl] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionDetails, setConnectionDetails] = useState<{ accessToken?: string, connectionId?: string, clientId?: string } | null>(null)
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null)

    // Step 2: Sandbox Setup (Mandatory)
    const [sandboxOrgName, setSandboxOrgName] = useState("Acme Consulting")
    const [sandboxClientName, setSandboxClientName] = useState("Acme Enterprise Client")
    const [sandboxProjectName, setSandboxProjectName] = useState("Website Redesign Q3")
    const [creatingSandbox, setCreatingSandbox] = useState(false)

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

    // Step 4: Custom Organization Setup
    const [customOrgName, setCustomOrgName] = useState('')
    const [customClientName, setCustomClientName] = useState('')
    const [customProjectName, setCustomProjectName] = useState('')
    const [showCustomClient, setShowCustomClient] = useState(false)
    const [showCustomProject, setShowCustomProject] = useState(false)
    const [orgChecked, setOrgChecked] = useState(true)
    const [clientChecked, setClientChecked] = useState(false)
    const [projectChecked, setProjectChecked] = useState(false)
    const [creatingCustomWorkspace, setCreatingCustomWorkspace] = useState(false)

    // Arrow animation styles
    const arrowAnimationStyle = `
        @keyframes arrow-bounce {
            0%, 100% { transform: translateX(0); }
            50% { transform: translateX(3px); }
        }
        .cta-hover-arrow:hover .animate-arrow {
            animation: arrow-bounce 1s infinite;
        }
    `

    // General
    const [existingOrg, setExistingOrg] = useState<any>(null)
    const [isFinalizing, setIsFinalizing] = useState(false)

    const handleFinish = async () => {
        // Fetch the user's latest default org slug from the backend
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
                logger.error("Failed to fetch default org for redirect after onboarding", e as Error)
            }
        }

        // Fallback to local state if available, then to /d
        if (defaultOrgSlug) {
            router.push(`/d/o/${defaultOrgSlug}`)
        } else {
            router.push('/d')
        }
    }

    const handleConnectDrive = () => {
        if (authUrl) {
            window.location.href = authUrl
        }
    }

    const handleRootFolderSelected = async (ids: string[]) => {
        if (ids && ids.length > 0) {
            const selectedId = ids[0]
            setRootFolderId(selectedId)
            // Call API to update root folder
            try {
                const token = await getAccessToken()
                if (connectionDetails?.connectionId) {
                    await fetch('/api/connectors/google-drive', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({
                            action: 'update-root-folder',
                            connectionId: connectionDetails.connectionId,
                            rootFolderId: selectedId
                        })
                    })
                }
            } catch (e) {
                logger.error("Failed to update root folder", e as Error)
            }
        }
    }

    const handleCreateSandbox = async () => {
        setCreatingSandbox(true)
        setError(null)

        try {
            const token = await getAccessToken()
            if (!token) {
                setError('Session expired. Please sign in again.')
                return
            }

            // 1. Create Sandbox Org
            const orgRes = await fetch('/api/onboarding/create-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    connectionId: connectionDetails?.connectionId || null,
                    name: sandboxOrgName,
                    sandboxOnly: true
                })
            })

            if (!orgRes.ok) {
                const err = await orgRes.json()
                throw new Error(err.error || 'Failed to create Sandbox Organization')
            }
            const orgData = await orgRes.json()
            const orgId = orgData.organizationId

            // 2. Create Sandbox Client
            const clientRes = await fetch('/api/onboarding/create-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ organizationId: orgId, name: sandboxClientName, sandboxOnly: true })
            })

            if (!clientRes.ok) {
                const err = await clientRes.json()
                throw new Error(err.error || 'Failed to create Sandbox Client')
            }
            const clientData = await clientRes.json()
            const clientId = clientData.clientId

            // 3. Create Sandbox Project
            const projRes = await fetch('/api/onboarding/create-project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ organizationId: orgId, clientId: clientId, name: sandboxProjectName, sandboxOnly: true })
            })

            if (!projRes.ok) {
                const err = await projRes.json()
                throw new Error(err.error || 'Failed to create Sandbox Project')
            }

            // Successfully created the sandbox, move to Step 3 (Import Orphans)
            setStep(3)

        } catch (err: any) {
            setError(err.message || 'Error generating sandbox workspace')
            logger.error('Error generating sandbox context during onboarding', err as Error)
        } finally {
            setCreatingSandbox(false)
        }
    }

    const handleCreateCustomWorkspace = async () => {
        if (!customOrgName.trim()) {
            setError('Organization name is required to create a workspace.')
            return
        }

        setCreatingCustomWorkspace(true)
        setError(null)

        try {
            const token = await getAccessToken()
            if (!token) {
                setError('Session expired. Please sign in again.')
                return
            }

            // 1. Create Custom Org
            const orgRes = await fetch('/api/onboarding/create-org', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    connectionId: connectionDetails?.connectionId || null,
                    name: customOrgName.trim(),
                    sandboxOnly: false
                })
            })

            if (!orgRes.ok) {
                const err = await orgRes.json()
                throw new Error(err.error || 'Failed to create Organization')
            }
            const orgData = await orgRes.json()
            const orgId = orgData.organizationId

            // Set default slug so finish handles redirect correctly
            if (orgData.organizationSlug || orgData.defaultOrgSlug) {
                setDefaultOrgSlug(orgData.organizationSlug || orgData.defaultOrgSlug)
            }

            // 2. Create Custom Client (Optional)
            if (customClientName.trim()) {
                const clientRes = await fetch('/api/onboarding/create-client', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ organizationId: orgId, name: customClientName.trim(), sandboxOnly: false })
                })

                if (clientRes.ok) {
                    const clientData = await clientRes.json()
                    const clientId = clientData.clientId

                    // 3. Create Custom Project (Optional)
                    if (customProjectName.trim()) {
                        await fetch('/api/onboarding/create-project', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ organizationId: orgId, clientId: clientId, name: customProjectName.trim(), sandboxOnly: false })
                        })
                    }
                }
            }

            // Finish and redirect to dashboard
            await handleFinish()

        } catch (err: any) {
            setError(err.message || 'Error generating custom workspace')
            logger.error('Error generating custom context during onboarding', err as Error)
        } finally {
            setCreatingCustomWorkspace(false)
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
                    connectionId: connectionDetails.connectionId,
                    parentFolderId: rootFolderId || (connectionDetails as any).rootFolderId || 'root'
                })
            })

            if (res.ok) {
                const data = await res.json()
                const orgs = data.organizations || []
                setDetectedOrgs(orgs)

                // Preselect all detected organizations, clients, and projects
                const allSelectedIds: string[] = []
                orgs.forEach((org: any) => {
                    allSelectedIds.push(org.folderId)
                    org.clients?.forEach((client: any) => {
                        allSelectedIds.push(client.folderId)
                        client.projects?.forEach((proj: any) => {
                            allSelectedIds.push(proj.folderId)
                        })
                    })
                })
                setSelectedOrgIds(allSelectedIds)
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

                // Extract connection details from URL if present
                const success = searchParams.get('success')
                const connId = searchParams.get('connectionId')
                const email = searchParams.get('email')
                const errorParam = searchParams?.get('error')

                if (success === 'google_drive_connected') {
                    setIsConnected(true)
                    if (email) setConnectedEmail(email)
                    if (connId) {
                        setConnectionDetails(prev => ({ ...prev, connectionId: connId }))
                    }
                    // Fetch connector details so connectionId is available for Steps 2 & 3
                    const statusRes = await fetch('/api/connectors/google-drive?action=status', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                    if (statusRes.ok) {
                        const statusData = await statusRes.json()
                        const fetchedRootId = statusData.connector?.rootFolderId
                        const savedStep = statusData.connector?.onboarding?.currentStep

                        if (statusData.connector?.id) {
                            setConnectionDetails(prev => ({ ...prev, connectionId: statusData.connector.id }))
                        }
                        if (fetchedRootId) {
                            setRootFolderId(fetchedRootId)
                        }

                        // Determine the step intelligently rather than blindly forcing step 2
                        let nextStep = 1
                        if (fetchedRootId) {
                            nextStep = 2
                            if (savedStep && savedStep >= 2) {
                                nextStep = savedStep === 2 ? 3 : savedStep
                            }
                        }

                        setStep(nextStep)
                    }
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
                                let onboarding = settings?.onboarding

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
                                    // Resume from current step
                                    let fetchedRootId = rootFolderId
                                    let savedStep = onboarding?.currentStep ?? 1

                                    try {
                                        const statusRes = await fetch('/api/connectors/google-drive?action=status', {
                                            headers: { 'Authorization': `Bearer ${token}` }
                                        })
                                        if (statusRes.ok) {
                                            const statusData = await statusRes.json()
                                            setIsConnected(statusData.isConnected)
                                            if (statusData.connector?.id) {
                                                setConnectionDetails({ connectionId: statusData.connector.id })
                                                if (statusData.connector.name) setConnectedEmail(statusData.connector.name)
                                            }
                                            if (statusData.connector?.onboarding) {
                                                savedStep = statusData.connector.onboarding.currentStep ?? savedStep
                                            }
                                            if (statusData.connector?.rootFolderId) {
                                                fetchedRootId = statusData.connector.rootFolderId
                                                setRootFolderId(fetchedRootId)
                                            }
                                        }
                                    } catch (err) {
                                        logger.warn('Failed to fetch connector status during normal load', err as Error)
                                    }

                                    let currentStep = savedStep === 2 ? 3 : savedStep

                                    // If at resume point for sandbox or beyond, but no root folder, force back to step 1
                                    if (currentStep >= 2 && !fetchedRootId) {
                                        currentStep = 1
                                    }
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
        if (step === 1 && !isConnected && user?.id) {
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
                                setConnectionDetails({ connectionId: statusData.connector.id })
                                if (statusData.connector.name) {
                                    setConnectedEmail(statusData.connector.name)
                                }
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
                            organizationId,
                            rootFolderId
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
    }, [step, isConnected, user?.id, existingOrg?.id, rootFolderId])

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
            <style dangerouslySetInnerHTML={{ __html: arrowAnimationStyle }} />
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
                                    <div className="space-y-6 text-left">
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                                    <GoogleDriveIcon size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-900">Google Drive Connected</p>
                                                    {connectedEmail && (
                                                        <p className="text-xs text-slate-500">{connectedEmail}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md border border-green-100">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Verified
                                            </div>
                                        </div>

                                        {!rootFolderId ? (
                                            <div className="space-y-6">
                                                <div className="p-8 border border-slate-200 rounded-2xl bg-white text-center shadow-sm">
                                                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-700">
                                                        <HardDrive className="h-7 w-7" />
                                                    </div>
                                                    <h3 className="text-xl font-bold text-slate-900 mb-2">Configure Workspace Scope</h3>
                                                    <p className="text-sm text-slate-500 mb-8 max-w-[280px] mx-auto leading-relaxed">
                                                        Choose how Pockett should scan your Drive for project structures.
                                                    </p>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 text-left">
                                                        <button
                                                            onClick={() => setSelectionMode('whole')}
                                                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all text-center h-full ${selectionMode === 'whole'
                                                                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <div className={`h-12 w-12 rounded-full mb-4 flex items-center justify-center ${selectionMode === 'whole' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                <HardDrive className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-center">
                                                                <p className={`font-bold text-sm mb-1 ${selectionMode === 'whole' ? 'text-slate-900' : 'text-slate-700'}`}>Scan Entire Drive</p>
                                                                <p className="text-xs text-slate-500">Recommended for personal use or clean drives.</p>
                                                            </div>
                                                            <div className={`mt-4 h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectionMode === 'whole' ? 'border-slate-900 shadow-[inset_0_0_0_3px_white] bg-slate-900' : 'border-slate-300'}`} />
                                                        </button>

                                                        <button
                                                            onClick={() => setSelectionMode('specific')}
                                                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all text-center h-full ${selectionMode === 'specific'
                                                                ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                                                }`}
                                                        >
                                                            <div className={`h-12 w-12 rounded-full mb-4 flex items-center justify-center ${selectionMode === 'specific' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                                                <FolderOpen className="h-6 w-6" />
                                                            </div>
                                                            <div className="flex-1 flex flex-col justify-center">
                                                                <p className={`font-bold text-sm mb-1 ${selectionMode === 'specific' ? 'text-slate-900' : 'text-slate-700'}`}>Select Specific Folder</p>
                                                                <p className="text-xs text-slate-500">Narrow down to a project or client folder.</p>
                                                            </div>
                                                            <div className={`mt-4 h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectionMode === 'specific' ? 'border-slate-900 shadow-[inset_0_0_0_3px_white] bg-slate-900' : 'border-slate-300'}`} />
                                                        </button>
                                                    </div>

                                                    {selectionMode === 'specific' ? (
                                                        connectionDetails?.connectionId ? (
                                                            <GooglePickerButton
                                                                connectionId={connectionDetails.connectionId}
                                                                mode="select-folder"
                                                                onImport={handleRootFolderSelected}
                                                            >
                                                                <Button className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] cta-hover-arrow flex items-center justify-center gap-2">
                                                                    Open Google File Picker
                                                                    <ArrowRight className="h-5 w-5 animate-arrow" />
                                                                </Button>
                                                            </GooglePickerButton>
                                                        ) : (
                                                            <div className="py-4 flex flex-col items-center gap-2">
                                                                <LoadingSpinner size="md" />
                                                                <p className="text-xs text-slate-400">Initializing Picker...</p>
                                                            </div>
                                                        )
                                                    ) : (
                                                        <Button
                                                            onClick={() => handleRootFolderSelected(['root'])}
                                                            className="w-full py-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] cta-hover-arrow flex items-center justify-center gap-2"
                                                        >
                                                            Use Entire Drive
                                                            <ArrowRight className="h-5 w-5 animate-arrow" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700">
                                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">Root Folder Selected</p>
                                                        <p className="text-xs text-slate-500">Ready to organize your workspace</p>
                                                    </div>
                                                </div>
                                                <GooglePickerButton
                                                    connectionId={connectionDetails?.connectionId || ''}
                                                    mode="select-folder"
                                                    onImport={handleRootFolderSelected}
                                                >
                                                    <Button variant="ghost" size="sm" className="text-xs text-slate-600 hover:bg-slate-100 font-bold border border-slate-200">
                                                        Change
                                                    </Button>
                                                </GooglePickerButton>
                                            </div>
                                        )}

                                        <div className="pt-2">
                                            {rootFolderId && (
                                                <Button
                                                    onClick={() => setStep(2)}
                                                    className="w-full py-6 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] cta-hover-arrow flex items-center justify-center gap-2"
                                                >
                                                    Continue to Sandbox Setup
                                                    <ArrowRight className="h-5 w-5 animate-arrow" />
                                                </Button>
                                            )}
                                        </div>
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
                                                className="w-full py-4 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow"
                                            >
                                                {isSubmitting ? 'Connecting...' : 'Connect Google Drive'}
                                                {!isSubmitting && <ArrowRight className="inline-block ml-2 h-4 w-4 animate-arrow" />}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Sandbox Organization (Mandatory) */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 mx-auto">
                                        <Building2 className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Sandbox Organization</h1>
                                    <p className="text-slate-500">
                                        We strongly recommend a sample workspace to safely test out {BRAND_NAME}
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="sandboxOrgName" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-slate-500" />
                                                Sandbox Organization
                                            </Label>
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={true} disabled={true} className="h-5 w-5 rounded border-slate-300 accent-slate-400" />
                                                <Input
                                                    id="sandboxOrgName"
                                                    type="text"
                                                    value={sandboxOrgName}
                                                    onChange={(e) => setSandboxOrgName(e.target.value)}
                                                    disabled={true}
                                                    className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 cursor-not-allowed font-medium"
                                                />
                                            </div>
                                        </div>

                                        <div className="pl-6 border-l-2 border-slate-200 space-y-4 ml-3">
                                            <div className="space-y-2">
                                                <Label htmlFor="sandboxClientName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                    <Users className="h-4 w-4 text-slate-400" />
                                                    Sample Client
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked={true} disabled={true} className="h-5 w-5 rounded border-slate-300 accent-slate-400" />
                                                    <Input
                                                        id="sandboxClientName"
                                                        type="text"
                                                        value={sandboxClientName}
                                                        onChange={(e) => setSandboxClientName(e.target.value)}
                                                        disabled={true}
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>

                                            <div className="pl-6 border-l-2 border-slate-200 space-y-2 ml-3">
                                                <Label htmlFor="sandboxProjectName" className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4 text-slate-400" />
                                                    Sample Project
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked={true} disabled={true} className="h-5 w-5 rounded border-slate-300 accent-slate-400" />
                                                    <Input
                                                        id="sandboxProjectName"
                                                        type="text"
                                                        value={sandboxProjectName}
                                                        onChange={(e) => setSandboxProjectName(e.target.value)}
                                                        disabled={true}
                                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50 cursor-not-allowed"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <Button
                                            onClick={handleCreateSandbox}
                                            disabled={creatingSandbox || !sandboxOrgName}
                                            className="w-[70%] h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow"
                                        >
                                            {creatingSandbox ? (
                                                <>
                                                    <LoadingSpinner size="sm" className="mr-2" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    Create Sandbox
                                                    <ArrowRight className="inline-block ml-2 h-4 w-4 animate-arrow" />
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep(3)}
                                            className="w-[30%] h-11 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold"
                                        >
                                            Skip
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Import Organization */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-4 mx-auto">
                                        <Building2 className="h-8 w-8 text-slate-700" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Import Organization</h1>
                                    <p className="text-slate-500">
                                        Check existing orphaned organizations from your Google Drive to import them as workspaces
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
                                                <div className="space-y-6">
                                                    <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2">Detected workspaces in your Google Drive:</h3>
                                                    <div className="space-y-8 p-1">
                                                        {detectedOrgs.map((org: any) => {
                                                            const isOrgChecked = selectedOrgIds.includes(org.folderId)
                                                            return (
                                                                <div key={org.folderId} className="space-y-4">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                                            <Building2 className="h-4 w-4 text-slate-500" />
                                                                            Organization
                                                                        </Label>
                                                                        <div className="flex items-center gap-3">
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={isOrgChecked}
                                                                                            onChange={(e) => {
                                                                                                const checked = e.target.checked
                                                                                                let newIds = new Set(selectedOrgIds)
                                                                                                const collectAllIds = (o: any) => {
                                                                                                    let ids = [o.folderId]
                                                                                                    o.clients?.forEach((c: any) => {
                                                                                                        ids.push(c.folderId)
                                                                                                        c.projects?.forEach((p: any) => ids.push(p.folderId))
                                                                                                    })
                                                                                                    return ids
                                                                                                }
                                                                                                const allIds = collectAllIds(org)
                                                                                                if (checked) {
                                                                                                    allIds.forEach(id => newIds.add(id))
                                                                                                } else {
                                                                                                    allIds.forEach(id => newIds.delete(id))
                                                                                                }
                                                                                                setSelectedOrgIds(Array.from(newIds))
                                                                                            }}
                                                                                            disabled={importingOrgs}
                                                                                            className="h-5 w-5 rounded border-slate-300 accent-slate-900 cursor-pointer"
                                                                                        />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                                        <p className="text-[10px] font-bold">{isOrgChecked ? 'Uncheck to skip import' : 'Check to import'}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                            <Input
                                                                                value={org.name}
                                                                                readOnly
                                                                                disabled={true}
                                                                                className="w-full px-4 py-3 border border-slate-200 rounded-lg text-slate-900 bg-slate-50 cursor-not-allowed font-medium"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    {org.clients?.length > 0 && (
                                                                        <div className="pl-6 border-l-2 border-slate-200 ml-3 space-y-4">
                                                                            {org.clients.map((client: any) => {
                                                                                const isClientChecked = selectedOrgIds.includes(client.folderId)
                                                                                return (
                                                                                    <div key={client.folderId} className="space-y-4">
                                                                                        <div className="space-y-2">
                                                                                            <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                                                                <Users className="h-4 w-4 text-slate-400" />
                                                                                                Client
                                                                                            </Label>
                                                                                            <div className="flex items-center gap-3">
                                                                                                <TooltipProvider>
                                                                                                    <Tooltip>
                                                                                                        <TooltipTrigger asChild>
                                                                                                            <input
                                                                                                                type="checkbox"
                                                                                                                checked={isClientChecked}
                                                                                                                onChange={(e) => {
                                                                                                                    const checked = e.target.checked
                                                                                                                    let newIds = new Set(selectedOrgIds)
                                                                                                                    const collectIds = (c: any) => {
                                                                                                                        let ids = [c.folderId]
                                                                                                                        c.projects?.forEach((p: any) => ids.push(p.folderId))
                                                                                                                        return ids
                                                                                                                    }
                                                                                                                    const ids = collectIds(client)
                                                                                                                    if (checked) {
                                                                                                                        ids.forEach(id => newIds.add(id))
                                                                                                                        newIds.add(org.folderId)
                                                                                                                    } else {
                                                                                                                        ids.forEach(id => newIds.delete(id))
                                                                                                                    }
                                                                                                                    setSelectedOrgIds(Array.from(newIds))
                                                                                                                }}
                                                                                                                disabled={importingOrgs}
                                                                                                                className="h-5 w-5 rounded border-slate-300 accent-slate-700 cursor-pointer"
                                                                                                            />
                                                                                                        </TooltipTrigger>
                                                                                                        <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                                                            <p className="text-[10px] font-bold">{isClientChecked ? 'Uncheck to skip import' : 'Check to import'}</p>
                                                                                                        </TooltipContent>
                                                                                                    </Tooltip>
                                                                                                </TooltipProvider>
                                                                                                <Input
                                                                                                    value={client.name}
                                                                                                    readOnly
                                                                                                    disabled={true}
                                                                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 bg-slate-50 cursor-not-allowed"
                                                                                                />
                                                                                            </div>
                                                                                        </div>

                                                                                        {client.projects?.length > 0 && (
                                                                                            <div className="pl-6 border-l-2 border-slate-200 ml-3 space-y-2">
                                                                                                {client.projects.map((project: any) => {
                                                                                                    const isProjChecked = selectedOrgIds.includes(project.folderId)
                                                                                                    return (
                                                                                                        <div key={project.folderId} className="space-y-2">
                                                                                                            <Label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                                                                                                <Briefcase className="h-4 w-4 text-slate-400" />
                                                                                                                Project
                                                                                                            </Label>
                                                                                                            <div className="flex items-center gap-3">
                                                                                                                <TooltipProvider>
                                                                                                                    <Tooltip>
                                                                                                                        <TooltipTrigger asChild>
                                                                                                                            <input
                                                                                                                                type="checkbox"
                                                                                                                                checked={isProjChecked}
                                                                                                                                onChange={(e) => {
                                                                                                                                    const checked = e.target.checked
                                                                                                                                    let newIds = new Set(selectedOrgIds)
                                                                                                                                    if (checked) {
                                                                                                                                        newIds.add(project.folderId)
                                                                                                                                        newIds.add(client.folderId)
                                                                                                                                        newIds.add(org.folderId)
                                                                                                                                    } else {
                                                                                                                                        newIds.delete(project.folderId)
                                                                                                                                    }
                                                                                                                                    setSelectedOrgIds(Array.from(newIds))
                                                                                                                                }}
                                                                                                                                disabled={importingOrgs}
                                                                                                                                className="h-5 w-5 rounded border-slate-300 accent-slate-600 cursor-pointer"
                                                                                                                            />
                                                                                                                        </TooltipTrigger>
                                                                                                                        <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                                                                            <p className="text-[10px] font-bold">{isProjChecked ? 'Uncheck to skip import' : 'Check to import'}</p>
                                                                                                                        </TooltipContent>
                                                                                                                    </Tooltip>
                                                                                                                </TooltipProvider>
                                                                                                                <Input
                                                                                                                    value={project.name}
                                                                                                                    readOnly
                                                                                                                    disabled={true}
                                                                                                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-slate-50 cursor-not-allowed italic"
                                                                                                                />
                                                                                                            </div>
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {error && (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                                    <div className="flex items-start gap-3">
                                                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                                        <span>{error}</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-3 pt-4">
                                                <div className="flex-[0.7]">
                                                    <Button
                                                        onClick={handleImportOrganizations}
                                                        disabled={importingOrgs || (selectedOrgIds.length === 0)}
                                                        className="w-full h-11 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow flex items-center justify-center gap-2"
                                                    >
                                                        {importingOrgs ? (
                                                            <>
                                                                <LoadingSpinner size="sm" className="mr-2" />
                                                                Importing...
                                                            </>
                                                        ) : (
                                                            <>
                                                                Import Selected Organizations
                                                                <ArrowRight className="h-4 w-4 animate-arrow" />
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                <div className="flex-[0.3]">
                                                    <Button
                                                        onClick={() => setStep(4)}
                                                        disabled={importingOrgs}
                                                        variant="outline"
                                                        className="w-full h-11 border-slate-300 hover:bg-slate-100 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                                    >
                                                        Skip
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Create Organization */}
                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-8 text-center">
                                    <div className="h-16 w-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 mx-auto shadow-lg">
                                        <Building2 className="h-8 w-8 text-white" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Create Organization</h1>
                                    <p className="text-slate-500 text-sm">
                                        Enter your workspace details below to setup your Organization.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                        {/* Organization */}
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="customOrgName" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-slate-500" />
                                                    Organization Name
                                                </Label>
                                                <div className="flex items-center gap-3">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={orgChecked}
                                                                    onChange={(e) => {
                                                                        const val = e.target.checked
                                                                        setOrgChecked(val)
                                                                        if (!val) {
                                                                            setCustomOrgName('')
                                                                            setClientChecked(false)
                                                                            setCustomClientName('')
                                                                            setProjectChecked(false)
                                                                            setCustomProjectName('')
                                                                            setShowCustomClient(false)
                                                                            setShowCustomProject(false)
                                                                        }
                                                                    }}
                                                                    className="h-5 w-5 rounded border-slate-300 accent-slate-900 transition-all cursor-pointer"
                                                                />
                                                            </TooltipTrigger>
                                                            <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                <p className="text-[10px] font-bold">{orgChecked ? 'Uncheck to skip creation' : 'Check to create'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <div className="relative flex-1 group">
                                                        <Input
                                                            id="customOrgName"
                                                            placeholder="e.g., Acme Corp"
                                                            value={customOrgName}
                                                            onChange={(e) => {
                                                                setCustomOrgName(e.target.value)
                                                                if (e.target.value.trim()) setOrgChecked(true)
                                                            }}
                                                            disabled={creatingCustomWorkspace}
                                                            className="w-full pl-4 pr-32 py-3 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900 transition-all font-bold h-11 text-base"
                                                        />
                                                        {customOrgName.trim() && !showCustomClient && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <button
                                                                            onClick={(e) => { e.preventDefault(); setShowCustomClient(true); }}
                                                                            className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 rounded-full transition-all shadow-md group-hover:scale-110"
                                                                        >
                                                                            <ArrowRight className="h-4 w-4" />
                                                                        </button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                        <p className="text-[10px] font-bold">Add Client</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Client */}
                                        {showCustomClient && (
                                            <div className="pl-6 border-l-2 border-slate-200 space-y-4 ml-3 animate-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-2">
                                                    <Label htmlFor="customClientName" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-slate-400" />
                                                        Client
                                                        <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-500 uppercase tracking-tighter border border-slate-200">Optional</span>
                                                    </Label>
                                                    <div className="flex items-center gap-3">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={clientChecked}
                                                                        onChange={(e) => {
                                                                            const val = e.target.checked
                                                                            setClientChecked(val)
                                                                            if (!val) {
                                                                                setCustomClientName('')
                                                                                setProjectChecked(false)
                                                                                setCustomProjectName('')
                                                                                setShowCustomProject(false)
                                                                            }
                                                                        }}
                                                                        className="h-5 w-5 rounded border-slate-300 accent-slate-900 transition-all cursor-pointer"
                                                                    />
                                                                </TooltipTrigger>
                                                                <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                    <p className="text-[10px] font-bold">{clientChecked ? 'Uncheck to skip client' : 'Check to add client'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <div className="relative flex-1 group">
                                                            <Input
                                                                id="customClientName"
                                                                placeholder="e.g., Marketing Dept"
                                                                value={customClientName}
                                                                onChange={(e) => {
                                                                    setCustomClientName(e.target.value)
                                                                    if (e.target.value.trim()) setClientChecked(true)
                                                                }}
                                                                disabled={creatingCustomWorkspace || !orgChecked}
                                                                className="w-full pl-4 pr-32 py-2 border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-slate-900 transition-all h-11 font-semibold text-sm"
                                                            />
                                                            {customClientName.trim() && !showCustomProject && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <button
                                                                                onClick={(e) => { e.preventDefault(); setShowCustomProject(true); }}
                                                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 rounded-full transition-all shadow-md group-hover:scale-110"
                                                                            >
                                                                                <ArrowRight className="h-4 w-4" />
                                                                            </button>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                            <p className="text-[10px] font-bold">Add Project</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Project */}
                                                {showCustomProject && (
                                                    <div className="pl-6 border-l-2 border-slate-200 ml-3 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                        <Label htmlFor="customProjectName" className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                                            <Briefcase className="h-4 w-4 text-slate-400" />
                                                            Project
                                                            <span className="ml-1 px-1.5 py-0.5 rounded text-[8px] font-black bg-slate-100 text-slate-400 uppercase tracking-tighter border border-slate-200">Optional</span>
                                                        </Label>
                                                        <div className="flex items-center gap-3">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={projectChecked}
                                                                            onChange={(e) => {
                                                                                const val = e.target.checked
                                                                                setProjectChecked(val)
                                                                                if (!val) setCustomProjectName('')
                                                                            }}
                                                                            className="h-5 w-5 rounded border-slate-300 accent-slate-900 transition-all cursor-pointer"
                                                                        />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent side="top" className="bg-white text-slate-900 border border-slate-200 shadow-lg px-2 py-1">
                                                                        <p className="text-[10px] font-bold">{projectChecked ? 'Uncheck to skip project' : 'Check to add project'}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                            <Input
                                                                id="customProjectName"
                                                                placeholder="e.g., Q3 Campaign"
                                                                value={customProjectName}
                                                                onChange={(e) => {
                                                                    setCustomProjectName(e.target.value)
                                                                    if (e.target.value.trim()) setProjectChecked(true)
                                                                }}
                                                                disabled={creatingCustomWorkspace || !clientChecked}
                                                                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-700 focus:ring-2 focus:ring-slate-900 transition-all h-11 font-medium text-sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <span>{error}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-3 pt-4">
                                        <Button
                                            onClick={handleCreateCustomWorkspace}
                                            disabled={creatingCustomWorkspace || !customOrgName.trim() || !orgChecked}
                                            className="flex-[7] bg-slate-900 hover:bg-slate-800 text-white h-11 text-sm font-bold shadow-md shadow-slate-200 transition-all active:scale-[0.98] cta-hover-arrow flex items-center justify-center gap-2"
                                        >
                                            {creatingCustomWorkspace ? (
                                                <>
                                                    <LoadingSpinner size="sm" className="mr-2" />
                                                    Finalizing...
                                                </>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    Finish Organization Setup
                                                    <ArrowRight className="h-4 w-4 animate-arrow" />
                                                </div>
                                            )}
                                        </Button>

                                        <Button
                                            onClick={handleFinish}
                                            disabled={creatingCustomWorkspace}
                                            variant="outline"
                                            className="flex-[3] border-slate-200 hover:bg-slate-50 text-slate-600 h-11 text-sm font-medium transition-all flex items-center justify-center gap-2"
                                        >
                                            Skip
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
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
