"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { CheckCircle2, ArrowRight, ArrowLeft, Building2, LogIn, PlusCircle, Settings, Lock, AlertCircle, Users, Briefcase, HardDrive, FolderOpen, Folder, Plus, FolderTree, Inbox, Info, Copy, Terminal as TerminalIcon, Check, Loader2 } from "lucide-react"
import { GoogleDriveIcon } from "@/components/ui/google-drive-icon"
import { GoogleSharedDriveIcon } from "@/components/ui/google-shared-drive-icon"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    joinOrganizationByDomain,
    type DomainOnboardingOptions,
    type DomainOrgOption
} from "@/lib/actions/domain-onboarding"
import { useOnboarding } from "@/lib/onboarding-context"
import { createTestOrganization } from "@/lib/services/test-org-generator"
import { detectAllOrganizations, importMultipleOrganizations } from "@/lib/services/auto-import"
import { SANDBOX_HIERARCHY, SANDBOX_ORG_NAME } from "@/lib/services/sample-file-service"
import { BRAND_NAME } from "@/config/brand"
import { logger } from '@/lib/logger'
import { buildUserSettingsPlus } from '@/lib/actions/user-settings'
import { getUserOrganizations } from '@/lib/actions/organizations'
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { supabase } from "@/lib/supabase"
import { GooglePickerButton } from "@/components/google-drive/google-picker-button"

/**
 * Get current access token.
 * Calls getUser() first (server-side verification) to satisfy Supabase's security recommendation,
 * then reads the session token. Each API call also verifies the token server-side.
 */
