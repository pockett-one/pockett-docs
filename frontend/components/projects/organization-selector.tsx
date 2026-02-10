'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

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

    const handleValueChange = (orgSlug: string) => {
        onOrganizationChange(orgSlug)
    }

    if (organizations.length === 0) {
        return (
            <div className={`w-full max-w-xs ${className || ''}`}>
                <label className="text-xs font-semibold uppercase text-slate-500 mb-1.5 block tracking-wider">
                    Organization Workspace
                </label>
                <div className="w-full h-10 bg-slate-50 border border-slate-200 rounded-md flex items-center px-3 text-sm text-slate-400">
                    No organizations found
                </div>
            </div>
        )
    }

    return (
        <div className={`w-full max-w-xs ${className || ''}`}>
            <label className="text-xs font-semibold uppercase text-slate-500 mb-1.5 block tracking-wider">
                Organization Workspace
            </label>
            <Select
                value={selectedOrganizationSlug}
                onValueChange={handleValueChange}
            >
                <SelectTrigger className="w-full h-14 bg-white border-slate-200 shadow-sm transition-all hover:bg-slate-50">
                    <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                    {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.slug} className="cursor-pointer py-2">
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
        </div>
    )
}
