'use client'

import React from 'react'
import { Folder, MoreVertical, FileText, Calendar, Clock } from 'lucide-react'
import { HierarchyClient } from '@/lib/actions/hierarchy'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ProjectListProps {
    projects: HierarchyClient['projects']
    orgSlug: string
    clientSlug: string
}

export function ProjectList({ projects, orgSlug, clientSlug }: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Folder className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No projects found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                    This client workspace doesn't have any active projects yet.
                </p>
                {/* TODO: Add 'Create Project' button here if user has permission */}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {projects.map((project) => (
                <Link
                    key={project.id}
                    href={`/o/${orgSlug}/c/${clientSlug}/p/${project.slug}`}
                    className="group relative bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-indigo-200 transition-all duration-200 flex flex-col h-48"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Folder className="h-5 w-5" />
                        </div>
                        {/* <button className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100">
                            <MoreVertical className="h-4 w-4" />
                        </button> */}
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {project.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-auto">
                        {project.description || "No description provided."}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5" title="Last updated">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                        </div>
                        {/* <div className="flex -space-x-1.5">
                             Avatar stack placeholder 
                            <div className="h-5 w-5 rounded-full bg-slate-200 border border-white ring-1 ring-white" />
                            <div className="h-5 w-5 rounded-full bg-slate-300 border border-white ring-1 ring-white" />
                        </div> */}
                    </div>
                </Link>
            ))}
        </div>
    )
}
