'use client'

import React from 'react'
import { Briefcase, Clock } from 'lucide-react'
import { HierarchyClient } from '@/lib/actions/hierarchy'
import { type ProjectMemberSummary } from '@/lib/actions/members'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { TooltipProvider } from '@/components/ui/tooltip'
import {
    ProfileBubbleWithPopup,
    ProfileBubble,
    type ProfileBubblePopupUser,
} from '@/components/ui/profile-bubble-popup'

interface ProjectListProps {
    projects: HierarchyClient['projects']
    orgSlug: string
    clientSlug: string
    viewMode?: 'grid' | 'list'
    isOrgInternal?: boolean
    memberSummaries?: Record<string, ProjectMemberSummary>
}

function MemberBubbleStack({
    users,
    onClickLink,
    size = 'default',
}: {
    users: ProfileBubblePopupUser[]
    onClickLink: (e: React.MouseEvent) => void
    size?: 'default' | 'lg'
}) {
    const sizeClass = size === 'lg' ? 'w-10 h-10 text-xs' : 'w-6 h-6 text-[10px]'
    if (users.length === 0) return null
    return (
        <div className="flex -space-x-1.5" onClick={onClickLink}>
            {users.slice(0, 4).map((u, i) => (
                <div key={i} onClick={(e) => e.preventDefault()}>
                    <ProfileBubbleWithPopup
                        name={u.name}
                        email={u.email}
                        avatarUrl={u.avatarUrl}
                        personaName={u.personaName}
                        size={size}
                    />
                </div>
            ))}
            {users.length > 4 && (
                <div className={`rounded-lg border border-slate-200 bg-white ${sizeClass} flex items-center justify-center font-medium text-slate-600 shrink-0 p-0.5`}>
                    +{users.length - 4}
                </div>
            )}
        </div>
    )
}

export function ProjectList({ projects, orgSlug, clientSlug, viewMode = 'grid', isOrgInternal, memberSummaries = {} }: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Briefcase className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No projects found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                    This client workspace doesn't have any active projects yet.
                </p>
                {/* TODO: Add 'Create Project' button here if user has permission */}
            </div>
        )
    }

    const showBubbles = isOrgInternal && Object.keys(memberSummaries).length > 0

    if (viewMode === 'list') {
        return (
            <TooltipProvider>
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-4 py-3 font-medium text-slate-500">Project</th>
                                <th className="px-4 py-3 font-medium text-slate-500">Description</th>
                                <th className="px-4 py-3 font-medium text-slate-500">Collaborators</th>
                                <th className="px-4 py-3 font-medium text-slate-500 text-right">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {projects.map((project) => {
                                const summary = showBubbles ? memberSummaries[project.id] : null
                                const hasLeads = summary && summary.projectLeads.length > 0
                                const hasTeam = summary && summary.teamMembers.length > 0
                                const hasExternal = summary && summary.external.length > 0
                                const hasAny = hasLeads || hasTeam || hasExternal
                                return (
                                    <tr key={project.id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <Link href={`/o/${orgSlug}/c/${clientSlug}/p/${project.slug}`} className="flex items-center gap-3">
                                                <div className="h-8 w-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
                                                    <Briefcase className="h-4 w-4" />
                                                </div>
                                                <span className="font-medium text-slate-900 group-hover:text-black transition-colors">{project.name}</span>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                                            {project.description || "-"}
                                        </td>
                                        <td className="px-4 py-3">
                                            {showBubbles ? (
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-slate-500">
                                                    {hasLeads && (
                                                        <div className="flex items-center gap-1.5">
                                                            <MemberBubbleStack
                                                                users={summary!.projectLeads}
                                                                onClickLink={(e) => e.preventDefault()}
                                                                size="default"
                                                            />
                                                        </div>
                                                    )}
                                                    {hasLeads && (hasTeam || hasExternal) && (
                                                        <span className="text-slate-300 font-light" aria-hidden>|</span>
                                                    )}
                                                    {hasTeam && (
                                                        <div className="flex items-center gap-1.5">
                                                            <MemberBubbleStack
                                                                users={summary!.teamMembers}
                                                                onClickLink={(e) => e.preventDefault()}
                                                                size="default"
                                                            />
                                                        </div>
                                                    )}
                                                    {hasTeam && hasExternal && (
                                                        <span className="text-slate-300 font-light" aria-hidden>|</span>
                                                    )}
                                                    {hasExternal && (
                                                        <div className="flex items-center gap-1.5">
                                                            <MemberBubbleStack
                                                                users={summary!.external}
                                                                onClickLink={(e) => e.preventDefault()}
                                                                size="default"
                                                            />
                                                        </div>
                                                    )}
                                                    {!hasAny && <span className="text-slate-400">—</span>}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-slate-400">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Clock className="h-3 w-3" />
                                                <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </TooltipProvider>
        )
    }

    return (
        <TooltipProvider>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {projects.map((project) => {
                    const summary = showBubbles ? memberSummaries[project.id] : null
                    const hasLeads = summary && summary.projectLeads.length > 0
                    const hasTeam = summary && summary.teamMembers.length > 0
                    const hasExternal = summary && summary.external.length > 0
                    return (
                        <Link
                            key={project.id}
                            href={`/o/${orgSlug}/c/${clientSlug}/p/${project.slug}`}
                            className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-48"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                                    <Briefcase className="h-5 w-5" />
                                </div>
                                {showBubbles && hasLeads && (
                                    <MemberBubbleStack
                                        users={summary!.projectLeads}
                                        onClickLink={(e) => e.preventDefault()}
                                        size="lg"
                                    />
                                )}
                            </div>

                            <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-black transition-colors">
                                {project.name}
                            </h3>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-auto">
                                {project.description || "No description provided."}
                            </p>

                            {showBubbles && (hasTeam || hasExternal) && (
                                <div className="flex items-center justify-between gap-2 mb-2 min-h-[24px]">
                                    {hasExternal ? (
                                        <MemberBubbleStack
                                            users={summary!.external}
                                            onClickLink={(e) => e.preventDefault()}
                                        />
                                    ) : (
                                        <span />
                                    )}
                                    {hasTeam ? (
                                        <MemberBubbleStack
                                            users={summary!.teamMembers}
                                            onClickLink={(e) => e.preventDefault()}
                                        />
                                    ) : (
                                        <span />
                                    )}
                                </div>
                            )}
                            <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                                <div className="flex items-center gap-1.5" title="Last updated">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </Link>
                    )
                })}
            </div>
        </TooltipProvider>
    )
}
