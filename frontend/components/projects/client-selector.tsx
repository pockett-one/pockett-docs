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
import { HierarchyClient } from '@/lib/actions/hierarchy'

interface ClientSelectorProps {
    clients: HierarchyClient[]
    selectedClientSlug: string
    onClientChange: (clientSlug: string) => void
    className?: string
}

export function ClientSelector({ clients, selectedClientSlug, onClientChange, className }: ClientSelectorProps) {
    const router = useRouter()

    const handleValueChange = (clientSlug: string) => {
        onClientChange(clientSlug)
    }

    if (clients.length === 0) {
        return (
            <div className={`w-full max-w-xs ${className || ''}`}>
                <label className="text-xs font-semibold uppercase text-slate-500 mb-1.5 block tracking-wider">
                    Client Workspace
                </label>
                <div className="w-full h-10 bg-slate-50 border border-slate-200 rounded-md flex items-center px-3 text-sm text-slate-400">
                    No clients found
                </div>
            </div>
        )
    }

    return (
        <div className={`w-full max-w-xs ${className || ''}`}>
            <label className="text-xs font-semibold uppercase text-slate-500 mb-1.5 block tracking-wider">
                Client Workspace
            </label>
            <Select
                value={selectedClientSlug}
                onValueChange={handleValueChange}
            >
                <SelectTrigger className="w-full h-14 bg-white border-slate-200 shadow-sm transition-all hover:bg-slate-50">
                    <SelectValue placeholder="Select a client..." />
                </SelectTrigger>
                <SelectContent>
                    {clients.map((client) => (
                        <SelectItem key={client.id} value={client.slug} className="cursor-pointer py-2">
                            <div className="flex flex-col items-start text-left max-w-[200px]">
                                <span className="font-medium text-slate-900 truncate w-full" title={client.name}>
                                    {client.name}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono truncate w-full">
                                    /{client.slug}
                                </span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
