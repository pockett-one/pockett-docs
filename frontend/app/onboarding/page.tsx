"use client"

import { useState, useEffect, Suspense, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, CheckCircle2, Zap, ArrowRight, ShieldCheck, FolderPlus } from "lucide-react"
import Logo from "@/components/Logo"
import useDrivePicker from 'react-google-drive-picker'
import { config } from "@/lib/config"

const OnboardingContent = () => {
    const { session, user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    // Google Picker
    const [openPicker, authResponse] = useDrivePicker();

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
                        console.log("Onboarding: Fetched Org Data:", data)

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
                    console.error("Failed to fetch organizations", e)
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
            }
        } catch (e) {
            console.error("Failed to fetch picker token", e)
        }
    }

    // Handle Picker Selection
    const handleOpenPicker = useCallback(() => {
        if (!connectionDetails?.accessToken || !connectionDetails?.clientId) {
            console.error("No access token or client ID available for picker")
            return
        }

        console.log("Launching Picker with Client ID:", connectionDetails.clientId)

        openPicker({
            clientId: connectionDetails.clientId,
            developerKey: undefined as any, // FORCE undefined (with cast) to test if key is causing 403
            appId: config.googleDrive.appId || "",
            token: connectionDetails.accessToken,
            supportDrives: true,
            multiselect: false,
            setIncludeFolders: true,
            setSelectFolderEnabled: true,
            setMimeTypes: 'application/vnd.google-apps.folder',
            setMode: window.google.picker.DocsViewMode.LIST,
            customViews: [
                new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
                    .setIncludeFolders(true)
                    .setSelectFolderEnabled(true)
                    .setMimeTypes('application/vnd.google-apps.folder')
                    .setMode(window.google.picker.DocsViewMode.LIST)
                    .setEnableDrives(true)
                    .setLabel("Shared Drives")
            ],
            callbackFunction: (data) => {
                if (data.action === 'picked') {
                    const folder = data.docs[0]
                    handleFinalize(folder.id, folder.name)
                } else if (data.action === 'cancel') {
                    console.log('User clicked cancel/close button')
                }
            },
        })
    }, [connectionDetails, openPicker])


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
            console.error('Provisioning exception', err)
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
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 opacity-[0.4]"
                    style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '32px 32px' }}>
                </div>
            </div>

            <div className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl shadow-xl p-8 relative z-10">

                <div className="flex justify-center mb-6">
                    <Logo size="lg" />
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-8 gap-2">
                    <div className={`h-1.5 w-12 rounded-full transition-colors ${step && step >= 1 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 w-12 rounded-full transition-colors ${step && step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 w-12 rounded-full transition-colors ${step && step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                        <p className="text-slate-500 text-sm">Loading your workspace...</p>
                    </div>
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
                                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 flex items-center gap-3 text-left">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700 font-bold text-lg">
                                            {user?.email?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-900 truncate">
                                                {user?.email}
                                            </p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <div className="h-3.5 w-3.5 bg-amber-100 rounded-full flex items-center justify-center">
                                                    <svg className="w-2.5 h-2.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
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
                                        <Button type="submit" className="w-full h-11 text-base" disabled={(!name.trim() && !existingOrg) || isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {existingOrg ? "Continue" : "Create & Continue"}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        )}


                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="space-y-2 mb-6 text-center">
                                    <div className="mx-auto h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                                        <Zap className="h-6 w-6" />
                                    </div>
                                    <h3 className="font-bold text-2xl text-slate-900">Connect Data Source</h3>
                                    <p className="text-sm text-slate-500">
                                        Connect Google Drive to analyze your documents.
                                    </p>
                                </div>

                                {isConnected ? (
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex flex-col items-center justify-center text-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-6 w-6 text-indigo-600" />
                                            <p className="text-base font-bold text-indigo-700">Connection Successful!</p>
                                        </div>
                                        <p className="text-xs text-indigo-600 mb-2">Select a drive below to continue.</p>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleConnectDrive}
                                            className="text-xs text-indigo-500 hover:text-indigo-700 h-auto p-0 hover:bg-transparent underline"
                                        >
                                            Reconnect / Switch Account
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                            <div className="text-sm text-slate-600">
                                                <p className="font-medium text-slate-900 mb-1">Unlock your Client Portal</p>
                                                <ul className="list-disc list-inside space-y-1 text-xs">
                                                    <li>Transform folders into a branded portal</li>
                                                    <li>Auto-organize files for every client</li>
                                                    <li>Share documents securely & professionally</li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {error && (
                                    <p className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100 mb-4 text-center">{error}</p>
                                )}

                                <div className="space-y-3">
                                    {!isConnected ? (
                                        <>
                                            <div className="grid grid-cols-1 gap-3 mb-3">
                                                {/* Google Drive Card */}
                                                <div
                                                    onClick={authUrl ? handleConnectDrive : undefined}
                                                    className={`border border-slate-200 rounded-xl p-4 flex items-center gap-4 transition-all group relative overflow-hidden bg-white ${authUrl ? 'hover:border-indigo-600 hover:shadow-md cursor-pointer' : 'opacity-70 cursor-not-allowed'}`}
                                                >
                                                    <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                        <svg className="h-8 w-8" viewBox="0 0 24 24">
                                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Google Drive</h4>
                                                        <p className="text-xs text-slate-500 line-clamp-1">Connect your workspace files.</p>
                                                    </div>
                                                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
                                                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                                                    </div>
                                                </div>

                                                {/* Placeholder: Dropbox */}
                                                <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-4 bg-slate-50/50 opacity-60 cursor-not-allowed">
                                                    <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                        <div className="bg-blue-600/20 text-blue-600 rounded flex items-center justify-center text-lg font-bold w-full h-full">D</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h4 className="text-sm font-bold text-slate-400">Dropbox</h4>
                                                        <p className="text-xs text-slate-400">Coming soon</p>
                                                    </div>
                                                </div>

                                                {/* Placeholder: Box */}
                                                <div className="border border-slate-100 rounded-xl p-4 flex items-center gap-4 bg-slate-50/50 opacity-60 cursor-not-allowed">
                                                    <div className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center p-2 shadow-sm shrink-0">
                                                        <div className="bg-blue-500/20 text-blue-500 rounded flex items-center justify-center text-lg font-bold w-full h-full">B</div>
                                                    </div>
                                                    <div className="flex-1 text-left">
                                                        <h4 className="text-sm font-bold text-slate-400">Box</h4>
                                                        <p className="text-xs text-slate-400">Coming soon</p>
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
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider text-left pl-1">Where are your documents?</p>

                                                    <div className="grid grid-cols-1 gap-3">
                                                        {/* Single Select Folder Button */}
                                                        <Button
                                                            onClick={handleOpenPicker}
                                                            className="h-24 flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-200 text-slate-700 hover:border-indigo-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl relative overflow-hidden group w-full"
                                                            disabled={!connectionDetails}
                                                            variant="outline"
                                                        >
                                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <ArrowRight className="w-4 h-4 text-indigo-600" />
                                                            </div>
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <div className="h-10 w-10 rounded-full bg-slate-100 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all">
                                                                    <img src="https://ssl.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png" alt="Drive" className="w-6 h-6" />
                                                                </div>
                                                                <div className="h-10 w-10 rounded-full bg-slate-100 group-hover:bg-white group-hover:shadow-sm flex items-center justify-center transition-all">
                                                                    <FolderPlus className="w-5 h-5 text-slate-600" />
                                                                </div>
                                                            </div>
                                                            <span className="text-sm font-bold">Select Destination Folder</span>
                                                            <span className="text-[10px] text-slate-400 mt-1">Choose from My Drive or Shared Drives</span>
                                                        </Button>
                                                    </div>

                                                    <p className="text-[10px] text-slate-400 text-center px-4 mt-4">
                                                        The picker will allow you to navigate both My Drive and Shared Drives.
                                                    </p>
                                                </div>
                                            ) : (
                                                <Button disabled className="w-full h-11 text-base bg-indigo-600">
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Setting up Pockett...
                                                </Button>
                                            )}
                                        </>
                                    )}
                                </div>
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
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>}>
            <OnboardingContent />
        </Suspense>
    )
}
