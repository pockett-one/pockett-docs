'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectInsightsDashboard } from './project-insights-dashboard'
import { ProjectFileList } from './project-file-list'
import { setSavedFolderState, type BreadcrumbItem } from '@/lib/files-folder-session'
import { ProjectSettingsForm } from './project-settings-form'
import { Folder, BarChart3, Radio, Database, Building2, ChevronRight, Users, Briefcase, Share2, Settings, Home } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ProjectMembersTab } from './members/project-members-tab'
import { ProjectSharesTab } from './shares/project-shares-tab'
import { ErrorBoundary } from '@/components/error-boundary'

const VALID_TABS = new Set(['files', 'shares', 'members', 'insights', 'sources', 'settings'])

export interface ProjectPathSegments {
    tab: string
    viewMode: 'list' | 'board' | 'grid'
}

interface ProjectWorkspaceProps {
    orgSlug: string
    clientSlug: string
    projectId: string
    connectorRootFolderId?: string | null
    orgName?: string
    clientName?: string
    projectName?: string
    canViewSettings?: boolean
    /** Members, Shares, Insights tabs: true for Team Member, Project Lead, Client/Org Owners; false for Guest, External Collaborator */
    canViewInternalTabs?: boolean
    canEdit?: boolean
    canManage?: boolean
    projectDescription?: string
    isClosed?: boolean
    /** When provided, tab and shares sub-state are driven by URL (path-based navigation) */
    pathSegments?: ProjectPathSegments
}

const projectBase = (orgSlug: string, clientSlug: string, projectSlug: string) =>
    `/d/o/${orgSlug}/c/${clientSlug}/p/${projectSlug}`

