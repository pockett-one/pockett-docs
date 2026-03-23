'use client'

import Link from 'next/link'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { upgradeCopy } from '@/lib/billing/upgrade-copy'
import { cn } from '@/lib/utils'

export function BillingPolarExplainInline({ className }: { className?: string }) {
    return (
        <span className={cn('inline-flex items-center gap-0.5', className)}>
            <Link
                href={upgradeCopy.polarShUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-violet-700 underline decoration-violet-300/80 underline-offset-2 hover:text-violet-900 hover:decoration-violet-500"
            >
                {upgradeCopy.polarLinkLabel}
            </Link>
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/50 focus-visible:ring-offset-1"
                            aria-label={`About ${upgradeCopy.polarLinkLabel}`}
                        >
                            <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start" className="max-w-[min(20rem,calc(100vw-2rem))] text-xs leading-relaxed">
                        {upgradeCopy.polarTooltip}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </span>
    )
}

export function BillingCheckoutFootnote({ dense }: { dense?: boolean }) {
    return (
        <p
            className={cn(
                'leading-relaxed',
                dense ? 'text-[11px] text-slate-500' : 'text-xs text-slate-600'
            )}
        >
            {upgradeCopy.billingCheckoutIntro}{' '}
            <BillingPolarExplainInline />
            {upgradeCopy.billingCheckoutOutro}
        </p>
    )
}
