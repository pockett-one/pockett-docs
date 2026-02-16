'use client'

import React, { useState, useEffect } from 'react'
import { OrganizationOption } from '@/lib/actions/organizations'
import { Home, LayoutGrid, List, Plus } from 'lucide-react'
import { OrganizationList } from './organization-list'
import { AddOrganizationModal } from './add-organization-modal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OrganizationsViewProps {
    organizations: OrganizationOption[]
}

export function OrganizationsView({ organizations }: OrganizationsViewProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Load view mode preference from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pockett-organization-view-mode')
        if (saved === 'list' || saved === 'grid') {
            setViewMode(saved)
        }
    }, [])

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode)
        localStorage.setItem('pockett-organization-view-mode', mode)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-2">
                <div className="flex items-center gap-2 text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                    <Home className="h-4 w-4" />
                    <span className="font-semibold">Home</span>
                </div>
            </div>

            {/* Main Content Area: Organization List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Header Control Panel */}
                    <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="d-title flex items-center gap-2.5">
                                    <Home className="h-6 w-6 text-stone-500" />
                                    Organizations
                                </h2>
                                <span className="px-3 py-1 bg-stone-100 rounded-full d-body-strong text-stone-600">
                                    {organizations.length} {organizations.length === 1 ? 'Organization' : 'Organizations'}
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
                            {/* New Organization Button - Right Aligned */}
                            <div className="ml-auto">
                                <AddOrganizationModal
                                    trigger={
                                        <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                                            <Plus className="h-4 w-4" />
                                            New Organization
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <OrganizationList
                        organizations={organizations}
                        viewMode={viewMode}
                    />
                </div>
            </div>
        </div>
    )
}
