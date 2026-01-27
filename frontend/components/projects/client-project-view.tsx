'use client'

import React, { useState, useEffect } from 'react'
import { HierarchyClient } from '@/lib/actions/hierarchy'
import { ClientSelector } from './client-selector'
import { ProjectList } from './project-list'
import { Plus, ChevronRight, Building2, Users, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AddClientModal } from './add-client-modal'

interface ClientProjectViewProps {
    clients: HierarchyClient[]
    orgSlug: string // Used for building links
    orgName?: string // Added orgName
    selectedClientSlug?: string // Added selectedClientSlug prop
}

export function ClientProjectView({ clients, orgSlug, orgName, selectedClientSlug }: ClientProjectViewProps) {
    const router = useRouter()

    // If a specific clientSlug is provided via props (from URL), use it.
    // Otherwise fallback to first client or empty.
    const activeClientSlug = selectedClientSlug || (clients.length > 0 ? clients[0].slug : '')

    // Find the selected client object
    const selectedClient = clients.find(c => c.slug === activeClientSlug)


    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <h3 className="text-lg font-medium text-slate-900">No Clients Found</h3>
                <p className="text-slate-500 mt-2">Get started by creating your first client workspace.</p>
                <div className="mt-4">
                    <AddClientModal orgSlug={orgSlug} />
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-2">
                <div className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-default">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{orgName || 'Organization'}</span>
                </div>
                {selectedClient && (
                    <>
                        <ChevronRight className="h-4 w-4 mx-1 text-slate-300" />
                        <div className="flex items-center gap-2 text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                            <Users className="h-4 w-4" />
                            <span className="font-semibold">{selectedClient.name}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Header / Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-0">
                {/* Left Side spacer if needed, or just flex-end */}
                <div></div>

                <div className="flex items-center gap-3">
                    <AddClientModal
                        orgSlug={orgSlug}
                        trigger={
                            <Button variant="outline" size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Client
                            </Button>
                        }
                    />
                    {/* Placeholder for future specific actions */}
                    <div className="text-right">
                        <p className="text-xs font-medium text-slate-500">
                            {selectedClient?.projects.length || 0} Projects
                        </p>
                    </div>
                    <Button size="sm" className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" />
                        New Project
                    </Button>
                </div>
            </div>

            {/* Main Content Area: Project List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pt-2">
                {selectedClient ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {selectedClient.name}
                            </h2>
                            <p className="text-sm text-slate-500">Manage engagements and folders for this client.</p>
                        </div>
                        <ProjectList projects={selectedClient.projects} orgSlug={orgSlug} clientSlug={selectedClient.slug} />
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">Select a client to view projects</div>
                )}
            </div>
        </div>
    )
}
