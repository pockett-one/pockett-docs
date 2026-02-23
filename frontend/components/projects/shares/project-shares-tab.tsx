'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { Share2, User, Lock, ListTodo, Loader2, CheckCircle, GripVertical, List, FolderOpen, LayoutGrid, Clock, Copy, Check } from 'lucide-react'
import { DocumentIcon } from '@/components/ui/document-icon'
import { SharedFolderIcon } from '@/components/ui/folder-shared-icon'
import { DocumentActionMenu } from '@/components/ui/document-action-menu'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ShareDetailPanel } from './share-detail-panel'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { formatRelativeTime } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

type ActivityStatus = 'to_do' | 'in_progress' | 'done'

interface ShareRecord {
  id: string
  projectId: string
  documentId: string
  documentName: string
  documentExternalId: string
  documentMimeType: string | null
  slug?: string | null
  createdBy: string
  createdByEmail?: string | null
  createdByAvatarUrl?: string | null
  createdAt: string
  updatedAt: string
  updatedBy?: string | null
  updatedByEmail?: string | null
  updatedByAvatarUrl?: string | null
  settings: {
    externalCollaborator: boolean
    guest: boolean
    guestOptions: { sharePdfOnly?: boolean; allowDownload?: boolean; addWatermark?: boolean; publish?: boolean }
    publishedVersionId: string | null
    publishedAt: string | null
  }
  activity?: { status: ActivityStatus; updatedAt: string; orderIndex?: number }
  comments?: Array<{ createdAt: string; commentor: string; comment: string }>
  finalizedAt?: string | null
  accessLog: Array<{
    at: string
    by: string
    userId: string | null
    email: string | null
    sessionId: string | null
  }>
  /** Used internally when grouping into lanes for stable sort order. */
  _orderIndex?: number
}

export type FilesBreadcrumbItem = { id: string; name: string; clickable?: boolean }

interface ProjectSharesTabProps {
  projectId: string
  canManage?: boolean
  connectorRootFolderId?: string
  orgName?: string
  clientName?: string
  projectName?: string
  onOpenInFiles?: (folderId: string, breadcrumbs: FilesBreadcrumbItem[]) => void
  /** When set, view mode and share detail are driven by URL; changes navigate */
  sharesBasePath?: string
  pathViewMode?: 'list' | 'board'
  pathShareSlug?: string
  pathAction?: 'view' | 'edit'
}

const LANES: {
  status: ActivityStatus
  label: string
  icon: React.ReactNode
  /** Gradient for icon pill in header */
  iconGradient: string
}[] = [
  {
    status: 'to_do',
    label: 'To Do',
    icon: <ListTodo className="h-4 w-4 text-white" />,
    iconGradient: 'from-[#ddd6fe] to-[#c4b5fd]',
  },
  {
    status: 'in_progress',
    label: 'In Progress',
    icon: <Loader2 className="h-4 w-4 text-white" />,
    iconGradient: 'from-[#5eead4] to-[#2dd4bf]',
  },
  {
    status: 'done',
    label: 'Done',
    icon: <CheckCircle className="h-4 w-4 text-white" />,
    iconGradient: 'from-[#7dd3fc] to-[#38bdf8]',
  },
]

function getInitials(uuid: string): string {
  if (!uuid || uuid.length < 2) return '?'
  return uuid.slice(0, 2).toUpperCase()
}

function DroppableLane({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={cn(className, isOver && 'ring-1 ring-slate-300/80 ring-inset rounded-2xl')}>
      {children}
    </div>
  )
}

