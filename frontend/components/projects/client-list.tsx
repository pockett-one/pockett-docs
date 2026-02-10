'use client'

import React from 'react'
import { Users, Clock } from 'lucide-react'
import { HierarchyClient } from '@/lib/actions/hierarchy'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface ClientListProps {
    clients: HierarchyClient[]
    orgSlug: string
    viewMode?: 'grid' | 'list'
}

export function ClientList({ clients, orgSlug, viewMode = 'grid' }: ClientListProps) {
    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                    <Users className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">No clients found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">
                    This organization doesn't have any client workspaces yet.
                </p>
            </div>
        )
    }

    if (viewMode === 'list') {
        return (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-medium text-slate-500">Client</th>
                            <th className="px-4 py-3 font-medium text-slate-500">Projects</th>
                            <th className="px-4 py-3 font-medium text-slate-500 text-right">Last Updated</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {clients.map((client) => (
                            <tr key={client.id} className="group hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-3">
                                    <Link href={`/o/${orgSlug}/c/${client.slug}`} className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <span className="font-medium text-slate-900 group-hover:text-black transition-colors">{client.name}</span>
                                    </Link>
                                </td>
                                <td className="px-4 py-3 text-slate-500">
                                    <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium">
                                        {client.projects.length} {client.projects.length === 1 ? 'Project' : 'Projects'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right text-slate-400">
                                    <div className="flex items-center justify-end gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })}</span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {clients.map((client) => (
                <Link
                    key={client.id}
                    href={`/o/${orgSlug}/c/${client.slug}`}
                    className="group relative bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col h-48"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="h-10 w-10 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-900 mb-1 line-clamp-1 group-hover:text-black transition-colors">
                        {client.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-auto">
                        {client.projects.length} {client.projects.length === 1 ? 'Project' : 'Projects'}
                    </p>

                    <div className="mt-auto pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5" title="Last updated">
                            <Clock className="h-3 w-3" />
                            <span>{formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })}</span>
                        </div>
                    </div>
                </Link>
            ))}
        </div>
    )
}
