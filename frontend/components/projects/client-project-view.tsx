'use client'

import React, { useState, useEffect } from 'react'
import { HierarchyClient } from '@/lib/actions/hierarchy'
import { ClientSelector } from './client-selector'
import { ProjectList } from './project-list'
import { Plus, ChevronRight, Building2, Users, Folder, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { AddProjectModal } from './add-project-modal'
import { ClientDetailsModal } from './client-details-modal'
import Link from 'next/link'

interface ClientProjectViewProps {
    clients: HierarchyClient[]
    orgSlug: string // Used for building links
    orgName?: string // Added orgName
    selectedClientSlug?: string // Added selectedClientSlug prop
}

export function ClientProjectView({ clients, orgSlug, orgName, selectedClientSlug }: ClientProjectViewProps) {
    const router = useRouter()
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [isClientDetailsOpen, setIsClientDetailsOpen] = useState(false)

    // Load view mode preference from localStorage on mount
    useEffect(() => {
        const savedViewMode = localStorage.getItem('pockett-project-view-mode')
        if (savedViewMode === 'grid' || savedViewMode === 'list') {
            setViewMode(savedViewMode)
        }
    }, [])

    // Save view mode preference to localStorage when it changes
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode)
        localStorage.setItem('pockett-project-view-mode', mode)
    }

    // If a specific clientSlug is provided via props (from URL), use it.
    // Otherwise fallback to first client or empty.
    const activeClientSlug = selectedClientSlug || (clients.length > 0 ? clients[0].slug : '')

    // Find the selected client object
    const selectedClient = clients.find(c => c.slug === activeClientSlug)


    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <h3 className="text-lg font-medium text-slate-900">No Clients Found</h3>
                <p className="text-slate-500 mt-2">Get started by creating your first client workspace using the sidebar.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <div className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-default">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{orgName || 'Organization'}</span>
                </div>
                {selectedClient && (
                    <>
                        <ChevronRight className="h-4 w-4 mx-1 text-slate-300" />
                        <button
                            onClick={() => setIsClientDetailsOpen(true)}
                            className="flex items-center gap-2 text-slate-900 bg-slate-100 px-2 py-1 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                        >
                            <Users className="h-4 w-4" />
                            <span className="font-semibold">{selectedClient.name}</span>
                        </button>
                    </>
                )}
            </div>

            {/* Main Content Area: Project List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                {selectedClient ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                        {/* Header Control Panel */}
                        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                                        <Users className="h-6 w-6 text-slate-600" />
                                        {selectedClient.name}
                                    </h2>
                                    <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                                        {selectedClient.projects.length} Projects
                                    </span>
                                    {/* View Toggle */}
                                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                                        <button
                                            onClick={() => handleViewModeChange('grid')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                            title="Grid View"
                                        >
                                            <LayoutGrid className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleViewModeChange('list')}
                                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                                            title="List View"
                                        >
                                            <List className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                                {/* New Project Button - Right Aligned with natural spacing */}
                                <div className="ml-auto">
                                    <AddProjectModal
                                        orgSlug={orgSlug}
                                        clientSlug={selectedClient.slug}
                                        trigger={
                                            <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                                                <Plus className="h-4 w-4" />
                                                New Project
                                            </Button>
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <ProjectList projects={selectedClient.projects} orgSlug={orgSlug} clientSlug={selectedClient.slug} viewMode={viewMode} />
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400">Select a client to view projects</div>
                )}
            </div>

            {/* Client Details Modal */}
            <ClientDetailsModal
                client={selectedClient || null}
                open={isClientDetailsOpen}
                onOpenChange={setIsClientDetailsOpen}
            />
        </div>
    )
}