/** Card accent: header gradient (top-left → bottom-right, soft pastel to white) + subtle left edge. Matches workflow-card reference. */
const CARD_ACCENT: Record<ActivityStatus, { border: string; headerBg: string; iconPillBg: string }> = {
  to_do: {
    border: 'border-l-2 border-l-[#eae8ff]',
    headerBg: 'bg-gradient-to-br from-[#f5f3ff] to-white',
    iconPillBg: 'bg-[#ede9fe]/90',
  },
  in_progress: {
    border: 'border-l-2 border-l-[#ccfbf1]',
    headerBg: 'bg-gradient-to-br from-[#ecfdf8] to-white',
    iconPillBg: 'bg-[#ccfbf1]/90',
  },
  done: {
    border: 'border-l-2 border-l-[#e0f2fe]',
    headerBg: 'bg-gradient-to-br from-[#eff6ff] to-white',
    iconPillBg: 'bg-[#e0f2fe]/90',
  },
}

function DraggableCard({
  id,
  share,
  laneStatus,
  formatDate,
  getDocumentForMenu,
  showActions,
  onFinalize,
  finalizingId,
  canManage,
  isDoneLane,
  onShareSaved,
  onNavigateToView,
  onNavigateToEdit,
}: {
  id: string
  share: ShareRecord
  laneStatus: ActivityStatus
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  showActions: boolean
  onFinalize?: () => void
  finalizingId: string | null
  canManage: boolean
  isDoneLane: boolean
  onShareSaved?: () => void
  onNavigateToView?: (documentId: string) => void
  onNavigateToEdit?: (documentId: string) => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id })
  const accent = CARD_ACCENT[laneStatus]

  return (
    <motion.div
      ref={(node) => { setNodeRef(node); setDropRef(node) }}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'rounded-2xl overflow-hidden select-none border border-slate-200/80',
        accent.border,
        'bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]',
        isDragging && 'opacity-60 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.12)] z-10 scale-[1.02]',
        isOver && !isDragging && 'ring-1 ring-slate-300/70 ring-inset'
      )}
    >
      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-50/70 border-b border-slate-100/80" {...listeners} {...attributes}>
        <GripVertical className="h-4 w-4 text-slate-400 cursor-grab active:cursor-grabbing" />
      </div>
      <ShareCardContent
        share={share}
        laneHeaderBg={accent.headerBg}
        iconPillBg={accent.iconPillBg}
        formatDate={formatDate}
        getDocumentForMenu={getDocumentForMenu}
        showActions={showActions}
        onFinalize={onFinalize}
        finalizingId={finalizingId}
        canManage={canManage}
        isDoneLane={isDoneLane}
        onShareSaved={onShareSaved}
        onNavigateToView={onNavigateToView}
        onNavigateToEdit={onNavigateToEdit}
      />
    </motion.div>
  )
}

