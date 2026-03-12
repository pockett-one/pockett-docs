'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Building2 } from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { OrganizationSwitchDialog } from './organization-switch-dialog'

export interface OrganizationOption {
    id: string
    name: string
    slug: string
    isDefault: boolean
    sandboxOnly: boolean
}

interface OrganizationSelectorProps {
    organizations: OrganizationOption[]
    selectedOrganizationSlug: string
    onOrganizationChange: (orgSlug: string) => void
    className?: string
}

export function OrganizationSelector({ organizations, selectedOrganizationSlug, onOrganizationChange, className }: OrganizationSelectorProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
    const [targetOrg, setTargetOrg] = useState<{ slug: string; name: string } | null>(null)
    const [pendingSlug, setPendingSlug] = useState<string | null>(null)

    // Extract current organization slug from pathname
    const currentOrgSlug = pathname?.match(/\/(?:d\/)?o\/([^\/]+)/)?.[1] || null
    const currentOrg = currentOrgSlug ? organizations.find(o => o.slug === currentOrgSlug) : null

    // Keep the current selected slug when dialog is open (prevent Select from changing visually)
    const displaySlug = switchDialogOpen ? selectedOrganizationSlug : selectedOrganizationSlug

    const handleValueChange = (orgSlug: string) => {
        // If switching to a different organization, show confirmation
        if (currentOrgSlug && currentOrgSlug !== orgSlug) {
            const target = organizations.find(o => o.slug === orgSlug)
            if (target) {
                setPendingSlug(orgSlug)
                setTargetOrg({ slug: target.slug, name: target.name })
                setSwitchDialogOpen(true)
            }
        } else {
            // Same organization or no current org, allow normal change
            onOrganizationChange(orgSlug)
        }
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            // User cancelled - reset pending slug
            setPendingSlug(null)
            setTargetOrg(null)
        }
        setSwitchDialogOpen(open)
    }

    if (organizations.length === 0) {
        return (
            <div className={`w-full max-w-xs ${className || ''}`}>
                <label className="d-section mb-4 block">
                    Organization Workspace
                </label>
                <div className="w-full h-10 bg-stone-100/80 border border-stone-200 rounded-md flex items-center px-3 d-body text-stone-400">
                    No organizations found
                </div>
            </div>
        )
    }

    return (
        <div className={`w-full ${className || ''}`}>
            <Select
                value={selectedOrganizationSlug}
                onValueChange={handleValueChange}
            >
                <SelectTrigger className="flex h-10 w-full items-center gap-2 rounded-lg border-none bg-transparent px-3 py-2 text-stone-900 shadow-none transition-colors hover:bg-slate-100 focus:ring-0 [&>svg]:ml-auto">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Building2 className="h-4 w-4 shrink-0 text-stone-500" />
                        <SelectValue placeholder="Select Workspace..." className="text-sm font-semibold truncate" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-100 bg-white shadow-md py-2 min-w-[var(--radix-select-trigger-width)]">
                    {organizations.map((org) => (
                        <SelectItem
                            key={org.id}
                            value={org.slug}
                            className="cursor-pointer rounded-lg py-2.5 px-3 text-sm focus:bg-slate-50 data-[highlighted]:bg-slate-50"
                        >
                            <div className="flex flex-col items-start text-left w-full gap-0.5">
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-medium text-slate-900 line-clamp-1 w-full" title={org.name}>
                                        {org.name}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between w-full gap-2">
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
                </SelectContent>
            </Select>

            {targetOrg && (
                <OrganizationSwitchDialog
                    open={switchDialogOpen}
                    onOpenChange={handleDialogClose}
                    targetOrganizationSlug={targetOrg.slug}
                    targetOrganizationName={targetOrg.name}
                    currentOrganizationName={currentOrg?.name}
                />
            )}
        </div>
    )
}