// --- Progress component for Onboarding (light-theme planning-mode style) ---
const OnboardingTerminal = ({ steps, activeStepIndex }: { steps: string[], activeStepIndex: number }) => {
    const [completedCount, setCompletedCount] = useState(0)
    const [inProgressStep, setInProgressStep] = useState<string | null>(null)
    const [currentText, setCurrentText] = useState("")
    const [isTyping, setIsTyping] = useState(false)
    const activeRowRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        activeRowRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' })
    }, [activeStepIndex])

    useEffect(() => {
        if (activeStepIndex < 0 || activeStepIndex >= steps.length) return

        const fullText = steps[activeStepIndex]

        setCompletedCount(activeStepIndex)
        setCurrentText("")
        setIsTyping(true)
        setInProgressStep(null)

        let i = 0
        const typingSpeed = Math.random() * 25 + 12
        const timer = setInterval(() => {
            setCurrentText(fullText.slice(0, i + 1))
            i++
            if (i >= fullText.length) {
                clearInterval(timer)
                setIsTyping(false)
                setCurrentText("")
                setInProgressStep(fullText)
            }
        }, typingSpeed)

        return () => clearInterval(timer)
    }, [activeStepIndex, steps]) // eslint-disable-line react-hooks/exhaustive-deps

    const total = steps.length
    const inProgressLabel = isTyping ? 'Starting…' : inProgressStep ? 'In progress' : ''

    return (
        <div className="bg-white rounded-xl p-4 font-mono text-[13px] leading-relaxed shadow-sm border border-slate-200 flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Progress</span>
                <span className="text-xs text-slate-400">
                    {completedCount} of {total} steps completed
                </span>
                {inProgressLabel && (
                    <span className="ml-auto text-[10px] text-amber-600 font-medium flex items-center gap-1">
                        {!isTyping && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
                        {inProgressLabel}
                    </span>
                )}
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {steps.map((step, idx) => {
                    const isCompleted = idx < completedCount
                    const isCurrent = idx === activeStepIndex
                    const isCurrentTyping = isCurrent && isTyping
                    const isCurrentWaiting = isCurrent && !isTyping && !!inProgressStep
                    const isPending = idx > activeStepIndex

                    return (
                        <div
                            key={idx}
                            ref={(isCurrentTyping || isCurrentWaiting) ? activeRowRef : undefined}
                            className="flex items-center gap-3 py-0.5"
                        >
                            {isCompleted && (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-900 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-slate-900" strokeWidth={2.5} />
                                </div>
                            )}
                            {(isCurrentTyping || isCurrentWaiting) && (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 bg-amber-50 flex items-center justify-center flex-shrink-0">
                                    <Loader2 className="h-3 w-3 text-amber-600 animate-spin" strokeWidth={2.5} />
                                </div>
                            )}
                            {isPending && (
                                <div className="h-5 w-5 rounded-full border-2 border-slate-300 flex-shrink-0" />
                            )}

                            <span
                                className={
                                    isCompleted
                                        ? 'text-slate-500 truncate'
                                        : isCurrent
                                            ? 'text-slate-900 font-medium truncate'
                                            : 'text-slate-400 truncate'
                                }
                            >
                                {isCurrentTyping ? (
                                    <>
                                        {currentText}
                                        <span className="inline-block w-2 h-3.5 bg-slate-400 ml-0.5 animate-[blink_1s_infinite] align-middle" />
                                    </>
                                ) : (
                                    step
                                )}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/** Progress indicator for org tree: todo = rounded empty circle, completed = tick mark in rounded circle, in progress = spinner. */
function OrgTreeProgressCheck({ status, size = 'md' }: { status: 'completed' | 'inProgress' | 'pending'; size?: 'sm' | 'md' | 'lg' }) {
    const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
    const iconClass = size === 'sm' ? 'h-2 w-2' : size === 'lg' ? 'h-3 w-3' : 'h-2.5 w-2.5'
    if (status === 'completed') {
        return (
            <div className={`${sizeClass} rounded-full border-2 border-slate-900 flex items-center justify-center flex-shrink-0`}>
                <Check className={`${iconClass} text-slate-900`} strokeWidth={2.5} />
            </div>
        )
    }
    if (status === 'inProgress') {
        return (
            <div className={`${sizeClass} rounded-full border-2 border-slate-300 bg-amber-50 flex items-center justify-center flex-shrink-0`}>
                <Loader2 className={`${iconClass} text-amber-600 animate-spin`} strokeWidth={2.5} />
            </div>
        )
    }
    return (
        <div className={`${sizeClass} rounded-full border-2 border-slate-300 flex-shrink-0`} />
    )
}

async function getAccessToken(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ?? null
}

/** Shown when the user lands on /d/onboarding but has already completed it. Auto-redirects after 3s. */
const AlreadyCompletedScreen = ({ onGoToDashboard }: { onGoToDashboard: () => void }) => {
    const [countdown, setCountdown] = useState(3)
    useEffect(() => {
        const t = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) { clearInterval(t); onGoToDashboard(); return 0 }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(t)
    }, [onGoToDashboard])

    return (
        <div className="animate-in fade-in duration-500 text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-6 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-3">You're all set!</h1>
            <p className="text-slate-500 mb-2">
                Onboarding has already been completed for your account.
            </p>
            <p className="text-sm text-slate-400 mb-8">
                Redirecting to your dashboard in <span className="font-semibold text-slate-600">{countdown}s</span>…
            </p>
            <button
                onClick={onGoToDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
            >
                Go to Dashboard <ArrowRight className="h-4 w-4" />
            </button>
        </div>
    )
}

/** Inline toggle to allow/deny same-domain users from joining the org without an invite. */
const DomainAccessToggle = ({
    value,
    onChange,
    userEmail,
}: {
    value: boolean
    onChange: (v: boolean) => void
    userEmail?: string | null
}) => {
    const domain = userEmail?.includes('@') ? userEmail.split('@')[1] : null
    return (
        <div className="mt-4 flex items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">Allow team members to join via domain</p>
                <p className="text-xs text-slate-500 mt-0.5">
                    {domain
                        ? <>Anyone with a <span className="font-medium text-slate-700">@{domain}</span> email can join without an invite</>
                        : 'Anyone with the same email domain can join without an invite'}
                </p>
            </div>
            <button
                type="button"
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${value ? 'bg-slate-900' : 'bg-slate-300'}`}
                role="switch"
                aria-checked={value}
            >
                <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform duration-200 ${value ? 'translate-x-5' : 'translate-x-0'}`}
                />
            </button>
        </div>
    )
}

const OnboardingContent = () => {
    const { session, user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { setOnboarding, markStepSkipped } = useOnboarding()
    const { addToast } = useToast()

    // Refs to prevent duplicate calls
    const initialCheckDoneRef = useRef(false)
    const detectOrgsDoneRef = useRef(false)
    const popupRef = useRef<Window | null>(null)

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
    const [isFetchingAuthUrl, setIsFetchingAuthUrl] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionDetails, setConnectionDetails] = useState<{ accessToken?: string, connectionId?: string, clientId?: string } | null>(null)
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null)
    const [hasOpenedPopup, setHasOpenedPopup] = useState(false)
    const [previewDrive, setPreviewDrive] = useState<'My Drive' | 'Shared Drive' | null>(null)
    const [hasCopied, setHasCopied] = useState(false)
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false)

    // Step 2: Sandbox Setup (Mandatory)
    const [sandboxOrgName, setSandboxOrgName] = useState(SANDBOX_ORG_NAME)
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

    // Step 3: auto-forward message when no orgs
    const [autoForwardMessage, setAutoForwardMessage] = useState<string | null>(null)

    // Shared: domain access toggle (Import + Custom Org) — default ON
    const [allowDomainAccess, setAllowDomainAccess] = useState(true)

    // Step 4: Custom Organization Setup
    const [customOrgName, setCustomOrgName] = useState('')
    const [customClientName, setCustomClientName] = useState('')
    const [customProjectName, setCustomProjectName] = useState('')
    const [customSubStep, setCustomSubStep] = useState<0 | 1 | 2>(0)
    const [creatingCustomWorkspace, setCreatingCustomWorkspace] = useState(false)
    const [terminalSteps, setTerminalSteps] = useState<string[]>([])
    const [activeTerminalIndex, setActiveTerminalIndex] = useState(-1)

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
        // Always redirect to /d (Workspace Selector) after onboarding
        router.push('/d')
    }

    const handleConnectDrive = () => {
        if (authUrl) {
            window.location.href = authUrl
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setHasCopied(true)
        addToast({
            title: "Copied!",
            message: `"${text}" copied to clipboard.`,
            type: "success"
        })
    }

    const handleOpenDrivePopup = () => {
        if (!connectedEmail) return

        const width = 1000
        const height = 750
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2

        const driveSlug = previewDrive === 'My Drive' ? 'my-drive' : 'shared-drives'
        const driveUrl = `https://drive.google.com/drive/${driveSlug}`

        // Use AccountChooser to nudge towards the connected email
        const url = `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(connectedEmail)}&continue=${encodeURIComponent(driveUrl)}`

        const popup = window.open(url, 'PockettDriveSetup',
            `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=no,noopener,noreferrer`
        )
        popupRef.current = popup
        setHasOpenedPopup(true)
    }

    const handleFinalStepClick = () => {
        logger.debug("Onboarding: handleFinalStepClick - closing Drive popup if open")
        if (popupRef.current && !popupRef.current.closed) {
            popupRef.current.close()
            popupRef.current = null
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
                    // After successfully selecting a root folder, move to Sandbox setup
                    setStep(2)
                }
            } catch (e) {
                logger.error("Failed to update root folder", e as Error)
            }
        }
    }

    const handleCreateSandbox = async () => {
        setCreatingSandbox(true)
        setError(null)

        const ONBOARDING_CREATING_KEY = 'pockett_onboarding_creating'
        const orgName = sandboxOrgName || SANDBOX_ORG_NAME
        sessionStorage.setItem(ONBOARDING_CREATING_KEY, JSON.stringify({
            type: 'sandbox',
            orgName,
            startedAt: Date.now()
        }))

        const dynamicSteps = [
            "Initializing workspace engine...",
            "Connecting to Google Drive API...",
            `Creating Sandbox Organization: ${orgName}...`,
            ...SANDBOX_HIERARCHY.flatMap(client => [
                `Setting up client: ${client.clientName}...`,
                ...client.projects.map(p => `Creating project: ${p.name}...`)
            ]),
            "Finalizing and indexing workspace..."
        ]
        setTerminalSteps(dynamicSteps)
        setActiveTerminalIndex(0)

        // Simulate progress during batch — cap at 85% so we don't sit at "17/18" for long
        const totalSteps = dynamicSteps.length
        const progressCap = Math.max(totalSteps - 3, Math.floor(totalSteps * 0.85))
        const progressInterval = setInterval(() => {
            setActiveTerminalIndex((prev) => (prev < progressCap ? prev + 1 : prev))
        }, Math.max(1500, 20000 / totalSteps))

        try {
            const token = await getAccessToken()
            if (!token) {
                sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
                clearInterval(progressInterval)
                setError('Session expired. Please sign in again.')
                setCreatingSandbox(false)
                return
            }

            setActiveTerminalIndex(1)

            // Batched API: single call creates org + all clients + all projects (replaces 15 sequential calls)
            const res = await fetch('/api/onboarding/create-sandbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    connectionId: connectionDetails?.connectionId || null,
                    sandboxOrgName: orgName
                })
            })

            sessionStorage.removeItem(ONBOARDING_CREATING_KEY)

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Failed to create Sandbox')
            }

            setActiveTerminalIndex(totalSteps - 1)

            // Update UI immediately so user sees transition (don't block on refresh/cache)
            setCreatingSandbox(false)
            setStep(3)

            // Refresh session and cache in background (must not block UI)
            supabase.auth.refreshSession().catch((err) => logger.warn('Session refresh after sandbox', err))
            buildUserSettingsPlus().catch((err) => logger.warn('Cache rebuild after sandbox', err))
        } catch (err: any) {
            sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
            const msg = err.message || 'Error generating sandbox workspace'
            const isNetworkError = /failed to fetch|network error|load failed/i.test(msg)
            setError(
                isNetworkError
                    ? 'Connection error. Please ensure the database is running (e.g. supabase start for local dev) and try again.'
                    : msg
            )
            logger.error('Error generating sandbox context during onboarding', err as Error)
        } finally {
            clearInterval(progressInterval)
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

        const hasClient = !!customClientName.trim()
        const hasProject = hasClient && !!customProjectName.trim()

        const steps = [
            `Initializing workspace for: ${customOrgName}...`,
            "Setting up Google Drive folder structure...",
            "Registering organization in Pockett...",
            ...(hasClient ? [`Creating client folder: ${customClientName}...`] : []),
            ...(hasProject ? [`Setting up project: ${customProjectName}...`] : []),
            "Applying Pockett metadata tags...",
            "Redirecting to your new dashboard..."
        ]
        setTerminalSteps(steps)
        setActiveTerminalIndex(0)

        const ONBOARDING_CREATING_KEY = 'pockett_onboarding_creating'
        try {
            sessionStorage.setItem(ONBOARDING_CREATING_KEY, JSON.stringify({
                type: 'custom',
                orgName: customOrgName.trim(),
                startedAt: Date.now()
            }))

            const token = await getAccessToken()
            if (!token) {
                sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
                setError('Session expired. Please sign in again.')
                setCreatingCustomWorkspace(false)
                return
            }

            // Batched API: single call creates org + client + project (replaces 3–4 sequential calls)
            const progressInterval = setInterval(() => {
                setActiveTerminalIndex((prev) => (prev < steps.length - 2 ? prev + 1 : prev))
            }, 400)

            const res = await fetch('/api/onboarding/create-custom-workspace', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    connectionId: connectionDetails?.connectionId || null,
                    orgName: customOrgName.trim(),
                    clientName: hasClient ? customClientName.trim() : null,
                    projectName: hasProject ? customProjectName.trim() : null,
                    allowDomainAccess
                })
            })

            clearInterval(progressInterval)
            sessionStorage.removeItem(ONBOARDING_CREATING_KEY)

            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'Failed to create workspace')
            }

            const orgData = await res.json()
            if (orgData.organizationSlug) setDefaultOrgSlug(orgData.organizationSlug)

            setActiveTerminalIndex(steps.length - 2)
            setTimeout(async () => {
                setActiveTerminalIndex(steps.length - 1)
                try {
                    await supabase.auth.refreshSession()
                    await buildUserSettingsPlus()
                } catch (err) {
                    logger.warn('Session/cache refresh before redirect failed', err as Error)
                }
                await handleFinish()
            }, 800)

        } catch (err: any) {
            sessionStorage.removeItem('pockett_onboarding_creating')
            setError(err.message || 'Error generating custom workspace')
            logger.error('Error generating custom context during onboarding', err as Error)
            setCreatingCustomWorkspace(false)
        }
    }

    const handleDetectOrganizations = async () => {
        setDetectedOrgsLoading(true)
        setError(null)
        setTerminalSteps(['Scanning Google Drive for Pockett workspaces...'])
        setActiveTerminalIndex(0)

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

                if (orgs.length === 0) {
                    markStepSkipped(3)
                    setAutoForwardMessage("No existing organizations found — moving to next step...")
                    setTimeout(() => {
                        setAutoForwardMessage(null)
                        setStep(4)
                    }, 2000)
                    return
                }

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

        const importSteps = [
            `Scanning ${selectedOrgIds.length} selected items...`,
            "Establishing secure connection to Google Drive...",
            "Reading folder metadata and structure...",
            "Registering organizations in Pockett registry...",
            "Mapping client hierarchies and projects...",
            "Persisting workspace settings...",
            "Finalizing organization setup..."
        ]
        setTerminalSteps(importSteps)
        setActiveTerminalIndex(0)

        try {
            const token = await getAccessToken()
            if (!token) {
                setError('Session expired. Please sign in again.')
                setImportingOrgs(false)
                return
            }

            // Advance a couple of steps to show "connecting" while the single API call runs
            setActiveTerminalIndex(1)
            setTimeout(() => setActiveTerminalIndex(2), 800)
            setTimeout(() => setActiveTerminalIndex(3), 2000)

            const res = await fetch('/api/onboarding/import-orgs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    connectionId: connectionDetails?.connectionId,
                    selectedOrgIds: selectedOrgIds,
                    newOrgName: orgName.trim() ? orgName : undefined,
                    allowDomainAccess
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

                setActiveTerminalIndex(4)
                setTimeout(() => setActiveTerminalIndex(5), 400)
                setTimeout(() => setActiveTerminalIndex(6), 800)
                setTimeout(async () => {
                    try {
                        await supabase.auth.refreshSession()
                        await buildUserSettingsPlus()
                    } catch (err) {
                        logger.warn('Session/cache refresh after import failed', err as Error)
                    }
                    setStep(4)
                    setImportingOrgs(false)
                }, 1500)
            } else {
                const err = await res.json()
                setError(err.error || 'Failed to import organizations')
                setImportingOrgs(false)
            }
        } catch (err: any) {
            setError(err.message || 'Failed to import organizations')
            logger.error('Error importing orgs', err as Error)
            setImportingOrgs(false)
        }
    }

    // Sync progress when returning to page: if creation was in progress (user navigated away), check if org exists and redirect
    const syncCreationProgress = useCallback(async () => {
        const ONBOARDING_CREATING_KEY = 'pockett_onboarding_creating'
        const raw = sessionStorage.getItem(ONBOARDING_CREATING_KEY)
        if (!raw) return
        let storedOrgName: string | undefined
        let startedAt: number | undefined
        try {
            const parsed = JSON.parse(raw) as { orgName?: string; startedAt?: number }
            storedOrgName = parsed.orgName
            startedAt = parsed.startedAt
        } catch {
            sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
            return
        }
        if (!storedOrgName || startedAt == null || Date.now() - startedAt > 10 * 60 * 1000) {
            sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
            return
        }
        try {
            const orgs = await getUserOrganizations()
            const match = orgs.find(o => o.name.toLowerCase() === storedOrgName.toLowerCase())
            if (match) {
                sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
                router.push('/d')
            }
        } catch {
            // Ignore — user may not be signed in yet
        }
    }, [router])

    useEffect(() => {
        syncCreationProgress()
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') syncCreationProgress()
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [syncCreationProgress])

    // When tab becomes visible during creation, re-check if org exists (handles browser throttling of setInterval in background)
    const syncCreatingStateOnVisible = useCallback(async () => {
        if (document.visibilityState !== 'visible') return
        const ONBOARDING_CREATING_KEY = 'pockett_onboarding_creating'
        if (!creatingSandbox && !creatingCustomWorkspace) return

        const orgNameToCheck = creatingSandbox ? (sandboxOrgName || SANDBOX_ORG_NAME) : customOrgName.trim()
        if (!orgNameToCheck) return

        try {
            const orgs = await getUserOrganizations()
            const match = orgs.find(o => o.name.toLowerCase() === orgNameToCheck.toLowerCase())
            if (match) {
                sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
                if (creatingSandbox) {
                    setCreatingSandbox(false)
                    setStep(3)
                } else {
                    setCreatingCustomWorkspace(false)
                    if (match.slug) setDefaultOrgSlug(match.slug)
                    router.push('/d')
                }
            }
        } catch {
            // Ignore — user may not be signed in yet
        }
    }, [creatingSandbox, creatingCustomWorkspace, sandboxOrgName, customOrgName, router])

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') syncCreatingStateOnVisible()
        }
        document.addEventListener('visibilitychange', handleVisibility)
        return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [syncCreatingStateOnVisible])

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

                        // When rootFolderId is set (e.g. by callback with default _Pockett_Workspace_),
                        // skip Configure Workspace Home and show Sandbox (2) or later step.
                        let nextStep = 1
                        if (fetchedRootId) {
                            nextStep = savedStep && savedStep > 2 ? savedStep : 2
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
                                // Invited members (non-owners) should never see the onboarding flow —
                                // redirect them straight to their org workspace.
                                const { data: { user: currentUser } } = await supabase.auth.getUser()
                                const userMembership = resolvedOrg.members?.find((m: any) => m.userId === currentUser?.id)
                                const isOwner = userMembership?.role === 'org_admin'

                                if (!isOwner && resolvedOrg.slug) {
                                    router.replace(`/d/o/${resolvedOrg.slug}`)
                                    return
                                }

                                setExistingOrg(resolvedOrg)
                                setOrgName(resolvedOrg.name || "")
                                setNewOrgSlug(resolvedOrg.slug)
                                setDefaultOrgSlug(resolvedOrg.slug)

                                const settings = (resolvedOrg as any).settings as any
                                let onboarding = settings?.onboarding
                                let fetchedRootId = rootFolderId
                                let connectorOnboarding: { isComplete?: boolean; currentStep?: number } | null = null

                                // Fetch connector status first — onboarding state lives in connector settings, not org
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
                                        connectorOnboarding = statusData.connector?.onboarding ?? null
                                        if (statusData.connector?.rootFolderId) {
                                            fetchedRootId = statusData.connector.rootFolderId
                                            setRootFolderId(fetchedRootId)
                                        }
                                    }
                                } catch (err) {
                                    logger.warn('Failed to fetch connector status during normal load', err as Error)
                                }

                                // Prefer connector onboarding (source of truth) over org settings
                                if (connectorOnboarding) {
                                    onboarding = { ...(onboarding || {}), ...connectorOnboarding }
                                }

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
                                                // Onboarding complete, no domain options → show completed screen then redirect
                                                setStep(-1)
                                            }
                                        } else {
                                            // Can't load domain options → still completed
                                            setStep(-1)
                                        }
                                    } catch (err) {
                                        logger.error('Failed to load domain options', err as Error)
                                        setStep(-1)
                                    }
                                } else {
                                    // Resume from current step
                                    let savedStep = onboarding?.currentStep ?? 1
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

    // Fetch authUrl when step is 1 (Google Drive connection). Not static: button stays disabled until this completes.
    useEffect(() => {
        if (step === 1 && !isConnected && user?.id) {
            setIsFetchingAuthUrl(true)
            const fetchAuthUrl = async () => {
                try {
                    const token = await getAccessToken()
                    if (!token) {
                        setError('Session expired. Please sign in again.')
                        setIsFetchingAuthUrl(false)
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
                                setIsFetchingAuthUrl(false)
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
                } finally {
                    setIsFetchingAuthUrl(false)
                }
            }
            fetchAuthUrl()
        } else {
            setIsFetchingAuthUrl(false)
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
                <div className="w-full h-full overflow-y-auto px-8 pt-6 pb-8 flex justify-center">
                    <div className="w-full max-w-2xl">
                        {/* Onboarding Already Completed — redirect guard */}
                        {step === -1 && (
                            <AlreadyCompletedScreen onGoToDashboard={() => router.push('/d')} />
                        )}

                        {/* Domain Choice Screen (Step 0) */}
                        {step === 0 && domainOptions && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-4">
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

                        {/* Step 1: Google Drive Connection + Configure Workspace Home (hidden when rootFolderId already set by default _Pockett_Workspace_) */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-4 flex items-center justify-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                        <GoogleDriveIcon size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Configure Workspace Home</h1>
                                        <p className="text-sm text-slate-500">
                                            Link your Google Drive to start organizing your files
                                        </p>
                                    </div>
                                </div>

                                {isConnected ? (
                                    <div className="space-y-4 text-left border-t border-slate-100 pt-4">
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
                                            <div className="space-y-5">
                                                {/* 1. FORCED SELECTION PHASE */}
                                                {!previewDrive ? (
                                                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                                                        <div className="text-center mb-4">
                                                            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block">1. Select Storage Type</Label>
                                                            <h2 className="text-xl font-bold text-slate-900">Where should Pockett organize?</h2>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <button
                                                                onClick={() => setPreviewDrive('My Drive')}
                                                                className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-900 hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                                                            >
                                                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 text-slate-400 group-hover:text-slate-900 transition-all duration-300">
                                                                    <GoogleDriveIcon size={28} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="font-black text-slate-900">My Drive</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Personal account</p>
                                                                </div>
                                                            </button>

                                                            <button
                                                                onClick={() => setPreviewDrive('Shared Drive')}
                                                                className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 border-slate-100 bg-white hover:border-slate-900 hover:shadow-xl transition-all duration-300 active:scale-[0.98]"
                                                            >
                                                                <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 text-slate-400 group-hover:text-slate-900 transition-all duration-300">
                                                                    <GoogleSharedDriveIcon size={28} />
                                                                </div>
                                                                <div className="text-center">
                                                                    <p className="font-black text-slate-900">Shared Drive</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Team workspace</p>
                                                                    <p className="text-[11px] text-slate-500 font-bold mt-2 leading-tight max-w-[140px]">Recommended for business domains</p>
                                                                </div>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                                                        {/* FOLDER TREE VISUAL */}
                                                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden">
                                                            {/* Change Selection Link */}
                                                            <button
                                                                onClick={() => { setPreviewDrive(null); setHasCopied(false); }}
                                                                className="absolute top-6 right-8 text-[10px] font-black text-slate-400 hover:text-slate-900 uppercase tracking-widest flex items-center gap-1 transition-colors"
                                                            >
                                                                Change Storage
                                                                <Settings className="h-3 w-3" />
                                                            </button>

                                                            <div className="space-y-0 font-mono text-sm">
                                                                {/* Root Node */}
                                                                <div className="flex items-center gap-3 py-2 text-slate-400">
                                                                    <FolderOpen className="h-5 w-5 opacity-40" />
                                                                    <span className="font-bold uppercase tracking-tight">{previewDrive}</span>
                                                                </div>

                                                                {/* Level 1: Pockett Workspace */}
                                                                <div className="relative pl-6">
                                                                    <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />
                                                                    <div className="absolute left-2 top-1/2 w-4 h-px bg-slate-200" />

                                                                    <div className={`mt-2 flex items-center justify-between p-4 rounded-2xl transition-all duration-500 ${hasCopied ? 'bg-slate-50 border border-slate-100 opacity-60' : 'bg-slate-900 text-white shadow-xl ring-8 ring-slate-900/5'}`}>
                                                                        <div className="flex items-center gap-3">
                                                                            <Folder className={`h-5 w-5 ${hasCopied ? 'text-slate-400' : 'text-white'}`} />
                                                                            <span className="font-black italic tracking-tight">Pockett Workspace</span>
                                                                        </div>
                                                                        {!hasCopied && (
                                                                            <button
                                                                                onClick={() => copyToClipboard("Pockett Workspace")}
                                                                                className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-xl font-bold text-[10px] uppercase tracking-wide hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
                                                                            >
                                                                                <Copy className="h-3.5 w-3.5" />
                                                                                Copy Name
                                                                            </button>
                                                                        )}
                                                                        {hasCopied && <CheckCircle2 className="h-5 w-5 text-slate-900" />}
                                                                    </div>
                                                                </div>

                                                                {/* Expansion Phase: Revealed after copy */}
                                                                {hasCopied && (
                                                                    <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
                                                                        <div className="pl-6 relative">
                                                                            <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200" />

                                                                            {/* Organization */}
                                                                            <div className="relative pl-6 py-3 mt-2">
                                                                                <div className="absolute left-0 top-1/2 w-6 h-px bg-slate-200" />
                                                                                <div className="flex items-center gap-3 text-slate-600">
                                                                                    <Building2 className="h-4 w-4" />
                                                                                    <span className="font-bold underline decoration-slate-200 underline-offset-4 tracking-tight">Organization</span>
                                                                                </div>

                                                                                {/* Client */}
                                                                                <div className="relative pl-6 mt-4">
                                                                                    <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
                                                                                    <div className="absolute left-0 top-4 w-4 h-px bg-slate-200" />
                                                                                    <div className="flex items-center gap-3 text-slate-500">
                                                                                        <Users className="h-4 w-4" />
                                                                                        <span className="font-bold tracking-tight">Client</span>
                                                                                    </div>

                                                                                    {/* Project */}
                                                                                    <div className="relative pl-6 mt-4">
                                                                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-slate-200" />
                                                                                        <div className="absolute left-0 top-4 w-4 h-px bg-slate-200" />
                                                                                        <div className="flex items-center gap-3 text-slate-400">
                                                                                            <Briefcase className="h-4 w-4" />
                                                                                            <span className="font-bold tracking-tight">Project</span>
                                                                                        </div>

                                                                                        {/* Sub-folders */}
                                                                                        <div className="relative pl-6 mt-4 space-y-4">
                                                                                            <div className="absolute left-0 top-0 bottom-8 w-px bg-slate-200" />

                                                                                            <div className="relative flex items-center gap-3 text-slate-300">
                                                                                                <div className="absolute left-[-24px] top-1/2 w-6 h-px bg-slate-100" />
                                                                                                <Folder className="h-3.5 w-3.5" />
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[11px] font-bold">General</span>
                                                                                                    <span className="text-[9px] text-slate-400 italic font-medium -mt-1">(Public Documents)</span>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="relative flex items-center gap-3 text-slate-300">
                                                                                                <div className="absolute left-[-24px] top-1/2 w-6 h-px bg-slate-100" />
                                                                                                <Lock className="h-3.5 w-3.5" />
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[11px] font-bold">Confidential</span>
                                                                                                    <span className="text-[9px] text-slate-400 italic font-medium -mt-1">(Restricted Sensitive Documents)</span>
                                                                                                </div>
                                                                                            </div>

                                                                                            <div className="relative flex items-center gap-3 text-slate-300">
                                                                                                <div className="absolute left-[-24px] top-1/2 w-6 h-px bg-slate-100" />
                                                                                                <Inbox className="h-3.5 w-3.5" />
                                                                                                <div className="flex flex-col">
                                                                                                    <span className="text-[11px] font-bold">Staging</span>
                                                                                                    <span className="text-[9px] text-slate-400 italic font-medium -mt-1">(Document Intake Holding Area)</span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Actions reveal after Copy */}
                                                        {hasCopied && (
                                                            <div className="animate-in fade-in slide-in-from-top-6 duration-1000 space-y-4 mt-12">
                                                                <button
                                                                    onClick={handleOpenDrivePopup}
                                                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white p-6 rounded-2xl flex items-center justify-between group transition-all duration-300 active:scale-[0.98] shadow-xl shadow-slate-200"
                                                                >
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                                            <PlusCircle className="h-6 w-6" />
                                                                        </div>
                                                                        <div className="text-left">
                                                                            <p className="font-black tracking-tight uppercase text-xs opacity-60">Step 3</p>
                                                                            <p className="text-lg font-black tracking-tight">
                                                                                {previewDrive === 'My Drive' ? "Automagically Create Workspace" : `Create Workspace in ${previewDrive}`}
                                                                            </p>
                                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                                                                                {previewDrive === 'My Drive' ? "One-click setup • Avoids picker" : "Requires manual step in Google Drive"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                                                </button>

                                                                <div className={`transition-all duration-500 ${hasOpenedPopup ? 'opacity-100 scale-100' : 'opacity-30 scale-[0.98] pointer-events-none'}`}>
                                                                    {connectionDetails?.connectionId ? (
                                                                        <GooglePickerButton
                                                                            connectionId={connectionDetails.connectionId}
                                                                            mode="select-folder"
                                                                            query="Pockett Workspace"
                                                                            driveType={previewDrive || 'My Drive'}
                                                                            onImport={handleRootFolderSelected}
                                                                        >
                                                                            <button
                                                                                onClick={handleFinalStepClick}
                                                                                className="w-full bg-white border-2 border-slate-900 text-slate-900 p-6 rounded-2xl flex items-center justify-between group transition-all hover:bg-slate-50 active:scale-[0.98]"
                                                                            >
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                                                                        {hasOpenedPopup ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
                                                                                    </div>
                                                                                    <div className="text-left">
                                                                                        <p className="font-black tracking-tight uppercase text-[10px] opacity-60">Final step</p>
                                                                                        <p className="text-lg font-black tracking-tight">Select Created Folder</p>
                                                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Teleports you straight to "Pockett Workspace"</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-colors">PICKER</span>
                                                                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                                                                </div>
                                                                            </button>
                                                                        </GooglePickerButton>
                                                                    ) : (
                                                                        <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center gap-3">
                                                                            <LoadingSpinner size="md" />
                                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Waking up secure picker...</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
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

                                                <div className="pt-2">
                                                    <Button
                                                        onClick={() => setStep(2)}
                                                        className="w-full py-6 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-lg active:scale-[0.98] cta-hover-arrow flex items-center justify-center gap-2"
                                                    >
                                                        Continue to Sandbox Setup
                                                        <ArrowRight className="h-5 w-5 animate-arrow" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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
                                                disabled={!authUrl || isSubmitting || isFetchingAuthUrl}
                                                className="w-full h-12 flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <LoadingSpinner size="sm" className="mr-2" />
                                                        Connecting...
                                                    </>
                                                ) : isFetchingAuthUrl ? (
                                                    <>
                                                        <LoadingSpinner size="sm" className="mr-2" />
                                                        Preparing…
                                                    </>
                                                ) : (
                                                    <>
                                                        Connect Google Drive
                                                        <ArrowRight className="inline-block ml-2 h-4 w-4 animate-arrow" />
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Sandbox Organization (Mandatory) */}
                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-4 text-center">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-2 mx-auto">
                                        <Building2 className="h-5 w-5 text-slate-700" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Sandbox Organization</h1>
                                    <p className="text-sm text-slate-500">
                                        We strongly recommend a sample workspace to safely test out {BRAND_NAME}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Org/Client/Project tree — always visible */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 mb-5">
                                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <Info className="h-4 w-4 text-slate-600" />
                                            </div>
                                            <p className="text-xs text-slate-700 leading-relaxed">
                                                We'll create a <strong>Sandbox Workspace</strong> in your Google Drive with sample clients and projects so you can explore {BRAND_NAME} immediately.
                                            </p>
                                        </div>

                                        {/* Step indices for progress: 0 init, 1 connect, 2 org; then per client one step + per project one step */}
                                        {(() => {
                                            const ORG_STEP = 2
                                            const getClientStepIndex = (ci: number) =>
                                                3 + SANDBOX_HIERARCHY.slice(0, ci).reduce((s, c) => s + 1 + c.projects.length, 0)
                                            const getProjectStepIndex = (ci: number, pi: number) => getClientStepIndex(ci) + 1 + pi
                                            const nodeStatus = (stepIndex: number): 'completed' | 'inProgress' | 'pending' => {
                                                if (!creatingSandbox) return 'completed'
                                                if (activeTerminalIndex > stepIndex) return 'completed'
                                                if (activeTerminalIndex === stepIndex) return 'inProgress'
                                                return 'pending'
                                            }
                                            return (
                                                <>
                                                    {/* Org row */}
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <OrgTreeProgressCheck status={nodeStatus(ORG_STEP)} size="lg" />
                                                        <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                        <span className="text-sm font-semibold text-slate-900">{sandboxOrgName}</span>
                                                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Org</span>
                                                    </div>

                                                    {/* Clients + Projects indented tree */}
                                                    <div className="pl-6 border-l-2 border-slate-200 ml-2.5 space-y-4">
                                                        {SANDBOX_HIERARCHY.map((client, ci) => {
                                                            const clientStep = getClientStepIndex(ci)
                                                            return (
                                                                <div key={ci}>
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <OrgTreeProgressCheck status={nodeStatus(clientStep)} size="md" />
                                                                        <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                                        <span className="text-sm font-medium text-slate-700">{client.clientName}</span>
                                                                        <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Client</span>
                                                                    </div>
                                                                    <div className="pl-6 border-l-2 border-slate-100 ml-2.5 space-y-1.5">
                                                                        {client.projects.map((project, pi) => (
                                                                            <div key={pi} className="flex items-center gap-3">
                                                                                <OrgTreeProgressCheck status={nodeStatus(getProjectStepIndex(ci, pi))} size="sm" />
                                                                                <Briefcase className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                                                                                <span className="text-xs text-slate-500 italic">{project.name}</span>
                                                                                <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-full">Project</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </>
                                            )
                                        })()}
                                    </div>

                                    {/* Terminal — shown below the tree while building */}
                                    {creatingSandbox && (
                                        <div className="animate-in fade-in duration-300">
                                            <OnboardingTerminal
                                                steps={terminalSteps}
                                                activeStepIndex={activeTerminalIndex}
                                            />
                                            <p className="text-[10px] text-center text-slate-400 font-medium mt-2">
                                                Please do not close this window while we prepare your workspace.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="mt-4 flex gap-3">
                                    <Button
                                        onClick={handleCreateSandbox}
                                        disabled={creatingSandbox || !sandboxOrgName || isSubmitting || importingOrgs || creatingCustomWorkspace}
                                        className="w-[70%] h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow flex items-center justify-center gap-2"
                                    >
                                        {creatingSandbox ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                Building...
                                            </>
                                        ) : (
                                            <>
                                                Create Sandbox
                                                <ArrowRight className="h-4 w-4 animate-arrow" />
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { markStepSkipped(2); setStep(3) }}
                                        disabled={creatingSandbox || isSubmitting || importingOrgs || creatingCustomWorkspace}
                                        className="w-[30%] h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold disabled:opacity-30"
                                    >
                                        Skip
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Import Organization */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-4 text-center">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-2 mx-auto">
                                        <Building2 className="h-5 w-5 text-slate-700" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Import Organization</h1>
                                    <p className="text-sm text-slate-500">
                                        Check existing orphaned organizations from your Google Drive to import them as workspaces
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {detectedOrgsLoading ? (
                                        <div className="space-y-3 animate-in fade-in duration-300">
                                            <OnboardingTerminal
                                                steps={terminalSteps}
                                                activeStepIndex={activeTerminalIndex}
                                            />
                                            <p className="text-[10px] text-center text-slate-400 font-medium">
                                                Scanning your Google Drive for existing Pockett workspaces...
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {detectedOrgs.length === 0 ? (
                                                <div className="p-12 text-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
                                                    <Inbox className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                                    {autoForwardMessage ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <LoadingSpinner size="sm" />
                                                            <p className="text-sm text-slate-500 font-medium">{autoForwardMessage}</p>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-slate-600 font-medium">
                                                                No existing organizations found in your Google Drive.
                                                            </p>
                                                            <p className="text-xs text-slate-400 mt-1">
                                                                You can skip this step and create a custom organization manually.
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm opacity-100">
                                                    <h3 className="font-semibold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                                                        <FolderTree className="h-4 w-4 text-slate-400" />
                                                        Detected workspaces in your Google Drive:
                                                    </h3>
                                                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                        {detectedOrgs.map((org: any) => {
                                                            const isOrgChecked = selectedOrgIds.includes(org.folderId)
                                                            return (
                                                                <div key={org.folderId} className="space-y-3 p-3 rounded-xl border border-slate-50 bg-slate-50/30">
                                                                    <div className="flex items-center gap-3">
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
                                                                            className="h-5 w-5 rounded border-2 border-slate-900 accent-slate-900 cursor-pointer"
                                                                        />
                                                                        <div className="flex-1">
                                                                            <Label className="text-sm font-bold text-slate-900 block truncate">
                                                                                {org.name}
                                                                            </Label>
                                                                            <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Organization</span>
                                                                        </div>
                                                                    </div>

                                                                    {org.clients?.map((client: any) => {
                                                                        const isClientChecked = selectedOrgIds.includes(client.folderId)
                                                                        return (
                                                                            <div key={client.folderId} className="ml-8 border-l-2 border-slate-200 pl-4 space-y-3 py-1">
                                                                                <div className="flex items-center gap-3">
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
                                                                                        className="h-4 w-4 rounded border-2 border-slate-900 accent-slate-900 cursor-pointer"
                                                                                    />
                                                                                    <div className="flex-1">
                                                                                        <Label className="text-xs font-semibold text-slate-700 block truncate">
                                                                                            {client.name}
                                                                                        </Label>
                                                                                        <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider">Client</span>
                                                                                    </div>
                                                                                </div>

                                                                                {client.projects?.map((project: any) => {
                                                                                    const isProjChecked = selectedOrgIds.includes(project.folderId)
                                                                                    return (
                                                                                        <div key={project.folderId} className="ml-7 flex items-center gap-3 py-1 opacity-80">
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
                                                                                                className="h-3.5 w-3.5 rounded border-2 border-slate-900 accent-slate-900 cursor-pointer"
                                                                                            />
                                                                                            <div className="flex-1">
                                                                                                <Label className="text-[11px] font-medium text-slate-600 block truncate italic">
                                                                                                    {project.name}
                                                                                                </Label>
                                                                                                <span className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">Project</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Terminal shown below tree while importing */}
                                            {importingOrgs && (
                                                <div className="space-y-3 animate-in fade-in duration-500">
                                                    <OnboardingTerminal
                                                        steps={terminalSteps}
                                                        activeStepIndex={activeTerminalIndex}
                                                    />
                                                    <p className="text-[10px] text-center text-slate-400 font-medium">
                                                        Please do not close this window while we scan and import your workspaces.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Domain access toggle — shown when orgs are detected and not yet importing */}
                                {detectedOrgs.length > 0 && !importingOrgs && (
                                    <DomainAccessToggle value={allowDomainAccess} onChange={setAllowDomainAccess} userEmail={user?.email} />
                                )}

                                {error && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="mt-5 flex gap-3">
                                    <Button
                                        onClick={handleImportOrganizations}
                                        disabled={importingOrgs || selectedOrgIds.length === 0 || detectedOrgsLoading || creatingSandbox || isSubmitting || creatingCustomWorkspace}
                                        className="w-[70%] h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow flex items-center justify-center gap-2"
                                    >
                                        {importingOrgs ? (
                                            <>
                                                <LoadingSpinner size="sm" />
                                                Importing...
                                            </>
                                        ) : (
                                            <>
                                                Import {selectedOrgIds.length} Items
                                                <ArrowRight className="h-4 w-4 animate-arrow" />
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => { markStepSkipped(3); setStep(4) }}
                                        disabled={importingOrgs || detectedOrgsLoading || creatingSandbox || isSubmitting || creatingCustomWorkspace}
                                        className="w-[30%] h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold disabled:opacity-30"
                                    >
                                        Skip
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Custom Organization Setup */}
                        {step === 4 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-4 text-center">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-2 mx-auto">
                                        <PlusCircle className="h-5 w-5 text-slate-700" />
                                    </div>
                                    <h1 className="text-2xl font-bold text-slate-900 mb-1">Custom Organization</h1>
                                    <p className="text-sm text-slate-500">
                                        Set up a new workspace from scratch in your Google Drive
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {/* Workspace tree preview — styled like Sandbox with OrgTreeProgressCheck */}
                                    {(() => {
                                        const hasClient = !!customClientName.trim()
                                        const hasProject = hasClient && !!customProjectName.trim()
                                        const ORG_STEP = 2
                                        const CLIENT_STEP = 3
                                        const PROJECT_STEP = 4
                                        const nodeStatus = (stepIndex: number): 'completed' | 'inProgress' | 'pending' => {
                                            if (!creatingCustomWorkspace) return 'completed'
                                            if (activeTerminalIndex > stepIndex) return 'completed'
                                            if (activeTerminalIndex === stepIndex) return 'inProgress'
                                            return 'pending'
                                        }
                                        return (
                                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">Workspace Preview</p>
                                                {/* Org row */}
                                                <div className="flex items-center gap-3 mb-3">
                                                    <OrgTreeProgressCheck status={nodeStatus(ORG_STEP)} size="lg" />
                                                    <Building2 className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                    <span className={`text-sm font-semibold ${customOrgName.trim() ? 'text-slate-900' : 'text-slate-300 italic'}`}>
                                                        {customOrgName.trim() || 'Your Organization'}
                                                    </span>
                                                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Org</span>
                                                </div>
                                                {/* Client row — shown once org sub-step passed */}
                                                {customSubStep >= 1 && (
                                                    <div className="pl-6 border-l-2 border-slate-200 ml-2.5 space-y-4">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <OrgTreeProgressCheck status={hasClient ? nodeStatus(CLIENT_STEP) : 'completed'} size="md" />
                                                            <Users className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                                            <span className={`text-sm font-medium ${customClientName.trim() ? 'text-slate-700' : 'text-slate-300 italic'}`}>
                                                                {customClientName.trim() || 'First Client (optional)'}
                                                            </span>
                                                            <span className="ml-auto text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Client</span>
                                                        </div>
                                                        {/* Project row — shown once client sub-step passed */}
                                                        {customSubStep >= 2 && (
                                                            <div className="pl-6 border-l-2 border-slate-100 ml-2.5 space-y-1.5">
                                                                <div className="flex items-center gap-3">
                                                                    <OrgTreeProgressCheck status={hasProject ? nodeStatus(PROJECT_STEP) : 'completed'} size="sm" />
                                                                    <Briefcase className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
                                                                    <span className={`text-xs italic ${customProjectName.trim() ? 'text-slate-500' : 'text-slate-300'}`}>
                                                                        {customProjectName.trim() || 'First Project (optional)'}
                                                                    </span>
                                                                    <span className="ml-auto text-[9px] font-semibold uppercase tracking-wider text-slate-300 bg-slate-50 px-1.5 py-0.5 rounded-full">Project</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })()}

                                    {/* Sub-step form — always shown (not replaced by terminal) */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                                        <div className="space-y-5">
                                            {/* Sub-step 0: Org name */}
                                            <div className={`space-y-2 transition-opacity ${customSubStep === 0 ? 'opacity-100' : 'opacity-60'}`}>
                                                <Label htmlFor="custom-org-name" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-slate-500" />
                                                    Organization Name
                                                </Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="custom-org-name"
                                                        placeholder="e.g. My Agency"
                                                        value={customOrgName}
                                                        onChange={(e) => setCustomOrgName(e.target.value)}
                                                        onKeyDown={(e) => { if (e.key === 'Enter' && customOrgName.trim()) setCustomSubStep(1) }}
                                                        autoFocus={customSubStep === 0}
                                                        disabled={customSubStep > 0 || creatingCustomWorkspace}
                                                        className="flex-1 h-12 px-4 border-slate-200 rounded-xl transition-all font-medium bg-white focus-visible:ring-slate-300 focus-visible:ring-1"
                                                    />
                                                    {customSubStep === 0 && (
                                                        <Button
                                                            onClick={() => setCustomSubStep(1)}
                                                            disabled={!customOrgName.trim()}
                                                            className="h-12 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex-shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-30 text-xs font-bold"
                                                        >
                                                            Next <ArrowRight className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub-step 1: Client name (optional) */}
                                            {customSubStep >= 1 && (
                                                <div className={`space-y-2 pl-5 border-l-2 border-slate-200 ml-2 animate-in fade-in slide-in-from-top-2 duration-300 transition-opacity ${customSubStep === 1 ? 'opacity-100' : 'opacity-60'}`}>
                                                    <Label htmlFor="custom-client-name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-slate-400" />
                                                        First Client <span className="font-normal text-slate-400">(Optional)</span>
                                                    </Label>
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {customSubStep === 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setCustomSubStep(0)}
                                                                disabled={creatingCustomWorkspace}
                                                                className="h-11 px-3 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 flex-shrink-0 flex items-center gap-1 text-xs font-semibold"
                                                            >
                                                                <ArrowLeft className="h-3.5 w-3.5" /> Back
                                                            </Button>
                                                        )}
                                                        <Input
                                                            id="custom-client-name"
                                                            placeholder="e.g. Acme Corp — or leave blank to skip"
                                                            value={customClientName}
                                                            onChange={(e) => setCustomClientName(e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter') setCustomSubStep(2) }}
                                                            autoFocus={customSubStep === 1}
                                                            disabled={customSubStep > 1 || creatingCustomWorkspace}
                                                            className="flex-1 min-w-[140px] h-11 px-4 border-slate-200 rounded-xl transition-all bg-white focus-visible:ring-slate-300 focus-visible:ring-1"
                                                        />
                                                        {customSubStep === 1 && (
                                                            <Button
                                                                onClick={() => setCustomSubStep(2)}
                                                                className="h-11 px-4 rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex-shrink-0 flex items-center gap-1.5 text-xs font-bold"
                                                            >
                                                                {customClientName.trim() ? <><span>Next</span> <ArrowRight className="h-3.5 w-3.5" /></> : <><span>Skip</span> <ArrowRight className="h-3.5 w-3.5" /></>}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Sub-step 2: Project name (optional) — only enabled when a client is set */}
                                            {customSubStep >= 2 && (
                                                <div className="space-y-2 pl-10 border-l-2 border-slate-100 ml-7 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <Label htmlFor="custom-project-name" className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                                                        <Briefcase className="h-4 w-4 text-slate-400" />
                                                        First Project <span className="font-normal text-slate-400">(Optional)</span>
                                                    </Label>
                                                    {!customClientName.trim() && (
                                                        <p className="text-xs text-slate-500">
                                                            Add a client above to add a project. Use Back to edit.
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={() => setCustomSubStep(1)}
                                                            disabled={creatingCustomWorkspace}
                                                            className="h-11 px-3 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 flex-shrink-0 flex items-center gap-1 text-xs font-semibold"
                                                        >
                                                            <ArrowLeft className="h-3.5 w-3.5" /> Back
                                                        </Button>
                                                        <Input
                                                            id="custom-project-name"
                                                            placeholder="e.g. Website Overhaul — or leave blank to skip"
                                                            value={customProjectName}
                                                            onChange={(e) => setCustomProjectName(e.target.value)}
                                                            onKeyDown={(e) => { if (e.key === 'Enter' && customOrgName.trim()) handleCreateCustomWorkspace() }}
                                                            autoFocus={!!customClientName.trim()}
                                                            disabled={creatingCustomWorkspace || !customClientName.trim()}
                                                            className="flex-1 min-w-[140px] h-11 px-4 border-slate-200 rounded-xl transition-all bg-white focus-visible:ring-slate-300 focus-visible:ring-1"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Terminal shown below form while creating workspace */}
                                    {creatingCustomWorkspace && (
                                        <div className="space-y-3 animate-in fade-in duration-500">
                                            <OnboardingTerminal
                                                steps={terminalSteps}
                                                activeStepIndex={activeTerminalIndex}
                                            />
                                            <p className="text-[10px] text-center text-slate-400 font-medium">
                                                Please do not close this window while we build your workspace.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {error && (
                                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                {/* Domain access toggle — shown once org name is set and before workspace is created */}
                                {customSubStep >= 1 && !creatingCustomWorkspace && (
                                    <DomainAccessToggle value={allowDomainAccess} onChange={setAllowDomainAccess} userEmail={user?.email} />
                                )}

                                {/* Bottom row: Create Workspace (enabled when ready) + Skip — aligned with SANDBOX & IMPORT */}
                                <div className="mt-4 flex gap-3">
                                    <Button
                                        onClick={handleCreateCustomWorkspace}
                                        disabled={creatingCustomWorkspace || !customOrgName.trim() || customSubStep < 2 || creatingSandbox || importingOrgs || isSubmitting}
                                        className="w-[70%] h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow flex items-center justify-center gap-2"
                                    >
                                        <>
                                            Create Workspace
                                            <ArrowRight className="h-4 w-4 animate-arrow" />
                                        </>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            markStepSkipped(4)
                                            handleFinish()
                                        }}
                                        disabled={creatingCustomWorkspace || creatingSandbox || importingOrgs || isSubmitting}
                                        className="w-[30%] h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold disabled:opacity-30"
                                    >
                                        Skip
                                    </Button>
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