function ShareCardContent({
  share,
  laneHeaderBg,
  iconPillBg,
  formatDate,
  getDocumentForMenu,
  showActions,
  onFinalize,
  finalizingId,
  canManage,
  isDoneLane,
  onShareSaved,
  onNavigateToView,
  onNavigateToEdit,
}: {
  share: ShareRecord
  laneHeaderBg: string
  iconPillBg: string
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  showActions: boolean
  onFinalize?: () => void
  finalizingId: string | null
  canManage: boolean
  isDoneLane: boolean
  onShareSaved?: () => void
  onNavigateToView?: (documentId: string) => void
  onNavigateToEdit?: (documentId: string) => void
}) {
  const latestComment = share.comments?.[0]
  const isFinalized = !!share.finalizedAt

  return (
    <>
      <div className={cn('transition-colors duration-200', laneHeaderBg)}>
        <div className="flex items-start gap-3 px-3 pt-3 pb-2">
          <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06)]', iconPillBg)}>
            {share.documentMimeType?.includes('folder') ? (
              <SharedFolderIcon fillLevel={1} tooltip="shared" />
            ) : (
              <DocumentIcon mimeType={share.documentMimeType ?? undefined} className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-800 truncate" title={share.documentName}>
              {share.documentName}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {latestComment ? latestComment.comment : 'Shared document'}
            </p>
          </div>
        </div>
      </div>
      <div className="px-3 pb-3 pt-1 bg-white">
        <div className="flex items-center gap-2">
          <Avatar className="h-5 w-5 rounded-full border border-slate-200/80">
            <AvatarFallback className="text-[10px] bg-slate-100 text-slate-600">
              {getInitials(share.createdBy)}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-slate-500 truncate" title={share.createdBy}>
            Project member
          </span>
          <span className="text-[11px] text-slate-400">·</span>
          <span className="text-[11px] text-slate-400">{formatRelativeTime(share.updatedAt)}</span>
        </div>
      </div>
      {showActions && (
        <div className="px-3 pb-3 pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100/80 bg-white" onClick={(e) => e.stopPropagation()}>
          {canManage && isDoneLane && !isFinalized && (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-7 text-amber-700 border-amber-200 hover:bg-amber-50"
              disabled={!!finalizingId}
              onClick={(e) => { e.stopPropagation(); onFinalize?.() }}
            >
              {finalizingId ? '…' : <><Lock className="h-3 w-3 mr-1" /> Finalize</>}
            </Button>
          )}
          {isFinalized && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Lock className="h-3 w-3" /> Finalized
            </span>
          )}
          <div className="ml-auto">
            <DocumentActionMenu
              document={getDocumentForMenu(share)}
              showShareModal={canManage}
              projectId={share.projectId}
              onShareSaved={onShareSaved}
              onNavigateToView={onNavigateToView}
              onNavigateToEdit={onNavigateToEdit}
            />
          </div>
        </div>
      )}
    </>
  )
}

const STATUS_LABELS: Record<ActivityStatus, string> = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
}

const STATUS_PILL_CLASS: Record<ActivityStatus, string> = {
  to_do: 'bg-[#ede9fe]/90 text-[#5b21b6]',
  in_progress: 'bg-[#ccfbf1]/90 text-[#0f766e]',
  done: 'bg-[#e0f2fe]/90 text-[#0369a1]',
}

