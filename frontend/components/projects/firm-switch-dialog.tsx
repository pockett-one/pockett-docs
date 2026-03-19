'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Building2, AlertCircle } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { switchFirm } from '@/lib/actions/firms'

interface FirmSwitchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    targetFirmSlug: string
    targetFirmName: string
    currentFirmName?: string
}

export function FirmSwitchDialog({
    open,
    onOpenChange,
    targetFirmSlug,
    targetFirmName,
    currentFirmName
}: FirmSwitchDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const switchInProgressRef = useRef(false)

    const handleSwitch = async () => {
        if (switchInProgressRef.current) return
        switchInProgressRef.current = true
        setIsLoading(true)
        setError(null)

        try {
            // Switch firm and rebuild permissions
            await switchFirm(targetFirmSlug)

            // Force refresh the Supabase session to get the new JWT with injected metadata
            const { supabase } = await import('@/lib/supabase')
            await supabase.auth.refreshSession()

            // Brief delay so client state (and any RLS) sees the new session before we navigate
            await new Promise(resolve => setTimeout(resolve, 100))

            // Rebuild permission cache for consistency with onboarding
            const { buildUserSettingsPlus } = await import('@/lib/actions/user-settings')
            await buildUserSettingsPlus()

            // Navigate first, then close dialog after a tick so navigation isn't dropped when we unmount
            router.push(`/d/f/${targetFirmSlug}`)
            router.refresh()
            setTimeout(() => onOpenChange(false), 0)
        } catch (err: any) {
            setError(err.message || 'Failed to switch firm')
            setIsLoading(false)
        } finally {
            switchInProgressRef.current = false
        }
    }

    const handleCancel = () => {
        if (!isLoading) {
            setError(null)
            onOpenChange(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleCancel}>
            <DialogContent className="sm:max-w-[425px] border-slate-200">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                            <AlertCircle className="h-5 w-5 text-slate-600" />
                        </div>
                        <DialogTitle className="text-slate-900">Switch Firm</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2 text-slate-600">
                        {currentFirmName ? (
                            <>
                                You are about to switch from <strong>{currentFirmName}</strong> to <strong>{targetFirmName}</strong>.
                            </>
                        ) : (
                            <>
                                You are about to switch to <strong>{targetFirmName}</strong>.
                            </>
                        )}
                        <br />
                        <br />
                        Your permissions will be refreshed for this firm workspace.
                    </DialogDescription>
                </DialogHeader>

                {error && (
                    <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-md">
                        <p className="text-sm text-slate-700">{error}</p>
                    </div>
                )}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        onClick={handleCancel}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSwitch}
                        disabled={isLoading}
                        className="bg-slate-900 hover:bg-slate-800 text-white"
                    >
                        {isLoading ? (
                            <>
                                <LoadingSpinner size="sm" className="mr-2" />
                                Switching...
                            </>
                        ) : (
                            <>
                                <Building2 className="h-4 w-4 mr-2" />
                                Switch Firm
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
