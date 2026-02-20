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
    const currentOrgSlug = pathname?.match(/^\/o\/([^\/]+)/)?.[1] || null
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
        <div className={`w-full max-w-xs ${className || ''}`}>
            <label className="d-section mb-4 block">
                Organization Workspace
            </label>
            <Select
                value={selectedOrganizationSlug}
                onValueChange={handleValueChange}
            >
                <SelectTrigger className="flex h-12 w-full items-center gap-2 rounded-xl border border-stone-200 bg-stone-100/80 px-4 text-stone-900 shadow-none transition-colors hover:bg-stone-200/80 focus:ring-2 focus:ring-stone-200 [&>svg]:ml-0">
                    <Building2 className="h-4 w-4 shrink-0 text-stone-500" />
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-100 bg-white shadow-md py-2 min-w-[var(--radix-select-trigger-width)]">
                    {organizations.map((org) => (
                        <SelectItem
                            key={org.id}
                            value={org.slug}
                            className="cursor-pointer rounded-lg py-2.5 px-3 text-sm focus:bg-slate-50 data-[highlighted]:bg-slate-50"
                        >
                            <div className="flex flex-col items-start text-left max-w-[200px]">
                                <span className="font-medium text-slate-900 truncate w-full" title={org.name}>
                                    {org.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono truncate w-full">
                                    /{org.slug}
                                </span>
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
