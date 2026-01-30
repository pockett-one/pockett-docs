'use client'

import React, { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProjectInsightsDashboard } from './project-insights-dashboard'
import { ProjectFileList } from './project-file-list'
import { Folder, BarChart3, Radio, Database, Building2, ChevronRight, Users, Briefcase, Share2 } from 'lucide-react'
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
    driveFolderId?: string | null
    orgName?: string
    clientName?: string
    projectName?: string
}

export function ProjectWorkspace({ orgSlug, clientSlug, projectId, driveFolderId, orgName, clientName, projectName }: ProjectWorkspaceProps) {
    const searchParams = useSearchParams()
    const pathname = usePathname()
    const router = useRouter()

    // Get active tab from URL or default to 'files'
    const currentTab = searchParams.get('tab') || 'files'

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
            <div className="flex items-center text-sm text-slate-500 mb-2">
                <div className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-default">
                    <Building2 className="h-4 w-4" />
                    <span className="font-medium">{orgName || 'Organization'}</span>
                </div>
                {clientName && (
                    <>
                        <ChevronRight className="h-4 w-4 mx-1 text-slate-300" />
                        <Link href={`/o/${orgSlug}/c/${clientSlug}`} className="flex items-center gap-2 hover:text-slate-900 transition-colors cursor-pointer">
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

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{projectName || 'Project Workspace'}</h1>
                <p className="text-slate-500">Manage insights, data sources, and files for this engagement.</p>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
                <div className="border-b border-slate-200 mb-6">
                    <TabsList className="bg-transparent h-12 w-full justify-start gap-2 p-0">
                        <TabsTrigger
                            value="files"
                            className="h-full px-4 border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent rounded-none transition-all font-medium text-slate-500"
                        >
                            <Folder className="w-4 h-4 mr-2" />
                            Files
                        </TabsTrigger>
                        <TabsTrigger
                            value="members"
                            className="h-full px-4 border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent rounded-none transition-all font-medium text-slate-500"
                        >
                            <Users className="w-4 h-4 mr-2" />
                            Members
                        </TabsTrigger>
                        <TabsTrigger
                            value="insights"
                            className="h-full px-4 border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent rounded-none transition-all font-medium text-slate-500"
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Insights
                        </TabsTrigger>
                        <TabsTrigger
                            value="sources"
                            className="h-full px-4 border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:text-slate-900 data-[state=active]:bg-transparent rounded-none transition-all font-medium text-slate-500"
                        >
                            <Database className="w-4 h-4 mr-2" />
                            Data Sources
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <TabsContent value="files" className="m-0 h-full">
                        <div className="p-1">
                            <ErrorBoundary context="ProjectFileList">
                                <ProjectFileList projectId={projectId} driveFolderId={driveFolderId} rootFolderName={projectName} />
                            </ErrorBoundary>
                        </div>
                    </TabsContent>

                    <TabsContent value="members" className="m-0 h-full">
                        <div className="p-1 h-full">
                            <ErrorBoundary context="ProjectMembers">
                                <ProjectMembersTab projectId={projectId} orgSlug={orgSlug} />
                            </ErrorBoundary>
                        </div>
                    </TabsContent>

                    <TabsContent value="insights" className="m-0 h-full">
                        <div className="p-1">
                            <ErrorBoundary context="ProjectInsights">
                                <ProjectInsightsDashboard projectId={projectId} />
                            </ErrorBoundary>
                        </div>
                    </TabsContent>

                    <TabsContent value="sources" className="m-0 h-full">
                        <div className="p-1">
                            {/* <ConnectorsList projectId={projectId} /> */}
                            <div className="bg-slate-50 h-64 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                                Data Sources & Connectors (Coming Soon)
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
