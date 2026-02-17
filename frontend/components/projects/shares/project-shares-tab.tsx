'use client'

import React, { useState, useEffect } from 'react'
import { Share2, ChevronDown, ChevronRight, User, Clock } from 'lucide-react'
import { DocumentIcon } from '@/components/ui/document-icon'
import { SharedFolderIcon } from '@/components/ui/folder-shared-icon'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { formatDistanceToNow } from 'date-fns'

interface ShareRecord {
  id: string
  projectId: string
  documentId: string
  documentName: string
  documentExternalId: string
  documentMimeType: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  settings: {
    externalCollaborator: boolean
    guest: boolean
    guestOptions: {
      sharePdfOnly?: boolean
      allowDownload?: boolean
      addWatermark?: boolean
      publish?: boolean
    }
    publishedVersionId: string | null
    publishedAt: string | null
  }
  accessLog: Array<{
    at: string
    by: string
    userId: string | null
    email: string | null
    sessionId: string | null
  }>
}

interface ProjectSharesTabProps {
  projectId: string
}

export function ProjectSharesTab({ projectId }: ProjectSharesTabProps) {
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedShares, setExpandedShares] = useState<Set<string>>(new Set())

  const refreshData = async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setIsLoading(false)
        return
      }

      const response = await fetch(`/api/projects/${projectId}/shares`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch shares')
      }

      const data = await response.json()
      setShares(data.shares || [])
    } catch (error) {
      logger.error("Failed to fetch shares data", error instanceof Error ? error : new Error(String(error)), 'ProjectShares', { projectId })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [projectId])

  const toggleExpand = (shareId: string) => {
    setExpandedShares((prev) => {
      const next = new Set(prev)
      if (next.has(shareId)) {
        next.delete(shareId)
      } else {
        next.add(shareId)
      }
      return next
    })
  }

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const getPersonaDisplayName = (by: string) => {
    if (by === 'external_collaborator') return 'External Collaborator'
    if (by === 'guest') return 'Guest'
    return by
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-50">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Shared Documents
            {!isLoading && shares.length > 0 && (
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {shares.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500">View share settings and access logs for shared documents.</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
          </div>
        ) : shares.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <Share2 className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No shared documents yet</p>
            <p className="text-xs mt-1">Share documents from the Files tab to see them here</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {shares.map((share) => {
              const isExpanded = expandedShares.has(share.id)
              const hasAccessLog = share.accessLog.length > 0

              return (
                <div key={share.id} className="hover:bg-slate-50 transition-colors">
                  {/* Main row */}
                  <div
                    className="px-6 py-4 cursor-pointer"
                    onClick={() => toggleExpand(share.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          className="text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(share.id)
                          }}
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        {share.documentMimeType?.includes('folder') ? (
                          <SharedFolderIcon fillLevel={1} tooltip="shared" />
                        ) : (
                          <DocumentIcon mimeType={share.documentMimeType ?? undefined} className="h-4 w-4 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">
                            {share.documentName}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                            <span>Shared {formatDate(share.createdAt)}</span>
                            {hasAccessLog && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {share.accessLog.length} access{share.accessLog.length !== 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {share.settings.externalCollaborator && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                            External Collaborator
                          </span>
                        )}
                        {share.settings.guest && (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                            Guest
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-6 pb-4 bg-slate-50 border-t border-slate-200">
                      <div className="pt-4 space-y-4">
                        {/* Share Settings */}
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900 mb-2">Share Settings</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${share.settings.externalCollaborator ? 'bg-blue-500' : 'bg-slate-300'}`}></span>
                              <span className="text-slate-700">
                                External Collaborator: {share.settings.externalCollaborator ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${share.settings.guest ? 'bg-purple-500' : 'bg-slate-300'}`}></span>
                              <span className="text-slate-700">
                                Guest: {share.settings.guest ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                            {share.settings.guest && share.settings.guestOptions && (
                              <div className="ml-4 space-y-1 text-xs text-slate-600">
                                {share.settings.guestOptions.sharePdfOnly && (
                                  <div>• PDF version only</div>
                                )}
                                {share.settings.guestOptions.allowDownload && (
                                  <div>• Download allowed</div>
                                )}
                                {share.settings.guestOptions.addWatermark && (
                                  <div>• Watermark enabled</div>
                                )}
                                {share.settings.guestOptions.publish && (
                                  <div>• Published (major version)</div>
                                )}
                              </div>
                            )}
                            {share.settings.publishedAt && (
                              <div className="text-xs text-slate-500 mt-2">
                                Published: {formatDate(share.settings.publishedAt)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Access Log */}
                        {hasAccessLog ? (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Access Log</h3>
                            <div className="space-y-2">
                              {share.accessLog.map((entry, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-3 px-3 py-2 bg-white rounded border border-slate-200 text-sm"
                                >
                                  <User className="h-4 w-4 text-slate-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-slate-900">
                                      {entry.email || entry.userId || 'Unknown user'}
                                    </div>
                                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                      <span>{getPersonaDisplayName(entry.by)}</span>
                                      <span>•</span>
                                      <span>{formatDate(entry.at)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-2">Access Log</h3>
                            <p className="text-sm text-slate-500">No access recorded yet</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
