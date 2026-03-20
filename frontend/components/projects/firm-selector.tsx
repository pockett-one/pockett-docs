'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Building2, SquarePlus } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"
import { FirmSwitchDialog } from './firm-switch-dialog'
import { AddFirmModal } from './add-firm-modal'

const ADD_FIRM_VALUE = '__create__'

export interface FirmOption {
    id: string
    name: string
    slug: string
    isDefault: boolean
    sandboxOnly: boolean
}

interface FirmSelectorProps {
    firms: FirmOption[]
    selectedFirmSlug: string
    onFirmChange: (firmSlug: string) => void
    className?: string
}

export function FirmSelector({ firms, selectedFirmSlug, onFirmChange, className }: FirmSelectorProps) {
    const pathname = usePathname()
    const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
    const [targetOrg, setTargetOrg] = useState<{ slug: string; name: string } | null>(null)
    const [addOrgModalOpen, setAddOrgModalOpen] = useState(false)

    // Extract current firm slug from pathname
    const currentOrgSlug = pathname?.match(/\/(?:d\/)?f\/([^\/]+)/)?.[1] || null
    const currentOrg = currentOrgSlug ? firms.find(o => o.slug === currentOrgSlug) : null
    const selectedOrg = firms.find(o => o.slug === selectedFirmSlug) || null

    const handleValueChange = (orgSlug: string) => {
        if (orgSlug === ADD_FIRM_VALUE) {
            setAddOrgModalOpen(true)
            return
        }
        if (currentOrgSlug && currentOrgSlug !== orgSlug) {
            const target = firms.find(o => o.slug === orgSlug)
            if (target) {
                setTargetOrg({ slug: target.slug, name: target.name })
                setSwitchDialogOpen(true)
            }
        } else {
            onFirmChange(orgSlug)
        }
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            // User cancelled - reset pending slug
            setTargetOrg(null)
        }
        setSwitchDialogOpen(open)
    }

    if (firms.length === 0) {
        return (
            <div className={`w-full max-w-xs ${className || ''}`}>
                <label className="d-section mb-4 block">
                    Firm Workspace
                </label>
                <div className="w-full h-10 bg-stone-100/80 border border-stone-200 rounded-md flex items-center px-3 d-body text-stone-400">
                    No firms found
                </div>
            </div>
        )
    }

    return (
        <div className={`w-full ${className || ''}`}>
            <Select
                value={selectedFirmSlug}
                onValueChange={handleValueChange}
            >
                <SelectTrigger className="flex w-full min-h-[56px] items-start gap-2 overflow-hidden rounded-lg border-none bg-transparent px-3 py-2.5 text-stone-900 shadow-none transition-colors hover:bg-slate-100 focus:ring-0 [&>svg]:ml-auto">
                    <div className="flex flex-1 flex-col min-w-0 text-left leading-tight">
                        <div className="flex items-center gap-2 min-w-0">
                            <Building2 className="h-4 w-4 shrink-0 text-stone-500" />
                            <span className="text-sm font-semibold truncate">
                                {selectedOrg?.name || 'Select Workspace...'}
                            </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 min-w-0">
                            <span className="truncate text-[10px] leading-none text-slate-500 font-mono">
                                {selectedOrg ? `/${selectedOrg.slug}` : '/—'}
                            </span>
                            {selectedOrg?.sandboxOnly && (
                                <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0">
                                    Sandbox
                                </span>
                            )}
                        </div>
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-100 bg-white shadow-md py-2 min-w-[var(--radix-select-trigger-width)]">
                    <SelectItem
                        value={ADD_FIRM_VALUE}
                        className="relative z-0 overflow-hidden cursor-pointer rounded-lg py-2.5 px-3 text-sm bg-slate-800 text-white ring-1 ring-inset ring-white/10 shadow-[0_2px_10px_rgba(15,23,42,0.18)] before:absolute before:inset-0 before:z-0 before:bg-[#273244] before:[clip-path:circle(0%_at_85%_50%)] before:transition-[clip-path] before:duration-300 before:ease-out focus:bg-slate-800 focus:text-white focus:before:[clip-path:circle(150%_at_85%_50%)] data-[highlighted]:bg-slate-800 data-[highlighted]:text-white data-[highlighted]:before:[clip-path:circle(150%_at_85%_50%)]"
                    >
                        <div className="relative z-10 flex items-center gap-2">
                            <SquarePlus className="h-4 w-4 text-white/90" />
                            <span className="font-medium">Add Firm</span>
                        </div>
                    </SelectItem>
                    <div className="my-1 border-t border-slate-100" role="separator" />
                    {firms.map((org) => (
                        <SelectItem
                            key={org.id}
                            value={org.slug}
                            // Ensure the trigger shows a concise, single-line label (prevents multi-line content
                            // from the dropdown item from overflowing the trigger on hover).
                            textValue={org.name}
                            className="cursor-pointer rounded-lg py-2.5 px-3 text-sm focus:bg-slate-50 data-[highlighted]:bg-slate-50"
                        >
                            <div className="flex flex-col items-start text-left w-full gap-0.5">
                                <div className="flex items-center gap-2 min-w-0 w-full">
                                    <Building2 className="h-4 w-4 shrink-0 text-stone-500" aria-hidden />
                                    <span className="font-medium text-slate-900 line-clamp-1 min-w-0 flex-1" title={org.name}>
                                        {org.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between w-full gap-2 pl-6">
                                    <span className="text-[10px] text-slate-500 font-mono truncate">
                                        /{org.slug}
                                    </span>
                                    {org.sandboxOnly && (
                                        <span className="inline-flex items-center rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 whitespace-nowrap shrink-0">
                                            Sandbox
                                        </span>
                                    )}
                                </div>
                            </div>
                        </SelectItem>
                    ))}
                    <div className="my-1 border-t border-slate-100" role="separator" />
                </SelectContent>
            </Select>

            {targetOrg && (
                <FirmSwitchDialog
                    open={switchDialogOpen}
                    onOpenChange={handleDialogClose}
                    targetFirmSlug={targetOrg.slug}
                    targetFirmName={targetOrg.name}
                    currentFirmName={currentOrg?.name}
                />
            )}

            <AddFirmModal
                open={addOrgModalOpen}
                onOpenChange={setAddOrgModalOpen}
            />
        </div>
    )
}
