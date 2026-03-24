'use client'

import { upgradeCopy } from '@/lib/billing/upgrade-copy'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { BillingCheckoutFootnote } from '@/components/billing/billing-polar-inline'
import { PolarPlansPicker } from '@/components/billing/polar-plans-picker'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UpgradePlansDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    firmId: string | null | undefined
    returnPath: string
}

export function UpgradePlansDialog({ open, onOpenChange, firmId, returnPath }: UpgradePlansDialogProps) {
    const id = firmId?.trim() ?? ''

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'max-h-[min(92vh,40rem)] w-[calc(100vw-1.5rem)] max-w-lg gap-0 overflow-hidden p-0 sm:rounded-2xl',
                    'md:max-w-3xl',
                    'border-2 border-slate-200 bg-white shadow-2xl'
                )}
            >
                <DialogHeader className="space-y-2 border-b border-slate-100 px-5 pb-4 pt-5 text-left sm:px-6 sm:pt-6">
                    <DialogTitle className="text-lg font-semibold text-slate-900 sm:text-xl">
                        {upgradeCopy.upgradeDialogTitle}
                    </DialogTitle>
                    <DialogDescription className="text-left text-sm text-slate-600 leading-relaxed">
                        {upgradeCopy.upgradeDialogBody}
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[min(58vh,24rem)] overflow-y-auto px-5 py-4 sm:px-6 md:max-h-[min(62vh,28rem)]">
                    <PolarPlansPicker
                        firmId={id}
                        returnPath={returnPath}
                        portalReturnPath={returnPath}
                        density="compact"
                    />
                </div>

                <div className="space-y-3 border-t border-slate-100 bg-slate-50/90 px-5 py-3 sm:px-6">
                    <BillingCheckoutFootnote dense />
                </div>
            </DialogContent>
        </Dialog>
    )
}
