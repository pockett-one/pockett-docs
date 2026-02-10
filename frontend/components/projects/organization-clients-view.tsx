'use client'

import React, { useState, useEffect } from 'react'
import { HierarchyClient, getOrganizationName } from '@/lib/actions/hierarchy'
import { Plus, Building2, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ClientList } from './client-list'
import { AddClientModal } from './add-client-modal'
import Link from 'next/link'

interface OrganizationClientsViewProps {
    clients: HierarchyClient[]
    orgSlug: string
    orgId?: string
}

export function OrganizationClientsView({ clients, orgSlug, orgId }: OrganizationClientsViewProps) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [orgName, setOrgName] = useState<string | null>(null)
    const [canCreateClient, setCanCreateClient] = useState(false)

    // Load view mode preference from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('pockett-client-view-mode')
        if (saved === 'list' || saved === 'grid') {
            setViewMode(saved)
        }
    }, [])

    // Fetch organization name
    useEffect(() => {
        getOrganizationName(orgSlug).then(setOrgName).catch(() => setOrgName(null))
    }, [orgSlug])

    // Fetch permissions to check if user can create clients
    useEffect(() => {
        if (orgId) {
            fetch(`/api/permissions/organization?orgId=${orgId}`)
                .then(res => res.json())
                .then(data => {
                    // Check if user has can_manage on client scope
                    const canManage = data.canManageClients || false
                    setCanCreateClient(canManage)
                })
                .catch(err => {
                    console.error("Failed to fetch organization permissions", err)
                    setCanCreateClient(false)
                })
        } else {
            // If no orgId, try to get from clients
            const organizationId = clients.length > 0 ? clients[0].organizationId : null
            if (organizationId) {
                fetch(`/api/permissions/organization?orgId=${organizationId}`)
                    .then(res => res.json())
                    .then(data => {
                        const canManage = data.canManageClients || false
                        setCanCreateClient(canManage)
                    })
                    .catch(err => {
                        console.error("Failed to fetch organization permissions", err)
                        setCanCreateClient(false)
                    })
            }
        }
    }, [orgId, clients])

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode)
        localStorage.setItem('pockett-client-view-mode', mode)
    }

    return (
        <div className="flex flex-col h-full">
            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-slate-500 mb-4">
                <Link 
                    href={`/o/${orgSlug}`}
                    className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{orgName || 'Organization'}</span>
                </Link>
            </div>

            {/* Main Content Area: Client List */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Header Control Panel */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 mb-5 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-4">
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                                    <Building2 className="h-6 w-6 text-slate-600" />
                                    {orgName || 'Organization'}
                                </h2>
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                                    {clients.length} {clients.length === 1 ? 'Client' : 'Clients'}
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
                            {/* New Client Button - Right Aligned with natural spacing */}
                            {canCreateClient && (
                                <div className="ml-auto">
                                    <AddClientModal
                                        orgSlug={orgSlug}
                                        trigger={
                                            <Button size="sm" className="gap-2 bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
                                                <Plus className="h-4 w-4" />
                                                New Client
                                            </Button>
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <ClientList
                        clients={clients}
                        orgSlug={orgSlug}
                        viewMode={viewMode}
                    />
                </div>
            </div>
        </div>
    )
}
