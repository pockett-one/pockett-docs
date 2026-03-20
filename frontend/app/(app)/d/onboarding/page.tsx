"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/toast"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"
import { CheckCircle2, ArrowRight, ArrowLeft, Building2, LogIn, Settings, Lock, AlertCircle, Users, Briefcase, HardDrive, FolderOpen, Folder, SquarePlus, FolderTree, Inbox, Info, Copy, Terminal as TerminalIcon, Check, Loader2 } from "lucide-react"
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
import { getUserFirms } from '@/lib/actions/firms'
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
                if (prev <= 1) {
                    clearInterval(t)
                    // Defer navigation to avoid "Cannot update Router while rendering AlreadyCompletedScreen"
                    setTimeout(() => onGoToDashboard(), 0)
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => clearInterval(t)
    }, [onGoToDashboard])

    return (
        <div className="animate-in fade-in duration-500 text-center py-16">
            <div className="h-20 w-20 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center mb-6 mx-auto">
                <CheckCircle2 className="h-10 w-10 text-purple-600" />
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
    const [oauthNonce, setOauthNonce] = useState<string | null>(null)
    const [isFetchingAuthUrl, setIsFetchingAuthUrl] = useState(false)
    const [isConnectingDrive, setIsConnectingDrive] = useState(false)
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
    const SANDBOX_AUTO_CREATE_MS = 8000
    const [sandboxAutoCreateSkipped, setSandboxAutoCreateSkipped] = useState(false)
    const [sandboxAutoCreateRemainingMs, setSandboxAutoCreateRemainingMs] = useState<number>(SANDBOX_AUTO_CREATE_MS)
    const sandboxAutoCreateIntervalRef = useRef<number | null>(null)
    const sandboxAutoCreateStartedAtRef = useRef<number | null>(null)
    const sandboxAutoCreateTriggeredRef = useRef(false)

    // Step 3: Organization Setup & Auto-Import
    const [orgName, setOrgName] = useState("")
    const [detectedOrgs, setDetectedOrgs] = useState<any[]>([])
    const [detectedOrgsLoading, setDetectedOrgsLoading] = useState(false)
    const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([])
    const [importingOrgs, setImportingOrgs] = useState(false)
    const IMPORT_AUTO_MS = 8000
    const [importAutoSkipped, setImportAutoSkipped] = useState(false)
    const [importAutoRemainingMs, setImportAutoRemainingMs] = useState<number>(IMPORT_AUTO_MS)
    const importAutoIntervalRef = useRef<number | null>(null)
    const importAutoStartedAtRef = useRef<number | null>(null)
    const importAutoTriggeredRef = useRef(false)
    const [newOrgCreated, setNewOrgCreated] = useState(false)
    const [newOrgSlug, setNewOrgSlug] = useState("")
    const [defaultOrgSlug, setDefaultOrgSlug] = useState("")
    const [createdOrgId, setCreatedOrgId] = useState<string | null>(null)

    // Step 3: auto-forward message when no orgs
    const [autoForwardMessage, setAutoForwardMessage] = useState<string | null>(null)

    // Shared: domain access toggle (Import) — default ON
    const [allowDomainAccess, setAllowDomainAccess] = useState(true)
    // Step 4 “Custom Organization” has been removed from onboarding (paywalled / future).
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

    const handleConnectDrive = useCallback(async (e?: any) => {
        e?.preventDefault()
        e?.stopPropagation()
        if (!authUrl) return

        setIsConnectingDrive(true)

        const appOrigin = typeof window !== 'undefined' ? window.location.origin : ''
        const expectedNonce = oauthNonce

        logger.debug('ONBOARDING_OAUTH_CONNECT_CLICK', {
            hasAuthUrl: !!authUrl,
            appOrigin
        })

        let timeoutId: number | null = null
        let pollIntervalId: number | null = null
        const pending = { errorTimeoutId: null as number | null }

        const cleanup = () => {
            window.removeEventListener('message', handleMessage)
            if (timeoutId !== null) {
                window.clearTimeout(timeoutId)
                timeoutId = null
            }
            if (pollIntervalId !== null) {
                window.clearInterval(pollIntervalId)
                pollIntervalId = null
            }
            if (pending.errorTimeoutId !== null) {
                window.clearTimeout(pending.errorTimeoutId)
                pending.errorTimeoutId = null
            }
        }

        const applyPopupSuccess = async () => {
            setError(null)
            try {
                const token = await getAccessToken()
                if (token) {
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
                        if (statusData.connector?.name) setConnectedEmail(statusData.connector.name)
                        if (fetchedRootId) setRootFolderId(fetchedRootId)
                        const nextStep = fetchedRootId && (savedStep && savedStep > 2 ? Math.min(savedStep, 3) : 2) ? 2 : 1
                        setStep(nextStep)
                    }
                }
            } catch (err) {
                logger.warn('Failed to fetch connector status after popup OAuth', err as Error)
            }
        }

        const isAllowedOrigin = (origin: string) => {
            if (origin === appOrigin) return true
            try {
                const u = new URL(origin)
                const a = new URL(appOrigin)
                if (u.protocol === 'http:' && a.protocol === 'http:' && (u.hostname === 'localhost' || u.hostname === '127.0.0.1') && (a.hostname === 'localhost' || a.hostname === '127.0.0.1') && u.port === a.port) return true
            } catch {
                /* ignore */
            }
            return false
        }

        const handleMessage = async (event: MessageEvent) => {
            if (!isAllowedOrigin(event.origin)) return
            const data = event.data
            if (!data || data.type !== 'google_drive_oauth') return
            if (expectedNonce != null && data.nonce !== expectedNonce) return

            cleanup()
            setIsConnectingDrive(false)

            if (data.ok === true) {
                logger.debug('ONBOARDING_OAUTH_POPUP_SUCCESS', {
                    hasEmail: !!data.email,
                    hasConnectionId: !!data.connectionId
                })
                setIsConnected(true)
                if (data.email) setConnectedEmail(data.email)
                if (data.connectionId) {
                    setConnectionDetails(prev => ({ ...prev, connectionId: data.connectionId }))
                }
                await applyPopupSuccess()
            } else {
                logger.warn('ONBOARDING_OAUTH_POPUP_ERROR', {
                    error: data.error
                })
                setError(data.error || 'Google Drive connection failed')
            }
        }

        window.addEventListener('message', handleMessage)

        timeoutId = window.setTimeout(() => {
            cleanup()
            setIsConnectingDrive(false)
            logger.warn('ONBOARDING_OAUTH_POPUP_TIMEOUT')
            setError('Timed out waiting for Google sign-in. Please try again.')
        }, 60000)

        // When window.open returns null, the popup may still open but without window.opener, so postMessage never runs.
        // Poll connector status so we still detect success and advance the base page.
        const POLL_INTERVAL_MS = 2000
        pollIntervalId = window.setInterval(async () => {
            try {
                const token = await getAccessToken()
                if (!token) return
                const statusRes = await fetch('/api/connectors/google-drive?action=status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (!statusRes.ok) return
                const statusData = await statusRes.json()
                if (statusData.isConnected && statusData.connector?.id) {
                    logger.debug('ONBOARDING_OAUTH_POPUP_SUCCESS_VIA_POLL')
                    cleanup()
                    setIsConnectingDrive(false)
                    setIsConnected(true)
                    await applyPopupSuccess()
                }
            } catch {
                // ignore
            }
        }, POLL_INTERVAL_MS)

        const width = 520
        const height = 700
        const left = window.screenX + (window.outerWidth - width) / 2
        const top = window.screenY + (window.outerHeight - height) / 2
        // Do not use noopener: callback page needs window.opener to postMessage back to this window
        const popup = window.open(
            authUrl,
            'PockettGoogleDriveOAuth',
            `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no,location=no,noreferrer`
        )

        if (!popup) {
            // window.open returned null; the popup might still have opened in some browsers.
            // Don't show a "blocked" message — keep listening for postMessage. If we get it, we're good.
            // If the popup was really blocked, the 60s timeout will show a timeout error.
            logger.warn('ONBOARDING_OAUTH_POPUP_OPEN_RETURNED_NULL')
        } else {
            logger.debug('ONBOARDING_OAUTH_POPUP_OPENED')
            setError(null)
        }
    }, [authUrl, oauthNonce, user?.id, existingOrg?.id, rootFolderId])

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

    const clearSandboxAutoCreateTimer = useCallback(() => {
        if (sandboxAutoCreateIntervalRef.current) {
            window.clearInterval(sandboxAutoCreateIntervalRef.current)
            sandboxAutoCreateIntervalRef.current = null
        }
        sandboxAutoCreateStartedAtRef.current = null
        setSandboxAutoCreateRemainingMs(SANDBOX_AUTO_CREATE_MS)
    }, [SANDBOX_AUTO_CREATE_MS])

    const sandboxAutoCreateEnabled =
        step === 2 &&
        !sandboxAutoCreateSkipped &&
        !creatingSandbox &&
        !!sandboxOrgName &&
        !isSubmitting &&
        !importingOrgs

    const clearImportAutoTimer = useCallback(() => {
        if (importAutoIntervalRef.current) {
            window.clearInterval(importAutoIntervalRef.current)
            importAutoIntervalRef.current = null
        }
        importAutoStartedAtRef.current = null
        setImportAutoRemainingMs(IMPORT_AUTO_MS)
    }, [IMPORT_AUTO_MS])

    const importAutoEnabled =
        step === 3 &&
        !importAutoSkipped &&
        !detectedOrgsLoading &&
        detectedOrgs.length > 0 &&
        !importingOrgs &&
        !creatingSandbox &&
        !isSubmitting

    useEffect(() => {
        // Reset per entry into step 2
        if (step !== 2) {
            clearSandboxAutoCreateTimer()
            sandboxAutoCreateTriggeredRef.current = false
            return
        }

        // If user is back on step 2, allow auto-create again unless they explicitly skipped it this session
        if (!sandboxAutoCreateSkipped) {
            sandboxAutoCreateTriggeredRef.current = false
        }
    }, [step, sandboxAutoCreateSkipped, clearSandboxAutoCreateTimer])

    useEffect(() => {
        if (!sandboxAutoCreateEnabled) {
            clearSandboxAutoCreateTimer()
            return
        }

        if (sandboxAutoCreateIntervalRef.current) return

        sandboxAutoCreateStartedAtRef.current = Date.now()
        setSandboxAutoCreateRemainingMs(SANDBOX_AUTO_CREATE_MS)

        sandboxAutoCreateIntervalRef.current = window.setInterval(() => {
            const startedAt = sandboxAutoCreateStartedAtRef.current
            if (!startedAt) return

            const elapsed = Date.now() - startedAt
            const remaining = Math.max(0, SANDBOX_AUTO_CREATE_MS - elapsed)
            setSandboxAutoCreateRemainingMs(remaining)

            if (remaining <= 0 && !sandboxAutoCreateTriggeredRef.current) {
                sandboxAutoCreateTriggeredRef.current = true
                clearSandboxAutoCreateTimer()
                // Auto-start sandbox creation (hands-free) if the user hasn't opted out
                handleCreateSandbox()
            }
        }, 50)

        return () => {
            clearSandboxAutoCreateTimer()
        }
    }, [sandboxAutoCreateEnabled, SANDBOX_AUTO_CREATE_MS, clearSandboxAutoCreateTimer])

    useEffect(() => {
        // Reset per entry into step 3
        if (step !== 3) {
            clearImportAutoTimer()
            importAutoTriggeredRef.current = false
            return
        }

        if (!importAutoSkipped) {
            importAutoTriggeredRef.current = false
        }
    }, [step, importAutoSkipped, clearImportAutoTimer])

    useEffect(() => {
        // Hands-free: when orphaned orgs are discovered, preselect all items (org + children) once
        if (step !== 3) return
        if (detectedOrgsLoading) return
        if (detectedOrgs.length === 0) return
        if (selectedOrgIds.length > 0) return

        const collectAllIds = (orgs: any[]) => {
            const ids = new Set<string>()
            orgs.forEach((o) => {
                if (o?.folderId) ids.add(o.folderId)
                o?.clients?.forEach((c: any) => {
                    if (c?.folderId) ids.add(c.folderId)
                    c?.projects?.forEach((p: any) => {
                        if (p?.folderId) ids.add(p.folderId)
                    })
                })
            })
            return Array.from(ids)
        }

        setSelectedOrgIds(collectAllIds(detectedOrgs))
    }, [step, detectedOrgsLoading, detectedOrgs, selectedOrgIds.length])

    useEffect(() => {
        if (!importAutoEnabled) {
            clearImportAutoTimer()
            return
        }

        // Only run when we actually have something selected to import
        if (selectedOrgIds.length === 0) return
        if (importAutoIntervalRef.current) return

        importAutoStartedAtRef.current = Date.now()
        setImportAutoRemainingMs(IMPORT_AUTO_MS)

        importAutoIntervalRef.current = window.setInterval(() => {
            const startedAt = importAutoStartedAtRef.current
            if (!startedAt) return

            const elapsed = Date.now() - startedAt
            const remaining = Math.max(0, IMPORT_AUTO_MS - elapsed)
            setImportAutoRemainingMs(remaining)

            if (remaining <= 0 && !importAutoTriggeredRef.current) {
                importAutoTriggeredRef.current = true
                clearImportAutoTimer()
                handleImportOrganizations()
            }
        }, 50)

        return () => {
            clearImportAutoTimer()
        }
    }, [importAutoEnabled, IMPORT_AUTO_MS, clearImportAutoTimer, selectedOrgIds.length])

    const handleCreateSandbox = async () => {
        // Manual click should cancel the auto-start timer
        clearSandboxAutoCreateTimer()
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

        // Simulate progress during batch — cap at "Finalizing and indexing workspace" so UI doesn't appear stuck on a specific project
        const totalSteps = dynamicSteps.length
        const progressCap = totalSteps - 1
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
                        handleFinish()
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
        // Manual click or auto-start should cancel the timer
        clearImportAutoTimer()
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
                    setImportingOrgs(false)
                    await handleFinish()
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
            const orgs = await getUserFirms()
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
        if (!creatingSandbox) return

        const orgNameToCheck = sandboxOrgName || SANDBOX_ORG_NAME
        if (!orgNameToCheck) return

        try {
            const orgs = await getUserFirms()
            const match = orgs.find(o => o.name.toLowerCase() === orgNameToCheck.toLowerCase())
            if (match) {
                sessionStorage.removeItem(ONBOARDING_CREATING_KEY)
                setCreatingSandbox(false)
                setStep(3)
            }
        } catch {
            // Ignore — user may not be signed in yet
        }
    }, [creatingSandbox, sandboxOrgName])

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

                        // When rootFolderId is set (e.g. by callback with default workspace folder),
                        // skip Configure Workspace Home and show Sandbox (2) or later step (max step 3).
                        let nextStep = 1
                        if (fetchedRootId) {
                            nextStep = savedStep && savedStep > 2 ? Math.min(savedStep, 3) : 2
                        }

                        setStep(nextStep)
                    }
                } else if (errorParam) {
                    setStep(1)
                    setError(`Google Drive connection failed: ${errorParam}`)
                } else {
                    // 2. Normal load: Fetch connector status first so we have rootFolderId even when no org yet
                    // (callback creates _Pockett_Workspace_ and sets rootFolderId — we must not show "My Drive vs Shared Drive")
                    let normalLoadRootId = ''
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
                            if (statusData.connector?.rootFolderId) {
                                normalLoadRootId = statusData.connector.rootFolderId
                                setRootFolderId(normalLoadRootId)
                            }
                        }
                    } catch (err) {
                        logger.warn('Failed to fetch connector status on normal load', err as Error)
                    }

                    try {
                        const res = await fetch('/api/firm', {
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
                                const isOwner = userMembership?.role === 'firm_admin'

                                if (!isOwner && resolvedOrg.slug) {
                                    router.replace(`/d/f/${resolvedOrg.slug}`)
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
                                    // Resume from current step (Step 4 excluded; max step is 3)
                                    let savedStep = Math.min(onboarding?.currentStep ?? 1, 3)
                                    let currentStep = savedStep === 2 ? 3 : savedStep

                                    // If at resume point for sandbox or beyond, but no root folder, force back to step 1
                                    if (currentStep >= 2 && !fetchedRootId) {
                                        currentStep = 1
                                    }
                                    setStep(Math.max(currentStep, 1))
                                }
                            } else {
                                // Could not create/find org — start at Step 1 unless root folder already set (skip Configure Workspace Home)
                                setStep(normalLoadRootId ? 2 : 1)
                            }
                        } else {
                            setStep(normalLoadRootId ? 2 : 1)
                        }
                    } catch (err) {
                        logger.error("Failed to check org status", err as Error)
                        setStep(normalLoadRootId ? 2 : 1)
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

    // Step 1 recovery: poll until backend has root folder, then advance to Step 2 (avoids stuck "Setting up your workspace..." spinner)
    useEffect(() => {
        if (step !== 1 || !isConnected || rootFolderId) return
        const RECOVERY_POLL_MS = 2000
        let cancelled = false
        const poll = async () => {
            try {
                const token = await getAccessToken()
                if (!token || cancelled) return
                const res = await fetch('/api/connectors/google-drive?action=status', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (!res.ok || cancelled) return
                const data = await res.json()
                const fetchedRootId = data.connector?.rootFolderId
                if (fetchedRootId && !cancelled) {
                    setRootFolderId(fetchedRootId)
                    if (data.connector?.id) setConnectionDetails(prev => ({ ...prev, connectionId: data.connector.id }))
                    if (data.connector?.name) setConnectedEmail(data.connector.name)
                    setStep(2)
                    return
                }
            } catch {
                // ignore
            }
            if (!cancelled) id = window.setTimeout(poll, RECOVERY_POLL_MS)
        }
        let id = window.setTimeout(poll, 0)
        return () => {
            cancelled = true
            if (id) window.clearTimeout(id)
        }
    }, [step, isConnected, rootFolderId])

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
                            const orgRes = await fetch('/api/firm', {
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
                            rootFolderId,
                            flow: 'popup',
                            openerOrigin: typeof window !== 'undefined' ? window.location.origin : undefined
                        })
                    })
                    if (res.ok) {
                        const data = await res.json()
                        setAuthUrl(data.authUrl)
                        if (data.nonce) setOauthNonce(data.nonce)
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
                                            onClick={() => router.push(`/d/f/${org.slug}`)}
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
                                                            router.push(`/d/f/${result.slug}`)
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
                                    <SquarePlus className="h-4 w-4" />
                                    Create a new workspace
                                </button>

                                {domainError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                                        {domainError}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 1: Connect Google Drive only. Root folder is created in My Drive by backend; no storage-type choice. Legacy UI in ConfigureWorkspaceHomeLegacy.tsx (unused, for future Connectors settings). */}
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-4 flex items-center justify-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                        <GoogleDriveIcon size={20} />
                                    </div>
                                    <div className="text-left">
                                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Connect Google Drive</h1>
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
                                        <div className="flex items-center justify-center gap-3 py-6 text-slate-600">
                                            <LoadingSpinner size="sm" />
                                            <span className="text-sm font-medium">Setting up your workspace…</span>
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
                                                type="button"
                                                onClick={(e) => handleConnectDrive(e)}
                                                disabled={!authUrl || isSubmitting || isFetchingAuthUrl || isConnectingDrive}
                                                className="w-full h-12 flex items-center justify-center bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow"
                                            >
                                                {isConnectingDrive ? (
                                                    <>
                                                        <LoadingSpinner size="sm" className="mr-2" />
                                                        Connecting…
                                                    </>
                                                ) : isSubmitting ? (
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
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                        <Building2 className="h-5 w-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sandbox Organization</h1>
                                        <p className="text-sm text-slate-500">
                                            We strongly recommend a sample workspace to safely test out {BRAND_NAME}
                                        </p>
                                    </div>
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
                                        disabled={creatingSandbox || !sandboxOrgName || isSubmitting || importingOrgs}
                                        className={[
                                            "w-[70%] h-12 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow flex items-center justify-center gap-2 relative overflow-hidden",
                                            creatingSandbox ? "bg-slate-900 text-white" : "bg-slate-400 text-white hover:bg-slate-500",
                                        ].join(" ")}
                                    >
                                        {!creatingSandbox && sandboxAutoCreateEnabled && (
                                            <div
                                                aria-hidden="true"
                                                className="absolute inset-y-0 left-0 bg-slate-900/90 transition-[width] duration-75"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            (1 - sandboxAutoCreateRemainingMs / SANDBOX_AUTO_CREATE_MS) * 100
                                                        )
                                                    )}%`,
                                                }}
                                            />
                                        )}
                                        {creatingSandbox ? (
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                <LoadingSpinner size="sm" />
                                                Building...
                                            </span>
                                        ) : (
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Create Sandbox
                                                <ArrowRight className="h-4 w-4 animate-arrow" />
                                            </span>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            clearSandboxAutoCreateTimer()
                                            setSandboxAutoCreateSkipped(true)
                                            markStepSkipped(2)
                                            setStep(3)
                                        }}
                                        disabled={creatingSandbox || isSubmitting || importingOrgs}
                                        className="w-[30%] h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold disabled:opacity-30"
                                    >
                                        Skip
                                    </Button>
                                </div>
                                {!creatingSandbox && sandboxAutoCreateEnabled && (
                                    <p className="mt-2 text-xs text-slate-500 text-center">
                                        Auto-starting in <span className="font-semibold text-slate-700">{Math.max(1, Math.ceil(sandboxAutoCreateRemainingMs / 1000))}s</span>. You can click manually or hit Skip.
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Step 3: Import Organization */}
                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                                        <FolderTree className="h-5 w-5 text-slate-700" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Import Organization</h1>
                                        <p className="text-sm text-slate-500">
                                            Check existing orphaned organizations from your Google Drive to import them as workspaces
                                        </p>
                                    </div>
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
                                        disabled={importingOrgs || selectedOrgIds.length === 0 || detectedOrgsLoading || creatingSandbox || isSubmitting}
                                        className={[
                                            "w-[70%] h-12 rounded-xl font-bold transition-all shadow-md active:scale-[0.98] disabled:opacity-50 cta-hover-arrow flex items-center justify-center gap-2 relative overflow-hidden",
                                            importingOrgs ? "bg-slate-900 text-white" : "bg-slate-400 text-white hover:bg-slate-500",
                                        ].join(" ")}
                                    >
                                        {!importingOrgs && importAutoEnabled && selectedOrgIds.length > 0 && (
                                            <div
                                                aria-hidden="true"
                                                className="absolute inset-y-0 left-0 bg-slate-900/90 transition-[width] duration-75"
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        Math.max(
                                                            0,
                                                            (1 - importAutoRemainingMs / IMPORT_AUTO_MS) * 100
                                                        )
                                                    )}%`,
                                                }}
                                            />
                                        )}
                                        {importingOrgs ? (
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                <LoadingSpinner size="sm" />
                                                Importing...
                                            </span>
                                        ) : (
                                            <span className="relative z-10 flex items-center justify-center gap-2">
                                                Import {selectedOrgIds.length} Items
                                                <ArrowRight className="h-4 w-4 animate-arrow" />
                                            </span>
                                        )}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            clearImportAutoTimer()
                                            setImportAutoSkipped(true)
                                            markStepSkipped(3)
                                            handleFinish()
                                        }}
                                        disabled={importingOrgs || detectedOrgsLoading || creatingSandbox || isSubmitting}
                                        className="w-[30%] h-12 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold disabled:opacity-30"
                                    >
                                        Skip
                                    </Button>
                                </div>
                                {!importingOrgs && importAutoEnabled && selectedOrgIds.length > 0 && (
                                    <p className="mt-2 text-xs text-slate-500 text-center">
                                        Auto-importing in <span className="font-semibold text-slate-700">{Math.max(1, Math.ceil(importAutoRemainingMs / 1000))}s</span>. You can click manually or hit Skip.
                                    </p>
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