function PersonBubble({
  email,
  avatarUrl,
  userId,
  formatDate,
  sharedAt,
  modifiedAt,
}: {
  email: string | null
  avatarUrl: string | null
  userId: string
  formatDate: (s: string) => string
  sharedAt: string
  modifiedAt?: string | null
}) {
  const [copied, setCopied] = useState(false)
  const initials = email ? email.slice(0, 2).toUpperCase() : getInitials(userId)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (email) {
      navigator.clipboard.writeText(email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasModified = modifiedAt && new Date(modifiedAt).getTime() > new Date(sharedAt).getTime()

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-8 w-8 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 cursor-default">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-medium text-slate-600">{initials}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-50 border border-slate-200 text-slate-700 text-xs p-3 max-w-[280px] shadow-md">
          <div className="space-y-2">
            {email && (
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[200px]">{email}</span>
                <button type="button" onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700" title="Copy email">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Shared at {formatDate(sharedAt)}</span>
            </div>
            {hasModified && modifiedAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>Modified at {formatDate(modifiedAt)}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ModifierBubble({
  updatedBy,
  updatedByEmail,
  updatedByAvatarUrl,
  updatedAt,
  formatDate,
}: {
  updatedBy: string
  updatedByEmail: string | null | undefined
  updatedByAvatarUrl: string | null | undefined
  updatedAt: string
  formatDate: (s: string) => string
}) {
  const [copied, setCopied] = useState(false)
  const displayEmail = updatedByEmail ?? null
  const initials = displayEmail ? displayEmail.slice(0, 2).toUpperCase() : getInitials(updatedBy)

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (displayEmail) {
      navigator.clipboard.writeText(displayEmail)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-8 w-8 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 cursor-default">
            {updatedByAvatarUrl ? (
              <img src={updatedByAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-[10px] font-medium text-slate-600">{initials}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-50 border border-slate-200 text-slate-700 text-xs p-3 max-w-[280px] shadow-md">
          <div className="space-y-2">
            {displayEmail && (
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[200px]">{displayEmail}</span>
                <button type="button" onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700" title="Copy email">
                  {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span>Modified at {formatDate(updatedAt)}</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function ModifiedAtOnlyBubble({ updatedAt, formatDate }: { updatedAt: string; formatDate: (s: string) => string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="h-8 w-8 rounded-lg border border-slate-200/80 bg-slate-50 flex items-center justify-center shrink-0 cursor-default">
            <Clock className="h-4 w-4 text-slate-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-slate-50 border border-slate-200 text-slate-700 text-xs p-3 shadow-md">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Modified at {formatDate(updatedAt)}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

function SharesListView({
  shares,
  formatDate,
  getDocumentForMenu,
  canManage,
  onShareSaved,
  onOpenInFilesForFolder,
  onNavigateToView,
  onNavigateToEdit,
}: {
  shares: ShareRecord[]
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  canManage: boolean
  onShareSaved: () => void
  onOpenInFilesForFolder?: (share: ShareRecord) => void
  onNavigateToView?: (documentId: string) => void
  onNavigateToEdit?: (documentId: string) => void
}) {
  const [actionMenuOpenShareId, setActionMenuOpenShareId] = useState<string | null>(null)
  return (
    <div className="grid grid-cols-2 gap-4">
      {shares.map((share) => {
        const ec = share.settings?.externalCollaborator ?? false
        const guest = share.settings?.guest ?? false
        return (
          <div
            key={share.id}
            className={cn(
              'bg-white rounded-xl border border-slate-200 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] overflow-hidden transition-colors',
              actionMenuOpenShareId === share.id && 'bg-slate-50'
            )}
          >
            <div className="p-5 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    {share.documentMimeType?.includes('folder') ? (
                      <SharedFolderIcon fillLevel={1} tooltip="shared" />
                    ) : (
                      <DocumentIcon mimeType={share.documentMimeType ?? undefined} className="h-4 w-4" />
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-900 truncate min-w-0" title={share.documentName}>
                    {share.documentName}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    {share.documentMimeType?.includes('folder') && onOpenInFilesForFolder && (
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                        onClick={() => onOpenInFilesForFolder(share)}
                        title="Open in Files"
                      >
                        <FolderOpen className="h-4 w-4" />
                      </button>
                    )}
                    <DocumentActionMenu
                      document={getDocumentForMenu(share)}
                      showShareModal={canManage}
                      projectId={share.projectId}
                      onShareSaved={onShareSaved}
                      onNavigateToView={onNavigateToView}
                      onNavigateToEdit={onNavigateToEdit}
                      onOpenChange={(open) => setActionMenuOpenShareId(open ? share.id : null)}
                    />
                  </div>
                </div>
                {(() => {
                  const isModified = new Date(share.updatedAt).getTime() > new Date(share.createdAt).getTime()
                  const samePerson = share.updatedBy && share.updatedBy === share.createdBy
                  const showCreatorProfile = !isModified || (isModified && !samePerson)
                  const showModifierProfile = isModified && share.updatedBy && !samePerson
                  const showModifiedAtOnly = isModified && !share.updatedBy
                  return (
                    <div className="flex flex-row flex-wrap items-center gap-1.5 mt-3">
                      {showCreatorProfile && (
                        <PersonBubble
                          email={share.createdByEmail ?? null}
                          avatarUrl={share.createdByAvatarUrl ?? null}
                          userId={share.createdBy}
                          formatDate={formatDate}
                          sharedAt={share.createdAt}
                          modifiedAt={samePerson ? undefined : (isModified ? share.updatedAt : undefined)}
                        />
                      )}
                      {!showCreatorProfile && samePerson && isModified && (
                        <PersonBubble
                          email={share.createdByEmail ?? null}
                          avatarUrl={share.createdByAvatarUrl ?? null}
                          userId={share.createdBy}
                          formatDate={formatDate}
                          sharedAt={share.createdAt}
                          modifiedAt={share.updatedAt}
                        />
                      )}
                      {showModifierProfile && share.updatedBy && (
                        <ModifierBubble
                          updatedBy={share.updatedBy}
                          updatedByEmail={share.updatedByEmail}
                          updatedByAvatarUrl={share.updatedByAvatarUrl}
                          updatedAt={share.updatedAt}
                          formatDate={formatDate}
                        />
                      )}
                      {showModifiedAtOnly && <ModifiedAtOnlyBubble updatedAt={share.updatedAt} formatDate={formatDate} />}
                      {ec && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-8 w-8 rounded-lg bg-violet-100 text-violet-800 flex items-center justify-center text-xs font-semibold shrink-0 cursor-default w-8">
                                EC
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-50 border border-slate-200 text-slate-700 text-xs p-2 shadow-md">
                              External Collaborator
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {guest && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="h-8 w-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center text-xs font-semibold shrink-0 cursor-default w-8">
                                G
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-slate-50 border border-slate-200 text-slate-700 text-xs p-2 shadow-md">
                              Guest
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

type SharesViewMode = 'list' | 'board'

export function ProjectSharesTab({
  projectId,
  canManage = false,
  connectorRootFolderId,
  orgName,
  clientName,
  projectName,
  onOpenInFiles,
  sharesBasePath,
  pathViewMode,
  pathShareSlug,
  pathAction,
}: ProjectSharesTabProps) {
  const router = useRouter()
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [detailShareId, setDetailShareId] = useState<string | null>(null)
  const [panelExpanded, setPanelExpanded] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const viewMode = (pathViewMode ?? 'list') as SharesViewMode

  // Only open the detail panel when URL has both share slug and action (view/edit) — e.g. deep link or ActionMenu → View/Edit
  useEffect(() => {
    if (!pathShareSlug || !pathAction || shares.length === 0) return
    const share = shares.find((s) => (s.slug ?? null) === pathShareSlug || s.id === pathShareSlug)
    if (share && share.id !== detailShareId) {
      setDetailShareId(share.id)
      setPanelExpanded(true)
    }
  }, [pathShareSlug, pathAction, shares, detailShareId])

  const refreshData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setIsLoading(false)
        return
      }
      const response = await fetch(`/api/projects/${projectId}/shares`, {
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      })
      if (!response.ok) throw new Error('Failed to fetch shares')
      const data = await response.json()
      setShares(data.shares || [])
    } catch (error) {
      logger.error('Failed to fetch shares data', error instanceof Error ? error : new Error(String(error)), 'ProjectShares', { projectId })
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    refreshData()
  }, [refreshData])

  const saveOrder = useCallback(async (toDo: string[], inProgress: string[], done: string[]) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      await fetch(`/api/projects/${projectId}/shares/order`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to_do: toDo, in_progress: inProgress, done }),
      })
      await refreshData()
    } catch (e) {
      logger.error('Failed to save order', e instanceof Error ? e : new Error(String(e)), 'ProjectShares', {})
    }
  }, [projectId, refreshData])

  const handleFinalize = async (shareId: string, documentId: string) => {
    setFinalizingId(shareId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch(
        `/api/projects/${projectId}/documents/${encodeURIComponent(documentId)}/sharing/finalize`,
        { method: 'PATCH', headers: { Authorization: `Bearer ${session.access_token}` } }
      )
      if (!res.ok) throw new Error('Failed to finalize')
      await refreshData()
      setDetailShareId(null)
    } catch (e) {
      logger.error('Failed to finalize share', e instanceof Error ? e : new Error(String(e)), 'ProjectShares', { shareId })
    } finally {
      setFinalizingId(null)
    }
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

  const handleCloseDetail = useCallback(() => {
    setDetailShareId(null)
    setPanelExpanded(false)
    if (sharesBasePath) router.push(`${sharesBasePath}/${viewMode}`)
  }, [sharesBasePath, viewMode, router])

  const handleNavigateToView = useCallback((documentId: string) => {
    if (!sharesBasePath) return
    const share = shares.find((s) => s.documentId === documentId)
    if (share) router.push(`${sharesBasePath}/${viewMode}/${share.slug ?? share.id}/view`)
  }, [sharesBasePath, viewMode, shares, router])

  const handleNavigateToEdit = useCallback((documentId: string) => {
    if (!sharesBasePath) return
    const share = shares.find((s) => s.documentId === documentId)
    if (share) router.push(`${sharesBasePath}/${viewMode}/${share.slug ?? share.id}/edit`)
  }, [sharesBasePath, viewMode, shares, router])

  const getDocumentForMenu = (share: ShareRecord) => ({
    id: share.documentId,
    name: share.documentName,
    mimeType: share.documentMimeType ?? undefined,
    externalId: share.documentExternalId,
    modifiedTime: share.updatedAt,
    createdTime: share.createdAt,
  })

  const handleOpenInFilesForFolder = useCallback(
    (share: ShareRecord) => {
      if (!onOpenInFiles || !share.documentMimeType?.includes('folder')) return
      const breadcrumbs: FilesBreadcrumbItem[] = [
        { id: 'org', name: orgName ?? 'Organization', clickable: false },
        { id: 'client', name: clientName ?? 'Client', clickable: false },
        { id: connectorRootFolderId ?? 'project', name: projectName ?? 'Project', clickable: false },
        { id: share.documentExternalId, name: share.documentName, clickable: true },
      ]
      onOpenInFiles(share.documentExternalId, breadcrumbs)
    },
    [onOpenInFiles, orgName, clientName, projectName, connectorRootFolderId]
  )

  const byLane = React.useMemo(() => {
    const toDo: ShareRecord[] = []
    const inProgress: ShareRecord[] = []
    const done: ShareRecord[] = []
    shares.forEach((s) => {
      const status = s.activity?.status ?? 'to_do'
      const orderIndex = s.activity?.orderIndex ?? 0
      const rec = { ...s, _orderIndex: orderIndex }
      if (status === 'in_progress') inProgress.push(rec)
      else if (status === 'done') done.push(rec)
      else toDo.push(rec)
    })
    toDo.sort((a, b) => (a._orderIndex ?? 0) - (b._orderIndex ?? 0))
    inProgress.sort((a, b) => (a._orderIndex ?? 0) - (b._orderIndex ?? 0))
    done.sort((a, b) => (a._orderIndex ?? 0) - (b._orderIndex ?? 0))
    return { to_do: toDo, in_progress: inProgress, done }
  }, [shares])

  const laneOrder = React.useMemo(() => ({
    to_do: byLane.to_do.map((s) => s.id),
    in_progress: byLane.in_progress.map((s) => s.id),
    done: byLane.done.map((s) => s.id),
  }), [byLane])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (!over) return
    const shareId = active.id as string
    const overId = String(over.id)
    let targetLane: ActivityStatus
    let insertIndex: number
    if (['to_do', 'in_progress', 'done'].includes(overId)) {
      targetLane = overId as ActivityStatus
      insertIndex = laneOrder[targetLane].length
    } else {
      const overShare = shares.find((s) => s.id === overId)
      if (!overShare) return
      targetLane = (overShare.activity?.status ?? 'to_do') as ActivityStatus
      insertIndex = laneOrder[targetLane].indexOf(overId)
      if (insertIndex < 0) insertIndex = laneOrder[targetLane].length
    }
    const currentLane = laneOrder.to_do.includes(shareId) ? 'to_do' : laneOrder.in_progress.includes(shareId) ? 'in_progress' : 'done'
    const newToDo = laneOrder.to_do.filter((id) => id !== shareId)
    const newInProgress = laneOrder.in_progress.filter((id) => id !== shareId)
    const newDone = laneOrder.done.filter((id) => id !== shareId)
    const insertAt = (arr: string[], id: string, idx: number) => {
      const out = arr.slice()
      out.splice(idx, 0, id)
      return out
    }
    if (targetLane === 'to_do') saveOrder(insertAt(newToDo, shareId, insertIndex), newInProgress, newDone)
    else if (targetLane === 'in_progress') saveOrder(newToDo, insertAt(newInProgress, shareId, insertIndex), newDone)
    else saveOrder(newToDo, newInProgress, insertAt(newDone, shareId, insertIndex))
  }

  const detailShare = detailShareId ? shares.find((s) => s.id === detailShareId) : null

  return (
    <div className="flex flex-col h-full bg-[#fafafa] rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200/60 bg-white shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Share2 className="h-5 w-5 text-slate-500" />
            Shared Documents
            {!isLoading && shares.length > 0 && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-lg">
                {shares.length}
              </span>
            )}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {viewMode === 'board'
              ? 'Drag cards between lanes to update status. Project Lead can finalize from Done.'
              : 'Browse shared documents. Use the actions menu on each row to view, edit, or share.'}
          </p>
        </div>
        <nav className="flex items-center gap-1 mt-4 border-b border-slate-200" aria-label="View mode">
          <button
            type="button"
            onClick={() => { if (sharesBasePath) router.push(`${sharesBasePath}/list`) }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              viewMode === 'list'
                ? 'bg-slate-100 text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
            )}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            type="button"
            onClick={() => { if (sharesBasePath) router.push(`${sharesBasePath}/board`) }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              viewMode === 'board'
                ? 'bg-slate-100 text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Board
          </button>
        </nav>
      </div>

      <div className="flex flex-1 min-h-0 overflow-hidden gap-4">
        <div className="flex-1 min-w-0 overflow-auto p-4 bg-white rounded-2xl">
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <LoadingSpinner size="md" className="min-h-0" />
            </div>
          ) : shares.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 bg-white/60 rounded-2xl border border-slate-200/60 mx-2">
              <Share2 className="h-11 w-11 mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No shared documents yet</p>
              <p className="text-xs mt-1 text-slate-400">Share documents from the Files tab to see them here</p>
            </div>
          ) : viewMode === 'list' ? (
            <SharesListView
              shares={shares}
              formatDate={formatDate}
              getDocumentForMenu={getDocumentForMenu}
              canManage={canManage}
              onShareSaved={refreshData}
              onOpenInFilesForFolder={onOpenInFiles ? handleOpenInFilesForFolder : undefined}
              onNavigateToView={sharesBasePath ? handleNavigateToView : undefined}
              onNavigateToEdit={sharesBasePath ? handleNavigateToEdit : undefined}
            />
          ) : (
            <>
              <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <div className="grid grid-cols-3 gap-4 min-h-[360px]">
                  {LANES.map((lane) => (
                    <motion.div
                      key={lane.status}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col rounded-2xl overflow-hidden border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    >
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-200/50 bg-white/60">
                        <div className={cn('rounded-lg bg-gradient-to-br p-1.5', lane.iconGradient)}>
                          {lane.icon}
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{lane.label}</span>
                        <span className="text-xs text-slate-500">({byLane[lane.status].length})</span>
                      </div>
                      <DroppableLane id={lane.status} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[120px]">
                        <AnimatePresence mode="popLayout">
                          {byLane[lane.status].map((share) => (
                            <DraggableCard
                              key={share.id}
                              id={share.id}
                              share={share}
                              laneStatus={lane.status}
                              formatDate={formatDate}
                              getDocumentForMenu={getDocumentForMenu}
                              showActions
                              onFinalize={() => handleFinalize(share.id, share.documentId)}
                              finalizingId={finalizingId}
                              canManage={canManage}
                              isDoneLane={lane.status === 'done'}
                              onShareSaved={refreshData}
                              onNavigateToView={sharesBasePath ? handleNavigateToView : undefined}
                              onNavigateToEdit={sharesBasePath ? handleNavigateToEdit : undefined}
                            />
                          ))}
                        </AnimatePresence>
                      </DroppableLane>
                    </motion.div>
                  ))}
                </div>

                <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                  {activeId ? (() => {
                    const share = shares.find((s) => s.id === activeId)
                    if (!share) return null
                    const status = (share.activity?.status ?? 'to_do') as ActivityStatus
                    const accent = CARD_ACCENT[status]
                    return (
                      <motion.div
                        layoutId={activeId}
                        className={cn(
                          'rounded-2xl overflow-hidden w-[280px] border border-slate-200/80 bg-white',
                          accent.border,
                          'shadow-[0_8px_24px_-8px_rgba(0,0,0,0.15)]'
                        )}
                        style={{ cursor: 'grabbing' }}
                      >
                        <div className="h-2 bg-slate-100/80" />
                        <ShareCardContent
                          share={share}
                          laneHeaderBg={accent.headerBg}
                          iconPillBg={accent.iconPillBg}
                          formatDate={formatDate}
                          getDocumentForMenu={getDocumentForMenu}
                          showActions={false}
                          finalizingId={null}
                          canManage={false}
                          isDoneLane={false}
                        />
                      </motion.div>
                    )
                  })() : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </div>

        {/* Fixed-width slot so right panel is never shrunk by flex (same as layout document panel) */}
        {detailShare ? (
          <div
            className="shrink-0 flex flex-col h-full overflow-hidden"
            style={{ width: 320, minWidth: 320, flexBasis: 320 }}
          >
            <ShareDetailPanel
              open
              isExpanded={panelExpanded}
              onExpand={() => setPanelExpanded(true)}
              onCollapse={() => setPanelExpanded(false)}
              onClose={sharesBasePath ? handleCloseDetail : () => { setDetailShareId(null); setPanelExpanded(false) }}
              title={detailShare.documentName ?? ''}
            >
          {detailShare && (
            <div className="space-y-4">
              <div className="text-xs text-slate-500">
                Shared at: {formatDate(detailShare.createdAt)}
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Shared Setting</h3>
                <p className="text-[11px] text-slate-500 mb-2">Change via Action menu → Share</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={detailShare.settings.externalCollaborator} disabled className="scale-90 origin-left" />
                    <span className="text-xs text-slate-600">
                      External Collaborator: {detailShare.settings.externalCollaborator ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={detailShare.settings.guest} disabled className="scale-90 origin-left" />
                    <span className="text-xs text-slate-600">
                      Guest: {detailShare.settings.guest ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              {detailShare.comments && detailShare.comments.length > 0 && (
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Comments</h3>
                  <div className="space-y-2">
                    {detailShare.comments.map((c, i) => (
                      <div key={i} className="text-xs text-slate-600 bg-white rounded-lg border border-slate-200/60 px-3 py-2">
                        {c.comment}
                        <span className="text-slate-400 ml-1">— {formatDate(c.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Access Log</h3>
                {detailShare.accessLog.length > 0 ? (
                  detailShare.accessLog.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 py-1.5">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      {entry.email || entry.userId || 'Unknown'} · {getPersonaDisplayName(entry.by)} · {formatDate(entry.at)}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">No access recorded yet</p>
                )}
              </div>
              <div className="pt-2 flex gap-2">
                <DocumentActionMenu
                  document={getDocumentForMenu(detailShare)}
                  showShareModal={canManage}
                  projectId={projectId}
                  onShareSaved={() => { refreshData(); setDetailShareId(null) }}
                  onNavigateToView={sharesBasePath ? handleNavigateToView : undefined}
                  onNavigateToEdit={sharesBasePath ? handleNavigateToEdit : undefined}
                />
              </div>
            </div>
          )}
            </ShareDetailPanel>
          </div>
        ) : null}
      </div>
    </div>
  )
}
