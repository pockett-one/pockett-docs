'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { HierarchyClient } from '@/lib/actions/hierarchy'
import { Users, Building, Calendar, Clock, Tag } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ClientDetailsModalProps {
    client: HierarchyClient | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ClientDetailsModal({ client, open, onOpenChange }: ClientDetailsModalProps) {
    if (!client) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2.5 text-xl">
                        <Users className="h-6 w-6 text-slate-600" />
                        {client.name}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {/* Status */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Tag className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Status</div>
                            <div className="flex items-center gap-2">
                                <span className="px-2.5 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                    {client.status || 'ACTIVE'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Industry */}
                    {client.industry && (
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Industry</div>
                                <div className="text-sm font-medium text-slate-900">{client.industry}</div>
                            </div>
                        </div>
                    )}

                    {/* Sector */}
                    {client.sector && (
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building className="h-4 w-4 text-slate-600" />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Sector</div>
                                <div className="text-sm font-medium text-slate-900">{client.sector}</div>
                            </div>
                        </div>
                    )}

                    {/* Projects Count */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Users className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Projects</div>
                            <div className="text-sm font-medium text-slate-900">{client.projects.length} Active Projects</div>
                        </div>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Created</div>
                            <div className="text-sm font-medium text-slate-900">
                                {new Date(client.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Last Updated */}
                    <div className="flex items-start gap-3">
                        <div className="h-9 w-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Clock className="h-4 w-4 text-slate-600" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Last Updated</div>
                            <div className="text-sm font-medium text-slate-900">
                                {formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })}
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
