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
import { Share2, User, Lock, ListTodo, Loader2, CheckCircle, GripVertical, List, LayoutGrid, Eye } from 'lucide-react'
import { DocumentIcon } from '@/components/ui/document-icon'
import { SharedFolderIcon } from '@/components/ui/folder-shared-icon'
import { DocumentActionMenu } from '@/components/ui/document-action-menu'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/logger'
import { formatRelativeTime } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

type ActivityStatus = 'to_do' | 'in_progress' | 'done'

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
}

interface ProjectSharesTabProps {
  projectId: string
  canManage?: boolean
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
  onOpenDetail,
  onFinalize,
  finalizingId,
  canManage,
  isDoneLane,
  onShareSaved,
}: {
  id: string
  share: ShareRecord
  laneStatus: ActivityStatus
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  showActions: boolean
  onOpenDetail: () => void
  onFinalize?: () => void
  finalizingId: string | null
  canManage: boolean
  isDoneLane: boolean
  onShareSaved?: () => void
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
        onOpenDetail={onOpenDetail}
        onFinalize={onFinalize}
        finalizingId={finalizingId}
        canManage={canManage}
        isDoneLane={isDoneLane}
        onShareSaved={onShareSaved}
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
  onOpenDetail,
  onFinalize,
  finalizingId,
  canManage,
  isDoneLane,
  onShareSaved,
}: {
  share: ShareRecord
  laneHeaderBg: string
  iconPillBg: string
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  showActions: boolean
  onOpenDetail: () => void
  onFinalize?: () => void
  finalizingId: string | null
  canManage: boolean
  isDoneLane: boolean
  onShareSaved?: () => void
}) {
  const latestComment = share.comments?.[0]
  const isFinalized = !!share.finalizedAt

  return (
    <>
      <div
        className={cn('cursor-pointer transition-colors duration-200', laneHeaderBg)}
        onClick={onOpenDetail}
      >
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

function SharesListView({
  shares,
  formatDate,
  getDocumentForMenu,
  onOpenDetail,
  canManage,
  onShareSaved,
}: {
  shares: ShareRecord[]
  formatDate: (s: string) => string
  getDocumentForMenu: (s: ShareRecord) => { id: string; name: string; mimeType?: string; externalId: string }
  onOpenDetail: (shareId: string) => void
  canManage: boolean
  onShareSaved: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200/80 bg-slate-50/70">
              <th className="text-left py-3 px-4 font-semibold text-slate-600">
                <span className="flex items-center gap-2">
                  <List className="h-4 w-4 text-slate-400" />
                  Document
                </span>
              </th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 w-[140px]">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-slate-600 w-[120px]">Updated</th>
              <th className="text-right py-3 px-4 font-semibold text-slate-600 w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shares.map((share) => {
              const status = (share.activity?.status ?? 'to_do') as ActivityStatus
              const latestComment = share.comments?.[0]
              return (
                <tr
                  key={share.id}
                  className={cn(
                    'border-b border-slate-100 last:border-b-0 transition-colors',
                    'hover:bg-slate-50/80 cursor-pointer'
                  )}
                  onClick={() => onOpenDetail(share.id)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.06)]',
                          STATUS_PILL_CLASS[status]
                        )}
                      >
                        {share.documentMimeType?.includes('folder') ? (
                          <SharedFolderIcon fillLevel={1} tooltip="shared" />
                        ) : (
                          <DocumentIcon mimeType={share.documentMimeType ?? undefined} className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 truncate" title={share.documentName}>
                          {share.documentName}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {latestComment ? latestComment.comment : 'Shared document'} · {formatDate(share.updatedAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium',
                        STATUS_PILL_CLASS[status]
                      )}
                    >
                      {STATUS_LABELS[status]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500">{formatDate(share.updatedAt)}</td>
                  <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className="p-2 rounded-full hover:bg-slate-200/80 text-slate-500 hover:text-slate-700 transition-colors"
                        onClick={(e) => { e.stopPropagation(); onOpenDetail(share.id) }}
                        title="View details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <DocumentActionMenu
                        document={getDocumentForMenu(share)}
                        showShareModal={canManage}
                        projectId={share.projectId}
                        onShareSaved={onShareSaved}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type SharesViewMode = 'list' | 'board'

export function ProjectSharesTab({ projectId, canManage = false }: ProjectSharesTabProps) {
  const [shares, setShares] = useState<ShareRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [finalizingId, setFinalizingId] = useState<string | null>(null)
  const [detailShareId, setDetailShareId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<SharesViewMode>('board')

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

  const getDocumentForMenu = (share: ShareRecord) => ({
    id: share.documentId,
    name: share.documentName,
    mimeType: share.documentMimeType ?? undefined,
    externalId: share.documentExternalId,
  })

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
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/60 bg-white shrink-0">
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
              : 'Browse shared documents in a table. Click a row or actions to open details.'}
          </p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            )}
            title="List View"
          >
            <List className="h-4 w-4" />
            List View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              viewMode === 'board' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
            )}
            title="Board View"
          >
            <LayoutGrid className="h-4 w-4" />
            Board View
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto min-h-0 p-4 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-500" />
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
            onOpenDetail={setDetailShareId}
            canManage={canManage}
            onShareSaved={refreshData}
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
                            onOpenDetail={() => setDetailShareId(share.id)}
                            onFinalize={() => handleFinalize(share.id, share.documentId)}
                            finalizingId={finalizingId}
                            canManage={canManage}
                            isDoneLane={lane.status === 'done'}
                            onShareSaved={refreshData}
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
                        onOpenDetail={() => {}}
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

      <Sheet open={!!detailShare} onOpenChange={(open) => !open && setDetailShareId(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          {detailShare && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="text-slate-900 truncate pr-8">{detailShare.documentName}</SheetTitle>
              </SheetHeader>
              <div className="pt-4 space-y-4">
                <div className="text-xs text-slate-500">
                  Shared at: {formatDate(detailShare.createdAt)}
                </div>
                <div>
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
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">Comments</h3>
                    <div className="space-y-2">
                      {detailShare.comments.map((c, i) => (
                        <div key={i} className="text-xs text-slate-600 bg-slate-50 rounded border border-slate-200 px-3 py-2">
                          {c.comment}
                          <span className="text-slate-400 ml-1">— {formatDate(c.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
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
                <div className="pt-4 flex gap-2">
                  <DocumentActionMenu
                    document={getDocumentForMenu(detailShare)}
                    showShareModal={canManage}
                    projectId={projectId}
                    onShareSaved={() => { refreshData(); setDetailShareId(null) }}
                  />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
