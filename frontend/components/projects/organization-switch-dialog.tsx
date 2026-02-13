'use client'

import { useState } from 'react'
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
import { switchOrganization } from '@/lib/actions/organizations'

interface OrganizationSwitchDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    targetOrganizationSlug: string
    targetOrganizationName: string
    currentOrganizationName?: string
}

export function OrganizationSwitchDialog({
    open,
    onOpenChange,
    targetOrganizationSlug,
    targetOrganizationName,
    currentOrganizationName
}: OrganizationSwitchDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSwitch = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // Switch organization and rebuild permissions
            await switchOrganization(targetOrganizationSlug)
            
            // Navigate to the new organization
            router.push(`/d/o/${targetOrganizationSlug}`)
            router.refresh()
            
            // Close dialog
            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || 'Failed to switch organization')
            setIsLoading(false)
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
                        <DialogTitle className="text-slate-900">Switch Organization</DialogTitle>
                    </div>
                    <DialogDescription className="pt-2 text-slate-600">
                        {currentOrganizationName ? (
                            <>
                                You are about to switch from <strong>{currentOrganizationName}</strong> to <strong>{targetOrganizationName}</strong>.
                            </>
                        ) : (
                            <>
                                You are about to switch to <strong>{targetOrganizationName}</strong>.
                            </>
                        )}
                        <br />
                        <br />
                        Your permissions will be refreshed for this organization workspace.
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
                                Switch Organization
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