export function ProjectWorkspace({
    orgSlug,
    clientSlug,
    projectId,
    connectorRootFolderId,
    orgName,
    clientName,
    projectName,
    canViewSettings = false,
    canViewInternalTabs = false,
    canEdit = false,
    canManage = false,
    projectDescription,
    isClosed = false,
    pathSegments,
}: ProjectWorkspaceProps) {
    const pathname = usePathname()
    const router = useRouter()
    const projectSlug = pathname?.split('/p/')[1]?.split('/')[0] ?? ''
    const base = projectBase(orgSlug, clientSlug, projectSlug)
    const currentTab = pathSegments?.tab ?? 'files'

    const handleTabChange = useCallback((value: string) => {
        const suffix = value === 'shares' ? '/grid' : ''
        router.push(`${base}/${value}${suffix}`)
    }, [base, router])

    const handleOpenInFiles = useCallback((folderId: string, breadcrumbs: BreadcrumbItem[]) => {
        setSavedFolderState(projectId, folderId, breadcrumbs)
        router.push(`${base}/files`)
    }, [projectId, base, router])

    return (
        <div className="flex flex-col h-full">
            {/* Breadcrumbs */}
            <div className="d-body flex items-center text-stone-500 mb-2">
                <span className="flex items-center gap-2 text-stone-500" title="Home">
                    <Home className="h-4 w-4" />
                </span>
                <ChevronRight className="h-4 w-4 mx-1 text-slate-300" />
                <Link
                    href={`/d/o/${orgSlug}`}
                    className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                >
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{orgName || 'Organization'}</span>
                </Link>
                {clientName && (
                    <>
                        <ChevronRight className="h-4 w-4 mx-1 text-slate-300" />
                        <Link href={`/d/o/${orgSlug}/c/${clientSlug}`} className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">{clientName}</span>
                        </Link>
                    </>
                )}
                {projectName && (
                    <>
                        <ChevronRight className="h-4 w-4 mx-1 text-slate-300" />
                        <div className="flex items-center gap-2 text-slate-900 bg-slate-100 px-2 py-1 rounded-md">
                            <Briefcase className="h-4 w-4" />
                            <span className="font-semibold">{projectName}</span>
                        </div>
                    </>
                )}
            </div>

            {/* Title section – no gear; Settings is a tab when canViewSettings */}
            <div className="bg-white border border-stone-200 rounded-xl p-5 mb-4 shadow-sm">
                <div className="min-w-0 flex-1">
                    <h1 className="d-title flex items-center gap-2.5">
                        <Briefcase className="h-6 w-6 text-stone-500" />
                        {projectName || 'Project Workspace'}
                    </h1>
                    <p className="d-subtitle mt-1">Manage insights, data sources, and files for this engagement.</p>
                </div>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
                <div className="mb-6">
                    <TabsList className="h-10 p-1 bg-slate-100 rounded-lg inline-flex justify-start flex-wrap gap-1">
                        <TabsTrigger
                            value="files"
                            className="h-full px-4 rounded-md font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                        >
                            <Folder className="w-4 h-4 mr-2" />
                            Files
                        </TabsTrigger>
                        <TabsTrigger
                            value="shares"
                            className="h-full px-4 rounded-md font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Shares
                        </TabsTrigger>
                        {canViewInternalTabs && (
                            <>
                                <TabsTrigger
                                    value="members"
                                    className="h-full px-4 rounded-md font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Members
                                </TabsTrigger>
                                <TabsTrigger
                                    value="insights"
                                    className="h-full px-4 rounded-md font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Insights
                                </TabsTrigger>
                                <TabsTrigger
                                    value="sources"
                                    className="h-full px-4 rounded-md font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                                >
                                    <Database className="w-4 h-4 mr-2" />
                                    Sources
                                </TabsTrigger>
                            </>
                        )}
                        {canViewSettings && (
                            <TabsTrigger
                                value="settings"
                                className="h-full px-4 rounded-md font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                            >
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </TabsTrigger>
                        )}
                    </TabsList>
                </div>

                {/* Only mount the active tab’s content so Files tree is not rendered when on Shares/others (performance). */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    {currentTab === 'files' && (
                        <div className="py-1 h-full">
                            <ErrorBoundary context="ProjectFileList">
                                <ProjectFileList
                                    projectId={projectId}
                                    connectorRootFolderId={connectorRootFolderId}
                                    rootFolderName={projectName}
                                    orgName={orgName}
                                    clientName={clientName}
                                    projectName={projectName}
                                    canEdit={canEdit}
                                    canManage={canManage}
                                />
                            </ErrorBoundary>
                        </div>
                    )}
                    {currentTab === 'shares' && (
                        <div className="py-1 h-full">
                            <ErrorBoundary context="ProjectShares">
                                <ProjectSharesTab
                                    projectId={projectId}
                                    canManage={canManage}
                                    connectorRootFolderId={connectorRootFolderId ?? undefined}
                                    orgName={orgName}
                                    clientName={clientName}
                                    projectName={projectName}
                                    onOpenInFiles={handleOpenInFiles}
                                    sharesBasePath={`${projectBase(orgSlug, clientSlug, projectId)}/shares`}
                                    pathViewMode={pathSegments?.viewMode}
                                />
                            </ErrorBoundary>
                        </div>
                    )}
                    {canViewInternalTabs && currentTab === 'members' && (
                        <div className="py-1 h-full">
                            <ErrorBoundary context="ProjectMembers">
                                <ProjectMembersTab projectId={projectId} orgSlug={orgSlug} canManage={canManage} />
                            </ErrorBoundary>
                        </div>
                    )}
                    {canViewInternalTabs && currentTab === 'insights' && (
                        <div className="py-1">
                            <ErrorBoundary context="ProjectInsights">
                                <ProjectInsightsDashboard projectId={projectId} />
                            </ErrorBoundary>
                        </div>
                    )}
                    {canViewInternalTabs && currentTab === 'sources' && (
                        <div className="py-1">
                            <div className="bg-slate-50 h-64 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                                Data Sources & Connectors (Coming Soon)
                            </div>
                        </div>
                    )}
                    {canViewSettings && currentTab === 'settings' && (
                        <div className="w-full py-2">
                            <ProjectSettingsForm
                                projectId={projectId}
                                orgSlug={orgSlug}
                                clientSlug={clientSlug}
                                initialName={projectName ?? ''}
                                initialDescription={projectDescription}
                                isClosed={isClosed ?? false}
                                onSaved={() => router.refresh()}
                            />
                        </div>
                    )}
                </div>
            </Tabs>
        </div >
    )
}
