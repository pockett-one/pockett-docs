'use client'

import React, { useState, useEffect } from 'react'
import { FirmOption } from '@/lib/actions/firms'
import { Home, LayoutGrid, List, SquarePlus } from 'lucide-react'
import { FirmList } from './firm-list'
import { AddFirmModal } from './add-firm-modal'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface FirmsViewProps {
    firms: FirmOption[]
    activeOrgIdFromJWT?: string | null
}

export function FirmsView({ firms, activeOrgIdFromJWT }: FirmsViewProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Load view mode preference from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pockett-firm-view-mode')
        if (saved === 'list' || saved === 'grid') {
            setViewMode(saved)
        }
    }, [])

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode)
        localStorage.setItem('pockett-firm-view-mode', mode)
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

            {/* Main Content Area: Firm List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Header Control Panel */}
                    <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="d-title flex items-center gap-2.5">
                                    <Home className="h-6 w-6 text-stone-500" />
                                    Firms
                                </h2>
                                <span className="px-3 py-1 bg-stone-100 rounded-full d-body-strong text-stone-600">
                                    {firms.length} {firms.length === 1 ? 'Firm' : 'Firms'}
                                </span>
                                {/* View Toggle — generous padding for hover hit area */}
                                <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
                                    <button
                                        onClick={() => handleViewModeChange('grid')}
                                        className={`px-3 py-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'}`}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleViewModeChange('list')}
                                        className={`px-3 py-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/60'}`}
                                        title="List View"
                                    >
                                        <List className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                            {/* New Firm Button - Right Aligned */}
                            <div className="ml-auto">
                                <AddFirmModal
                                    trigger={
                                        <Button variant="blackCta" size="sm" className="gap-2">
                                            <SquarePlus className="h-4 w-4" />
                                            New Firm
                                        </Button>
                                    }
                                />
                            </div>
                        </div>
                    </div>
                    <FirmList
                        firms={firms}
                        viewMode={viewMode}
                        activeOrgIdFromJWT={activeOrgIdFromJWT}
                    />
                </div>
            </div>
        </div>
    )
}
