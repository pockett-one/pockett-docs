'use client'

import React from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectInsightsDashboard } from './project-insights-dashboard'
import { ProjectFileList } from './project-file-list'
import { ProjectSettingsForm } from './project-settings-form'
import { Folder, BarChart3, Radio, Database, Building2, ChevronRight, Users, Briefcase, Share2, Settings, Home } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { ProjectMembersTab } from './members/project-members-tab'
import { ErrorBoundary } from '@/components/error-boundary'

// We will import the actual Insights Dashboard and Connectors components here later.
// For now, placeholder components to establish structure.

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
}

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
    isClosed = false 
}: ProjectWorkspaceProps) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    const tabParam = searchParams.get('tab') || 'files'
    const internalTabs = ['members', 'shares', 'insights', 'sources']
    const requestedInternal = internalTabs.includes(tabParam)
    const fallbackToFiles =
      (tabParam === 'settings' && !canViewSettings) ||
      (requestedInternal && !canViewInternalTabs)
    const currentTab = fallbackToFiles ? 'files' : (tabParam || 'files')

    // Handle tab change by updating URL
    const handleTabChange = (value: string) => {
        // Create new params
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', value)

        // Push update
        router.push(`${pathname}?${params.toString()}`, { scroll: false })
    }

    return (
        <div className="flex flex-col h-full">
            {/* Breadcrumbs */}
            <div className="d-body flex items-center text-stone-500 mb-2">
                <Link 
                    href="/d"
                    className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Home - All Organizations"
                >
                    <Home className="h-4 w-4" />
                </Link>
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
                                    value="shares"
                                    className="h-full px-4 rounded-md font-medium text-slate-500 data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                                >
                                    <Share2 className="w-4 h-4 mr-2" />
                                    Shares
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

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <TabsContent value="files" className="m-0 h-full">
                        <div className="py-1">
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
                    </TabsContent>

                    {canViewInternalTabs && (
                        <>
                            <TabsContent value="members" className="m-0 h-full">
                                <div className="py-1 h-full">
                                    <ErrorBoundary context="ProjectMembers">
                                        <ProjectMembersTab projectId={projectId} orgSlug={orgSlug} canManage={canManage} />
                                    </ErrorBoundary>
                                </div>
                            </TabsContent>
                            <TabsContent value="shares" className="m-0 h-full">
                                <div className="py-1 h-full">
                                    <div className="bg-slate-50 h-64 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                                        Shares (Coming Soon)
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="insights" className="m-0 h-full">
                                <div className="py-1">
                                    <ErrorBoundary context="ProjectInsights">
                                        <ProjectInsightsDashboard projectId={projectId} />
                                    </ErrorBoundary>
                                </div>
                            </TabsContent>
                            <TabsContent value="sources" className="m-0 h-full">
                                <div className="py-1">
                                    <div className="bg-slate-50 h-64 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                                        Data Sources & Connectors (Coming Soon)
                                    </div>
                                </div>
                            </TabsContent>
                        </>
                    )}

                    {canViewSettings && (
                        <TabsContent value="settings" className="m-0 h-full">
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
                        </TabsContent>
                    )}
                </div>
            </Tabs>
        </div >
    )
}
