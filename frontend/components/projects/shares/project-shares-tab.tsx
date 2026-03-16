'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { DocumentPreviewPanelContent } from '@/components/files/document-edit-sheet'
import { FilePreviewSheet } from '@/components/files/file-preview-sheet'
import { useRightPane } from '@/lib/right-pane-context'
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
import { SecureAccessModal } from './secure-access-modal'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { supabase } from '@/lib/supabase'
import { useSecureOpenDocument } from '@/lib/use-secure-open-document'
import { logger } from '@/lib/logger'
import { formatRelativeTime, formatDateTimeWithTZ } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useProjectPersonaLabels } from '@/lib/hooks/use-project-persona-labels'

type ActivityStatus = 'to_do' | 'in_progress' | 'done'

interface ShareRecord {
  id: string
  projectId: string
  documentId: string
  documentName: string
  documentExternalId: string
  documentMimeType: string | null
  thumbnailLink?: string | null
  webViewLink?: string | null
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
  /** When set, view mode is driven by URL; changes navigate */
  sharesBasePath?: string
  pathViewMode?: 'list' | 'board' | 'grid'
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

function getInitials(nameOrEmail: string | null | undefined): string {
  if (!nameOrEmail) return '?'
  // Remove UUIDs if they accidentally leak in
  if (nameOrEmail.length > 30 && nameOrEmail.includes('-')) return '?'

  const clean = nameOrEmail.split('@')[0].replace(/[._-]/g, ' ')
  const parts = clean.split(' ').filter(p => p.length > 0)

  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return parts[0].slice(0, 2).toUpperCase()
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
  handleSecureOpen,
  isRegrantingId,
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
  handleSecureOpen: (share: ShareRecord) => void
  isRegrantingId: string | null
}) {
  const rightPane = useRightPane()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id })
  const accent = CARD_ACCENT[laneStatus]

  const previewDoc = {
    id: share.documentId,
    externalId: share.documentExternalId,
    name: share.documentName,
    mimeType: share.documentMimeType ?? undefined,
    size: (share as any).metadata?.size ?? null,
    modifiedTime: share.updatedAt,
    projectId: share.projectId,
    isGuest: share.settings?.guest ?? false,
  }

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
        handleSecureOpen={handleSecureOpen}
        isRegrantingId={isRegrantingId}
        onClickTitle={() => handleSecureOpen(share)}
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
  onClickTitle,
  handleSecureOpen,
  isRegrantingId,
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
  onClickTitle?: () => void
  handleSecureOpen: (share: ShareRecord) => void
  isRegrantingId: string | null
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
            <div
              className="text-sm font-semibold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors"
              title={share.documentName}
              onClick={onClickTitle}
            >
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
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-[11px] text-slate-400 cursor-default">{formatRelativeTime(share.updatedAt)}</span>
            </TooltipTrigger>
            <TooltipContent side="top" className="z-[9999] max-w-[320px] p-3 text-xs bg-white text-slate-900 border border-slate-200 shadow-xl">
              {formatDateTimeWithTZ(share.updatedAt)}
            </TooltipContent>
          </Tooltip>
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
          <div className="flex items-center gap-2">
            <DocumentActionMenu
              document={getDocumentForMenu(share)}
              showShareModal={canManage}
              projectId={share.projectId}
              onShareSaved={onShareSaved}
              onOpenDocument={() => handleSecureOpen(share)}
            />
            {isRegrantingId === share.id && (
              <LoadingSpinner size="sm" className="min-h-0 ml-1" />
            )}
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
                <button type="button" onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700" title="Copy email">
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
                <button type="button" onClick={handleCopy} className="shrink-0 p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700" title="Copy email">
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
  handleSecureOpen,
  isRegrantingId,
  extCollaboratorLabel,
  viewerLabel,
}: {
  shares: ShareRecord[]
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  canManage: boolean
  onShareSaved: () => void
  onOpenInFilesForFolder?: (share: ShareRecord) => void
  handleSecureOpen: (share: ShareRecord) => void
  isRegrantingId: string | null
  extCollaboratorLabel: string
  viewerLabel: string
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
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                    {share.documentMimeType?.includes('folder') ? (
                      <SharedFolderIcon fillLevel={1} tooltip="shared" />
                    ) : (
                      <DocumentIcon mimeType={share.documentMimeType ?? undefined} size={20} />
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
                      onOpenChange={(open) => setActionMenuOpenShareId(open ? share.id : null)}
                      onOpenDocument={() => handleSecureOpen(share)}
                    />
                    {isRegrantingId === share.id && (
                      <LoadingSpinner size="sm" className="min-h-0 ml-1" />
                    )}
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
                              {extCollaboratorLabel}
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
                              {viewerLabel}
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

function SharesGridView({
  shares,
  formatDate,
  getDocumentForMenu,
  canManage,
  onShareSaved,
  onOpenInFilesForFolder,
  handleSecureOpen,
  isRegrantingId,
  extCollaboratorLabel,
  viewerLabel,
}: {
  shares: ShareRecord[]
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  canManage: boolean
  onShareSaved: () => void
  onOpenInFilesForFolder?: (share: ShareRecord) => void
  handleSecureOpen: (share: ShareRecord) => void
  isRegrantingId: string | null
  extCollaboratorLabel: string
  viewerLabel: string
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 py-2">
      {shares.map((share) => (
        <ShareCard
          key={share.id}
          share={share}
          formatDate={formatDate}
          getDocumentForMenu={getDocumentForMenu}
          canManage={canManage}
          onShareSaved={onShareSaved}
          onOpenInFilesForFolder={onOpenInFilesForFolder}
          handleSecureOpen={handleSecureOpen}
          isRegrantingId={isRegrantingId}
          extCollaboratorLabel={extCollaboratorLabel}
          viewerLabel={viewerLabel}
        />
      ))}
    </div>
  )
}

function ShareCard({
  share,
  formatDate,
  getDocumentForMenu,
  canManage,
  onShareSaved,
  onOpenInFilesForFolder,
  handleSecureOpen,
  isRegrantingId,
  extCollaboratorLabel,
  viewerLabel,
}: {
  share: ShareRecord
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  canManage: boolean
  onShareSaved: () => void
  onOpenInFilesForFolder?: (share: ShareRecord) => void
  handleSecureOpen: (share: ShareRecord) => void
  isRegrantingId: string | null
  extCollaboratorLabel: string
  viewerLabel: string
}) {
  const rightPane = useRightPane()
  const isFolder = share.documentMimeType?.includes('folder')

  // Build a minimal document object compatible with DocumentPreviewPanelContent
  const previewDoc = {
    id: share.documentId,
    externalId: share.documentExternalId,
    name: share.documentName,
    mimeType: share.documentMimeType ?? undefined,
    size: (share as any).metadata?.size ?? null,
    modifiedTime: share.updatedAt,
    projectId: share.projectId,
    isGuest: share.settings?.guest ?? false,
  }

  const handleOpenPreview = () => handleSecureOpen(share)

  // Proxy URL — avoids Google CDN 429 by routing through our backend with OAuth token
  const proxyThumbnailUrl = share.thumbnailLink
    ? `/api/proxy/thumbnail/${encodeURIComponent(share.documentExternalId)}?organizationId=${encodeURIComponent((share as any).organizationId ?? '')}&size=400`
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-3xl border border-slate-200/80 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] transition-all duration-300 overflow-hidden flex flex-col h-full"
    >
      {/* Thumbnail / Large Icon Area */}
      <div
        className={cn(
          "aspect-[16/10] bg-slate-50 border-b border-slate-100 cursor-pointer overflow-hidden relative group/thumb",
          !proxyThumbnailUrl && "flex items-center justify-center"
        )}
        onClick={handleOpenPreview}
      >
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur rounded shadow-sm border border-slate-200/50 p-1.5 flex items-center justify-center pointer-events-none group-hover:-translate-y-1 transition-transform duration-300">
          <DocumentIcon mimeType={share.documentMimeType ?? undefined} className="w-5 h-5" />
        </div>

        {proxyThumbnailUrl ? (
          <div className="w-full h-full relative">
            <img
              src={proxyThumbnailUrl}
              alt={share.documentName}
              className="absolute inset-0 w-full h-full object-cover opacity-100 group-hover:scale-110 transition-transform duration-1000 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
          </div>
        ) : isFolder ? (
          <div className="w-full h-full bg-indigo-50/20 flex items-center justify-center relative group-hover:bg-indigo-50/40 transition-colors duration-500">
            <div className="transform group-hover:scale-110 transition-transform duration-700 ease-out shadow-indigo-200/50">
              <SharedFolderIcon fillLevel={1} tooltip="shared" className="h-32 w-32 opacity-40" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent" />
          </div>
        ) : (
          <div className="w-full h-full bg-slate-50 flex items-center justify-center relative group-hover:bg-indigo-50/30 transition-colors duration-700">
            {/* Subtle Background Pattern/Gradient */}
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #4285F4 1px, transparent 0)', backgroundSize: '24px 24px' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />

            {/* Parsing / Scanning Animation */}
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
              <motion.div
                initial={{ top: '-10%' }}
                animate={{ top: '110%' }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-0.5 bg-indigo-500/50 blur-[1px] z-10"
              />
            </div>

            <div className="transform group-hover:scale-110 group-hover:rotate-1 transition-all duration-700 ease-out flex items-center justify-center z-10 drop-shadow-sm">
              <DocumentIcon mimeType={share.documentMimeType ?? undefined} size={120} />
            </div>

            <div className="absolute bottom-4 left-0 right-0 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] bg-white/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/30 shadow-sm leading-none">
                Syncing Metadata...
              </span>
            </div>
          </div>
        )}

        {/* Overlay Badge for MimeType */}
        {!isFolder && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
            <div className="bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/50 shadow-sm text-[10px] font-black text-indigo-600 tracking-wider uppercase">
              {share.documentMimeType?.split('.').pop()?.split('/').pop()?.replace('vnd.google-apps.', '')}
            </div>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-5 flex flex-col flex-1 bg-white relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="font-bold text-slate-800 text-[15px] leading-tight truncate cursor-pointer hover:text-indigo-600 transition-colors"
              title={share.documentName}
              onClick={handleOpenPreview}
            >
              {share.documentName}
            </h3>
            <div className="flex items-center gap-1.5 mt-2">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Shared {formatDate(share.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 flex items-center justify-between border-t border-slate-50">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 rounded-full border-2 border-white ring-1 ring-slate-100 shadow-sm">
              {share.createdByAvatarUrl ? (
                <img src={share.createdByAvatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <AvatarFallback className="text-[11px] bg-slate-50 text-slate-600 font-black">{getInitials(share.createdByEmail)}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-tight leading-none mb-1">Shared by</span>
              <span className="text-[13px] text-slate-800 font-bold leading-tight">{share.createdByEmail?.split('@')[0] || 'Team Member'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex -space-x-1.5 mr-2">
              {share.settings.guest && (
                <div
                  className="h-5 w-5 rounded-full ring-2 ring-white bg-sky-100 text-sky-700 flex items-center justify-center text-[9px] font-black shadow-sm"
                  title={`${viewerLabel} Enabled`}
                >
                  G
                </div>
              )}
              {share.settings.externalCollaborator && (
                <div
                  className="h-5 w-5 rounded-full ring-2 ring-white bg-violet-100 text-violet-700 flex items-center justify-center text-[9px] font-black shadow-sm"
                  title={`${extCollaboratorLabel} Enabled`}
                >
                  EC
                </div>
              )}
            </div>

            <DocumentActionMenu
              document={getDocumentForMenu(share)}
              showShareModal={canManage}
              projectId={share.projectId}
              onShareSaved={onShareSaved}
              onOpenDocument={() => handleSecureOpen(share)}
            />
            {isRegrantingId === share.id && (
              <LoadingSpinner size="sm" className="min-h-0 ml-1" />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Accent Bar */}
      <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  )
}

type SharesViewMode = 'grid' | 'list' | 'board'

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
}: ProjectSharesTabProps) {
  const router = useRouter()
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [detailShareId, setDetailShareId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)

  const {
    handleSecureOpen,
    secureModalOpen,
    secureModalData,
    setSecureModalOpen,
    isRegrantingId,
  } = useSecureOpenDocument({ projectId, logContext: 'ProjectShares' })

  const viewMode = (pathViewMode ?? 'grid') as SharesViewMode
  const { projExtCollaborator, projViewer } = useProjectPersonaLabels()

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
    if (by === 'external_collaborator') return projExtCollaborator
    if (by === 'guest') return projViewer
    return by
  }

  const getDocumentForMenu = (share: ShareRecord) => ({
    id: share.documentId,
    name: share.documentName,
    mimeType: share.documentMimeType ?? undefined,
    externalId: share.documentExternalId,
    modifiedTime: share.updatedAt,
    createdTime: share.createdAt,
    projectId: share.projectId,
    isGuest: share.settings?.guest ?? false,
    webViewLink: share.webViewLink,
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

  const handleSecureOpenShare = useCallback(
    (share: ShareRecord) => {
      handleSecureOpen(
        {
          documentId: share.documentId,
          fileName: share.documentName,
          mimeType: share.documentMimeType ?? undefined,
          externalId: share.documentExternalId,
          organizationId: (share as any).organizationId,
        },
        share.id
      )
    },
    [handleSecureOpen]
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
            onClick={() => { if (sharesBasePath) router.push(`${sharesBasePath}/grid`) }}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px',
              viewMode === 'grid'
                ? 'bg-slate-100 text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </button>
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
            <ListTodo className="h-4 w-4" />
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
          ) : viewMode === 'grid' ? (
            <SharesGridView
              shares={shares}
              formatDate={formatDate}
              getDocumentForMenu={getDocumentForMenu}
              canManage={canManage}
              onShareSaved={refreshData}
              onOpenInFilesForFolder={onOpenInFiles ? handleOpenInFilesForFolder : undefined}
              handleSecureOpen={handleSecureOpenShare}
              isRegrantingId={isRegrantingId}
              extCollaboratorLabel={projExtCollaborator}
              viewerLabel={projViewer}
            />
          ) : viewMode === 'list' ? (
            <SharesListView
              shares={shares}
              formatDate={formatDate}
              getDocumentForMenu={getDocumentForMenu}
              canManage={canManage}
              onShareSaved={refreshData}
              onOpenInFilesForFolder={onOpenInFiles ? handleOpenInFilesForFolder : undefined}
              handleSecureOpen={handleSecureOpenShare}
              isRegrantingId={isRegrantingId}
              extCollaboratorLabel={projExtCollaborator}
              viewerLabel={projViewer}
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
                              handleSecureOpen={handleSecureOpenShare}
                              isRegrantingId={isRegrantingId}
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
                          handleSecureOpen={handleSecureOpenShare}
                          isRegrantingId={isRegrantingId}
                        />
                      </motion.div>
                    )
                  })() : null}
                </DragOverlay>
              </DndContext>
            </>
          )}
        </div>
      </div>

      <SecureAccessModal
        isOpen={secureModalOpen}
        onClose={() => setSecureModalOpen(false)}
        email={secureModalData.email}
        fileName={secureModalData.fileName}
        mimeType={secureModalData.mimeType}
        externalId={secureModalData.externalId}
        organizationId={secureModalData.organizationId}
      />
    </div>
  )
}
