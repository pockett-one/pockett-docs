"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { CheckCircle2, Zap, ArrowRight, ShieldCheck, FolderPlus } from "lucide-react"
import Logo from "@/components/Logo"
import { config } from "@/lib/config"
import { logger } from '@/lib/logger'
import { LoadingSpinner } from "@/components/ui/loading-spinner"

const OnboardingContent = () => {
    const { session, user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    // Google Picker


    // State
    const [step, setStep] = useState<number | null>(null) // Start null to show loader
    const [name, setName] = useState("")
    const [orgSlug, setOrgSlug] = useState("")
    const [isLoading, setIsLoading] = useState(true) // Global loading for initial check
    const [isSubmitting, setIsSubmitting] = useState(false) // For form submission
    const [authUrl, setAuthUrl] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isConnected, setIsConnected] = useState(false)
    const [connectionDetails, setConnectionDetails] = useState<{ accessToken?: string, connectionId?: string, clientId?: string } | null>(null)
    const [isFinalizing, setIsFinalizing] = useState(false)
    const [existingOrg, setExistingOrg] = useState<any>(null)
    const [connectedEmail, setConnectedEmail] = useState<string | null>(null)

    // ... (rest of logic handles) ...

    const handleFinish = () => {
        // If we don't have the slug in state (e.g. page refresh on step 2), we might need to fetch it or redirect to /dash which redirects
        if (orgSlug) {
            router.push(`/o/${orgSlug}`)
        } else {
            router.push('/dash')
        }
    }

    // Initial check: Params & Existing Org
    useEffect(() => {
        const checkStatus = async () => {
            if (!session?.access_token) return;

            const success = searchParams?.get('success')
            const errorParam = searchParams?.get('error')

            // 1. If returning from Google, force Step 2
            if (success === 'google_drive_connected') {
                setStep(2)
                setIsConnected(true)
                // Fetch token immediately to be ready for picker
                // logic moved to separate effect or call here directly?
                // Calling fetchPickerToken relies on state, but we can just call it if we extract logic or rely on the effect.
                // But fetchPickerToken check session.access_token which we have.
                // Let's set step 2 and let the other effect handle token? 
                // Actually the other effect below depends on [searchParams]. 
                // Let's consolidate.
            } else if (errorParam) {
                setStep(2)
                setError(`Connection failed: ${errorParam}`)
            } else {
                // 2. Normal load: Check if user already has an org
                try {
                    const res = await fetch('/api/organization', {
                        headers: { 'Authorization': `Bearer ${session.access_token}` }
                    })
                    if (res.ok) {
                        const data = await res.json()
                        logger.debug("Onboarding: Fetched Org Data:", data)

                        // API returns single object or { organization: null }
                        const org = data.organization === null ? null : data

                        if (org && org.id) {
                            // User has org, check state
                            setExistingOrg(org)
                            setName(org.name || "")
                            setOrgSlug(org.slug)

                            const settings = org.settings as any
                            const onboarding = settings?.onboarding
                            const hasActiveConnector = org.connectors && org.connectors.some((c: any) => c.status === 'ACTIVE' && c.type === 'GOOGLE_DRIVE')

                            if (hasActiveConnector) {
                                setIsConnected(true)
                                setStep(2) // Jump to Drive Selection
                            } else if (onboarding && onboarding.currentStep) {
                                setStep(onboarding.currentStep)
                            } else {
                                setStep(1) // Resume Step 1
                            }
                        } else {
                            setStep(1)
                        }
                    } else {
                        setStep(1)
                    }
                } catch (e) {
                    logger.error("Failed to fetch organizations", e as Error)
                    setStep(1)
                }
            }
            setIsLoading(false)
        }

        checkStatus()
    }, [session, searchParams])

    // Secondary effect for fetching picker token if connected
    useEffect(() => {
        if (isConnected && session?.access_token) {
            fetchPickerToken()
        }
    }, [isConnected, session])

    const fetchPickerToken = async () => {
        if (!session?.access_token) return
        try {
            const res = await fetch('/api/connectors/google-drive?action=token', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setConnectionDetails(data)

                // Fetch connected user info
                try {
                    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
                        headers: { 'Authorization': `Bearer ${data.accessToken}` }
                    })
                    if (userRes.ok) {
                        const userData = await userRes.json()
                        setConnectedEmail(userData.email)
                    }
                } catch (e) {
                    logger.error("Failed to fetch Google user info", e as Error)
                }
            }
        } catch (e) {
            logger.error("Failed to fetch picker token", e as Error)
        }
    }

    // Handle Picker Selection - Direct Google Picker API
    const handleOpenPicker = useCallback(() => {
        if (!connectionDetails?.accessToken || !connectionDetails?.clientId) {
            logger.error("No access token or client ID available for picker")
            return
        }

        logger.debug("Launching Picker with both My Drive and Shared Drives tabs")

        // Load Google Picker API if not already loaded
        if (!window.google?.picker) {
            const script = document.createElement('script')
            script.src = 'https://apis.google.com/js/api.js'
            script.onload = () => {
                window.gapi.load('picker', () => {
                    createPicker()
                })
            }
            document.body.appendChild(script)
        } else {
            createPicker()
        }

        function createPicker() {
            const picker = new window.google.picker.PickerBuilder()
                .setOAuthToken(connectionDetails!.accessToken)
                .setDeveloperKey('') // Empty to skip validation
                .setAppId(config.googleDrive.appId || '')

                // Tab 1: My Drive (Root-level folders only)
                .addView(
                    new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setParent('root') // Restrict to root-level folders only
                        .setMode(window.google.picker.DocsViewMode.LIST)
                        .setLabel("My Drive")
                )

                // Tab 2: Shared Drives
                .addView(
                    new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
                        .setIncludeFolders(true)
                        .setSelectFolderEnabled(true)
                        .setMimeTypes('application/vnd.google-apps.folder')
                        .setEnableDrives(true)
                        .setMode(window.google.picker.DocsViewMode.LIST)
                        .setLabel("Shared Drives")
                )

                .setCallback((data: any) => {
                    if (data.action === window.google.picker.Action.PICKED) {
                        const item = data.docs[0]

                        // Check if it's a Shared Drive (root) or a folder
                        if (item.type === 'drive') {
                            // This is a Shared Drive root - use it directly
                            logger.debug('Selected Shared Drive root:', item.name, item.id)
                            handleFinalize(item.id, item.name + ' (Shared Drive)')
                        } else {
                            // Regular folder selection
                            handleFinalize(item.id, item.name)
                        }
                    } else if (data.action === window.google.picker.Action.CANCEL) {
                        logger.debug('User clicked cancel/close button')
                    }
                })
                .build()

            picker.setVisible(true)
        }
    }, [connectionDetails])


    const handleFinalize = async (folderId: string, folderName: string) => {
        if (!connectionDetails?.connectionId) return

        setIsFinalizing(true)
        try {
            const res = await fetch('/api/connectors/google-drive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({
                    action: 'finalize',
                    connectionId: connectionDetails.connectionId,
                    parentFolderId: folderId
                })
            })

            if (!res.ok) throw new Error("Failed to setup folders")

            // Done!
            handleFinish()

        } catch (e) {
            setError("Failed to create folder structure. Please try again.")
            setIsFinalizing(false)
        }
    }


    // Auto-open picker logic removed to allow manual selection
    // const hasAutoOpened = useRef(false)
    // useEffect(() => { ... })

    // Fetch Auth URL on load (for Step 2)
    useEffect(() => {
        if (session?.user?.id) {
            fetch('/api/connectors/google-drive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'initiate',
                    userId: session.user.id,
                    next: '/onboarding' // Redirect back here
                })
            })
                .then(res => res.json())
                .then(data => setAuthUrl(data.authUrl))
                .catch(console.error)
        }
    }, [session])

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault()

        // If resuming, just go to step 2
        if (existingOrg) {
            setStep(2)
            return
        }

        if (!name.trim()) return
        setIsSubmitting(true)
        setError(null)
        try {
            const response = await fetch('/api/provision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify({ organizationName: name.trim() })
            })
            const data = await response.json()
            if (!response.ok) {
                if (data.slug) {
                    setOrgSlug(data.slug)
                    setStep(2)
                    return
                }
                throw new Error(data.error || 'Failed to create organization')
            }
            if (data.slug) {
                setOrgSlug(data.slug)
                setStep(2)
            }
        } catch (err: any) {
            logger.error('Provisioning exception', err)
            setError(err.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleConnectDrive = () => {
        if (authUrl) {
            window.location.href = authUrl
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-white p-4 relative overflow-hidden">
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-sm p-8 relative z-10">

                <div className="flex justify-center mb-6">
                    <Logo size="lg" variant="neutral" />
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-8 gap-2">
                    <div className={`h-1.5 w-12 rounded-full transition-colors ${step && step >= 1 ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 w-12 rounded-full transition-colors ${step && step >= 2 ? 'bg-slate-800' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 w-12 rounded-full transition-colors ${step && step >= 3 ? 'bg-slate-800' : 'bg-slate-200'}`} />
                </div>

                {isLoading ? (
                    <LoadingSpinner
                        message="Loading your workspace..."
                        showDots={true}
                        size="lg"
                    />
                ) : (
                    <>
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-4 mb-6 text-center">
                                    <div>
                                        <h3 className="font-bold text-2xl text-slate-900">Setup your Organization</h3>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Create a home for your organization.
                                        </p>
                                    </div>

                                    {/* User Profile Section */}
                                    <div className="bg-white border border-slate-200 rounded-lg p-3 mb-6 flex items-center gap-3 text-left">
                                        <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 text-slate-800 font-bold text-lg">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {user?.email}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="h-3.5 w-3.5 bg-slate-200 rounded-full flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                    </svg>
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">Organization Owner</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <form onSubmit={handleCreateOrg}>
                                    <div className="space-y-4">
                                        <div className="space-y-2 text-left">
                                            <label htmlFor="name" className="text-sm font-medium text-slate-700">
                                                Organization Name
                                            </label>
                                            <Input
                                                id="name"
                                                placeholder="Acme Corp"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                disabled={isSubmitting || !!existingOrg}
                                                autoFocus={!existingOrg}
                                                className="h-11"
                                            />
                                            {error && (
                                                <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100">{error}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-8">
                                        <Button type="submit" className="w-full h-11 text-base bg-slate-900 hover:bg-slate-800 text-white" disabled={(!name.trim() && !existingOrg) || isSubmitting}>
                                            {isSubmitting && <LoadingSpinner size="sm" />}
                                            {existingOrg ? "Continue" : "Create & Continue"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}


                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2 mb-6 text-center">
                                    <div className="mx-auto h-12 w-12 bg-slate-100 text-slate-700 rounded-full flex items-center justify-center mb-4">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-2xl text-slate-900">Connect Data Source</h3>
                                    <p className="text-sm text-slate-500">
                                        Connect a provider to manage your documents.
                                    </p>
                                </div>

                                {isConnected ? (
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col items-center justify-center text-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-6 w-6 text-slate-700" />
                                            <p className="text-base font-bold text-slate-800">Connection Successful!</p>
                                        </div>
                                        {connectedEmail && (
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-medium text-slate-700 mb-3 shadow-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
                                                {connectedEmail}
                                            </div>
                                        )}
                                        <p className="text-xs text-slate-600 mb-2">Select a drive below to continue.</p>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleConnectDrive}
                                            className="text-xs text-slate-600 hover:text-slate-800 h-auto p-0 hover:bg-transparent underline"
                                        >
                                            Reconnect / Switch Account
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-slate-600">
                                                <p className="font-medium text-slate-900 mb-1">Unlock your Client Portal</p>
                                                <ul className="list-disc list-inside space-y-1 text-xs">
                                                    <li>Transform folders into a branded portal</li>
                                                    <li>Organize files for every client</li>
                                                    <li>Share documents securely & professionally</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100 mb-4 text-center">{error}</p>
                                )}

                                {!isConnected ? (
                                    <>
                                        <div className="mb-4">
                                            <h3 className="text-sm font-semibold text-slate-800 mb-1">Select Provider</h3>
                                            <p className="text-xs text-slate-500">Connect your workspace to get started.</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            {/* Google Drive Card */}
                                            <div
                                                onClick={authUrl ? handleConnectDrive : undefined}
                                                className={`bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-3 transition-all group relative overflow-hidden text-center h-40 justify-center ${authUrl ? 'hover:border-slate-600 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                                            >
                                                <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                    {/* Google Drive logo - original colors */}
                                                    <svg className="h-8 w-8" viewBox="0 0 24 24">
                                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-700 transition-colors">Google Drive</h4>
                                                    <p className="text-[10px] text-slate-600 font-medium mt-1">Ready to connect</p>
                                                </div>
                                            </div>

                                            {/* Placeholder: Dropbox */}
                                            <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-3 bg-white opacity-60 cursor-not-allowed text-center h-40 justify-center">
                                                <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                    <svg className="h-8 w-8" viewBox="0 0 30 25" fill="none" xmlns="http://www.w3.org/2000/svg" data-testid="dropbox-glyph">
                                                        <path d="M7.70076 0.320312L0.478516 4.91332L7.70076 9.50633L14.9242 4.91332L22.1465 9.50633L29.3687 4.91332L22.1465 0.320312L14.9242 4.91332L7.70076 0.320312Z" fill="#0061FE" />
                                                        <path d="M7.70076 18.6925L0.478516 14.0994L7.70076 9.50633L14.9242 14.0994L7.70076 18.6925Z" fill="#0061FE" />
                                                        <path d="M14.9242 14.0994L22.1465 9.50633L29.3687 14.0994L22.1465 18.6925L14.9242 14.0994Z" fill="#0061FE" />
                                                        <path d="M14.9242 24.8164L7.70077 20.2234L14.9242 15.6304L22.1465 20.2234L14.9242 24.8164Z" fill="#0061FE" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-400">Dropbox</h4>
                                                    <p className="text-[10px] text-slate-400 mt-1">Coming soon</p>
                                                </div>
                                            </div>

                                            {/* Placeholder: Box */}
                                            <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-3 bg-white opacity-60 cursor-not-allowed text-center h-40 justify-center">
                                                <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                    <svg className="h-8 w-8 logo-box" id="Layer_1" viewBox="0 0 40 21.6">
                                                        <path className="box-logo-svg" d="M39.7 19.2c.5.7.4 1.6-.2 2.1-.7.5-1.7.4-2.2-.2l-3.5-4.5-3.4 4.4c-.5.7-1.5.7-2.2.2-.7-.5-.8-1.4-.3-2.1l4-5.2-4-5.2c-.5-.7-.3-1.7.3-2.2.7-.5 1.7-.3 2.2.3l3.4 4.5L37.3 7c.5-.7 1.4-.8 2.2-.3.7.5.7 1.5.2 2.2L35.8 14l3.9 5.2zm-18.2-.6c-2.6 0-4.7-2-4.7-4.6 0-2.5 2.1-4.6 4.7-4.6s4.7 2.1 4.7 4.6c-.1 2.6-2.2 4.6-4.7 4.6zm-13.8 0c-2.6 0-4.7-2-4.7-4.6 0-2.5 2.1-4.6 4.7-4.6s4.7 2.1 4.7 4.6c0 2.6-2.1 4.6-4.7 4.6zM21.5 6.4c-2.9 0-5.5 1.6-6.8 4-1.3-2.4-3.9-4-6.9-4-1.8 0-3.4.6-4.7 1.5V1.5C3.1.7 2.4 0 1.6 0 .7 0 0 .7 0 1.5v12.6c.1 4.2 3.5 7.5 7.7 7.5 3 0 5.6-1.7 6.9-4.1 1.3 2.4 3.9 4.1 6.8 4.1 4.3 0 7.8-3.4 7.8-7.7.1-4.1-3.4-7.5-7.7-7.5z" fill="#0061D5" />
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-400">Box</h4>
                                                    <p className="text-[10px] text-slate-400 mt-1">Coming soon</p>
                                                </div>
                                            </div>

                                            {/* Placeholder: OneDrive */}
                                            <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center gap-3 bg-white opacity-60 cursor-not-allowed text-center h-40 justify-center">
                                                <div className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                    <svg className="root_ce4e93fc h-8 w-8" width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M10.0612 10.0071C4.63381 10.0072 0.576899 14.4499 0.271484 19.3991C0.46055 20.4655 1.08197 22.5713 2.05512 22.4632C3.27156 22.328 6.33519 22.4632 8.94828 17.7326C10.8571 14.2769 14.7838 10.007 10.0612 10.0071Z" fill="url(#paint0_radial_9_31050)"></path>
                                                        <path d="M8.80561 11.8538C6.98126 14.7423 4.52553 18.8811 3.69671 20.1836C2.71151 21.7317 0.102357 21.074 0.318506 18.8549C0.297198 19.0351 0.280832 19.2167 0.269548 19.3995C-0.0873823 25.173 4.49016 29.9676 10.1863 29.9676C16.4643 29.9676 31.4367 22.1455 29.9215 14.3081C28.3245 9.70109 23.8357 6.39673 18.7486 6.39673C13.6615 6.39673 10.4012 9.32752 8.80561 11.8538Z" fill="url(#paint1_radial_9_31050)"></path>
                                                        <path d="M8.80561 11.8538C6.98126 14.7423 4.52553 18.8811 3.69671 20.1836C2.71151 21.7317 0.102357 21.074 0.318506 18.8549C0.297198 19.0351 0.280832 19.2167 0.269548 19.3995C-0.0873823 25.173 4.49016 29.9676 10.1863 29.9676C16.4643 29.9676 31.4367 22.1455 29.9215 14.3081C28.3245 9.70109 23.8357 6.39673 18.7486 6.39673C13.6615 6.39673 10.4012 9.32752 8.80561 11.8538Z" fill="url(#paint2_radial_9_31050)" fillOpacity="0.4"></path>
                                                        <path d="M8.80561 11.8538C6.98126 14.7423 4.52553 18.8811 3.69671 20.1836C2.71151 21.7317 0.102357 21.074 0.318506 18.8549C0.297198 19.0351 0.280832 19.2167 0.269548 19.3995C-0.0873823 25.173 4.49016 29.9676 10.1863 29.9676C16.4643 29.9676 31.4367 22.1455 29.9215 14.3081C28.3245 9.70109 23.8357 6.39673 18.7486 6.39673C13.6615 6.39673 10.4012 9.32752 8.80561 11.8538Z" fill="url(#paint3_radial_9_31050)"></path>
                                                        <path d="M8.80561 11.8538C6.98126 14.7423 4.52553 18.8811 3.69671 20.1836C2.71151 21.7317 0.102357 21.074 0.318506 18.8549C0.297198 19.0351 0.280832 19.2167 0.269548 19.3995C-0.0873823 25.173 4.49016 29.9676 10.1863 29.9676C16.4643 29.9676 31.4367 22.1455 29.9215 14.3081C28.3245 9.70109 23.8357 6.39673 18.7486 6.39673C13.6615 6.39673 10.4012 9.32752 8.80561 11.8538Z" fill="url(#paint4_radial_9_31050)" fillOpacity="0.6"></path>
                                                        <path d="M8.80561 11.8538C6.98126 14.7423 4.52553 18.8811 3.69671 20.1836C2.71151 21.7317 0.102357 21.074 0.318506 18.8549C0.297198 19.0351 0.280832 19.2167 0.269548 19.3995C-0.0873823 25.173 4.49016 29.9676 10.1863 29.9676C16.4643 29.9676 31.4367 22.1455 29.9215 14.3081C28.3245 9.70109 23.8357 6.39673 18.7486 6.39673C13.6615 6.39673 10.4012 9.32752 8.80561 11.8538Z" fill="url(#paint5_radial_9_31050)" fillOpacity="0.9"></path>
                                                        <path d="M10.0947 29.9703C10.0947 29.9703 25.0847 29.9998 27.6273 29.9998C32.2416 29.9998 35.75 26.2326 35.75 21.8368C35.75 17.4409 32.1712 13.6965 27.6274 13.6965C23.0835 13.6965 20.4668 17.0959 18.5015 20.8065C16.1984 25.1546 13.2606 29.9182 10.0947 29.9703Z" fill="url(#paint6_linear_9_31050)"></path>
                                                        <path d="M10.0947 29.9703C10.0947 29.9703 25.0847 29.9998 27.6273 29.9998C32.2416 29.9998 35.75 26.2326 35.75 21.8368C35.75 17.4409 32.1712 13.6965 27.6274 13.6965C23.0835 13.6965 20.4668 17.0959 18.5015 20.8065C16.1984 25.1546 13.2606 29.9182 10.0947 29.9703Z" fill="url(#paint7_radial_9_31050)" fillOpacity="0.4"></path>
                                                        <path d="M10.0947 29.9703C10.0947 29.9703 25.0847 29.9998 27.6273 29.9998C32.2416 29.9998 35.75 26.2326 35.75 21.8368C35.75 17.4409 32.1712 13.6965 27.6274 13.6965C23.0835 13.6965 20.4668 17.0959 18.5015 20.8065C16.1984 25.1546 13.2606 29.9182 10.0947 29.9703Z" fill="url(#paint8_radial_9_31050)" fillOpacity="0.9"></path>
                                                        <defs>
                                                            <radialGradient id="paint0_radial_9_31050" cx="0" cy="0" r="1" gradientTransform="matrix(7.1693 8.5904 -11.9745 14.6167 0.944588 11.3042)" gradientUnits="userSpaceOnUse"><stop stopColor="#4894FE"></stop><stop offset="0.695072" stopColor="#0934B3"></stop></radialGradient>
                                                            <radialGradient id="paint1_radial_9_31050" cx="0" cy="0" r="1" gradientTransform="matrix(-31.5168 36.3542 -27.7778 -22.3863 30.9814 -1.57881)" gradientUnits="userSpaceOnUse"><stop offset="0.165327" stopColor="#23C0FE"></stop><stop offset="0.534" stopColor="#1C91FF"></stop></radialGradient>
                                                            <radialGradient id="paint2_radial_9_31050" cx="0" cy="0" r="1" gradientTransform="matrix(-7.49194 -6.28953 -14.0142 17.4729 8.2044 11.9405)" gradientUnits="userSpaceOnUse"><stop stopColor="white"></stop><stop offset="0.660528" stopColor="#ADC0FF" stopOpacity="0"></stop></radialGradient>
                                                            <radialGradient id="paint3_radial_9_31050" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(18.8411 23.5022) rotate(-139.764) scale(11.0257 16.7449)"><stop stopColor="#033ACC"></stop><stop offset="1" stopColor="#368EFF" stopOpacity="0"></stop></radialGradient>
                                                            <radialGradient id="paint4_radial_9_31050" cx="0" cy="0" r="1" gradientTransform="matrix(9.61928 22.1983 -23.9653 10.3826 7.55695 5.651)" gradientUnits="userSpaceOnUse"><stop offset="0.592618" stopColor="#3464E3" stopOpacity="0"></stop><stop offset="1" stopColor="#033ACC"></stop></radialGradient>
                                                            <radialGradient id="paint5_radial_9_31050" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(30.5935 0.933855) rotate(135) scale(35.5871 55.753)"><stop stopColor="#4BFDE8"></stop><stop offset="0.543937" stopColor="#4BFDE8" stopOpacity="0"></stop></radialGradient>
                                                            <linearGradient id="paint6_linear_9_31050" x1="22.9303" y1="29.9833" x2="22.9303" y2="13.8899" gradientUnits="userSpaceOnUse"><stop stopColor="#0086FF"></stop><stop offset="0.49" stopColor="#00BBFF"></stop></linearGradient>
                                                            <radialGradient id="paint7_radial_9_31050" cx="0" cy="0" r="1" gradientTransform="matrix(14.9901 5.94479 -18.9939 25.318 14.5206 15.6139)" gradientUnits="userSpaceOnUse"><stop stopColor="white"></stop><stop offset="0.785262" stopColor="white" stopOpacity="0"></stop></radialGradient>
                                                            <radialGradient id="paint8_radial_9_31050" cx="0" cy="0" r="1" gradientTransform="matrix(-16.7465 14.4333 -19.8515 -12.1758 35.2485 12.4329)" gradientUnits="userSpaceOnUse"><stop stopColor="#4BFDE8"></stop><stop offset="0.584724" stopColor="#4BFDE8" stopOpacity="0"></stop></radialGradient>
                                                        </defs>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-400">OneDrive</h4>
                                                    <p className="text-[10px] text-slate-400 mt-1">Coming soon</p>
                                                </div>
                                            </div>
                                        </div>

                                        <Button onClick={handleFinish} variant="ghost" className="w-full text-slate-400 hover:text-slate-600 text-xs">
                                            Skip for now
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        {!connectionDetails ? (
                                            <div className="space-y-4">
                                                <div className="h-3 w-32 bg-slate-200 rounded animate-pulse mb-3" />
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Skeleton className="h-32 w-full rounded-xl" />
                                                    <Skeleton className="h-32 w-full rounded-xl" />
                                                </div>
                                            </div>
                                        ) : !isFinalizing ? (
                                            <div className="space-y-4">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left pl-1">
                                                    Where should we organize Client Folders?
                                                </p>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Use My Drive Root Button */}
                                                    <Button
                                                        onClick={() => handleFinalize('root', 'My Drive (Root)')}
                                                        className="h-32 flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 text-slate-800 hover:border-slate-600 hover:shadow-md transition-all rounded-xl relative overflow-hidden group w-full text-wrap text-center"
                                                        disabled={!connectionDetails}
                                                        variant="outline"
                                                    >
                                                        <div className="flex flex-col items-center gap-2 mb-1">
                                                            <svg className="w-8 h-8 text-slate-700" viewBox="0 0 24 24" fill="currentColor">
                                                                <path d="M9.05 15H15q.275 0 .5-.137.225-.138.35-.363l1.1-1.9q.125-.225.1-.5-.025-.275-.15-.5l-2.95-5.1q-.125-.225-.35-.363Q13.375 6 13.1 6h-2.2q-.275 0-.5.137-.225.138-.35.363L7.1 11.6q-.125.225-.125.5t.125.5l1.05 1.9q.125.25.375.375T9.05 15Zm1.2-3L12 9l1.75 3ZM3 17V4q0-.825.587-1.413Q4.175 2 5 2h14q.825 0 1.413.587Q21 3.175 21 4v13Zm2 5q-.825 0-1.413-.587Q3 20.825 3 20v-1h18v1q0 .825-.587 1.413Q19.825 22 19 22Z" />
                                                            </svg>
                                                            <span className="text-sm font-bold">My Drive Root</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-600 leading-tight block mt-1">
                                                            Create client folders directly in your main drive
                                                        </span>
                                                    </Button>

                                                    {/* Select Specific Folder or Shared Drive Button */}
                                                    <Button
                                                        onClick={handleOpenPicker}
                                                        className="h-32 flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-600 hover:text-slate-800 hover:bg-slate-50 transition-all rounded-xl relative overflow-hidden group w-full text-wrap text-center"
                                                        disabled={!connectionDetails}
                                                        variant="outline"
                                                    >
                                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <ArrowRight className="w-4 h-4 text-slate-600" />
                                                        </div>
                                                        <div className="flex flex-col items-center gap-2 mb-1">
                                                            <svg className="w-8 h-8 text-slate-400 group-hover:text-slate-600 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                                                                <g><rect fill="none" height="24" width="24"></rect></g>
                                                                <g><g><path d="M19,2H5C3.9,2,3,2.9,3,4v13h18V4C21,2.9,20.1,2,19,2z M9.5,7C10.33,7,11,7.67,11,8.5c0,0.83-0.67,1.5-1.5,1.5 S8,9.33,8,8.5C8,7.67,8.67,7,9.5,7z M13,14H6v-1.35C6,11.55,8.34,11,9.5,11s3.5,0.55,3.5,1.65V14z M14.5,7C15.33,7,16,7.67,16,8.5 c0,0.83-0.67,1.5-1.5,1.5S13,9.33,13,8.5C13,7.67,13.67,7,14.5,7z M18,14h-4v-1.35c0-0.62-0.3-1.12-0.75-1.5 c0.46-0.1,0.9-0.15,1.25-0.15c1.16,0,3.5,0.55,3.5,1.65V14z"></path><path d="M3,20c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2v-2H3V20z M18,19c0.55,0,1,0.45,1,1s-0.45,1-1,1s-1-0.45-1-1S17.45,19,18,19z"></path></g></g>
                                                            </svg>
                                                            <span className="text-sm font-bold">Select Folder</span>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 leading-tight block mt-1 group-hover:text-slate-600 transition-colors">
                                                            Choose a specific folder to contain all client folders
                                                        </span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <Button disabled className="w-full h-11 text-base bg-slate-900 text-white">
                                                <LoadingSpinner size="sm" />
                                                Setting up...
                                            </Button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

export default function OnboardingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>}>
            <OnboardingContent />
        </Suspense>
    )
}
