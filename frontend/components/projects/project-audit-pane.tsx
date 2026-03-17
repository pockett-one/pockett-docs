'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { FileUp, RefreshCw, Loader2, Lock, Share2, FolderLock, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatSmartDateTime } from '@/lib/utils'

export interface ProjectAuditPaneProps {
  projectId: string
  projectName?: string
}

type AuditEvent = {
  id: string
  eventType: string
  eventAt: string
  actorUserId: string | null
  actorEmail: string | null
  projectDocumentId: string | null
  metadata: Record<string, unknown>
}

const EVENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'PROJECT_DOCUMENT_ADDED', label: 'File uploaded' },
  { value: 'PROJECT_DOCUMENT_REMOVED', label: 'File removed' },
  { value: 'DOCUMENT_ACTIVITY_STATUS_CHANGED', label: 'Status change' },
  { value: 'DOCUMENT_SHARED_EXTERNAL', label: 'Shared externally' },
  { value: 'PROJECT_CREATED', label: 'Project created' },
  { value: 'PROJECT_UPDATED', label: 'Project updated' },
  { value: 'PROJECT_CLOSED', label: 'Project closed' },
  { value: 'PROJECT_REOPENED', label: 'Project reopened' },
  { value: 'PROJECT_SOFT_DELETED', label: 'Project deleted' },
]

function eventTypeLabel(eventType: string): string {
  const found = EVENT_TYPE_OPTIONS.find((o) => o.value === eventType)
  return found ? found.label : eventType.replace(/_/g, ' ').toLowerCase()
}

function eventDetails(ev: AuditEvent): string {
  const m = ev.metadata as Record<string, unknown> | undefined
  if (!m || typeof m !== 'object') return ''
  const fileName = m.fileName as string | undefined
  const description = m.description as string | undefined
  if (fileName) return fileName
  if (description) return description
  if (m.newStatus) return `Status: ${m.oldStatus ?? '—'} → ${m.newStatus}`
  return Object.keys(m).length ? JSON.stringify(m) : ''
}

function EventIcon({ eventType }: { eventType: string }) {
  if (eventType.includes('SHARED') || eventType === 'SHARED_EXT') return <Share2 className="h-4 w-4 text-purple-600" />
  if (eventType.includes('LOCKED') || eventType.includes('CLOSED')) return <Lock className="h-4 w-4 text-amber-600" />
  if (eventType.includes('UPLOAD') || eventType.includes('DOCUMENT_ADDED')) return <FileUp className="h-4 w-4 text-blue-600" />
  if (eventType.includes('STATUS') || eventType === 'STATUS_CHANGE') return <RefreshCw className="h-4 w-4 text-slate-600" />
  return <FileText className="h-4 w-4 text-gray-500" />
}

function buildAuditUrl(
  projectId: string,
  opts: { cursor?: string; fromDate?: string; toDate?: string; eventType?: string }
): string {
  const url = new URL(`/api/projects/${projectId}/audit`, window.location.origin)
  url.searchParams.set('limit', '50')
  if (opts.cursor) url.searchParams.set('cursor', opts.cursor)
  if (opts.fromDate) url.searchParams.set('fromDate', opts.fromDate)
  if (opts.toDate) url.searchParams.set('toDate', opts.toDate)
  if (opts.eventType) url.searchParams.set('eventType', opts.eventType)
  return url.toString()
}

function exportToCsv(events: AuditEvent[], projectName: string) {
  const headers = ['Date', 'Event type', 'Details', 'Actor email']
  const rows = events.map((ev) => {
    const date = formatSmartDateTime(ev.eventAt)
    const type = eventTypeLabel(ev.eventType)
    const details = eventDetails(ev).replace(/"/g, '""')
    const email = (ev.actorEmail ?? (ev.actorUserId ? 'User' : 'System')).replace(/"/g, '""')
    return [date, type, details, email].map((c) => `"${c}"`).join(',')
  })
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `audit-${(projectName || 'project').replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

export function ProjectAuditPane({ projectId, projectName }: ProjectAuditPaneProps) {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [eventTypeFilter, setEventTypeFilter] = useState('')
  const [clearThenReload, setClearThenReload] = useState(false)

  const fetchPage = useCallback(
    async (cursor?: string) => {
      const url = buildAuditUrl(projectId, {
        cursor,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        eventType: eventTypeFilter || undefined,
      })
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load audit')
      }
      return res.json()
    },
    [projectId, fromDate, toDate, eventTypeFilter]
  )

  const load = useCallback(
    async (cursor?: string) => {
      const isInitial = !cursor
      if (isInitial) setLoading(true)
      else setLoadingMore(true)
      setError(null)
      try {
        const data = await fetchPage(cursor)
        const list = data.events ?? []
        if (isInitial) setEvents(list)
        else setEvents((prev) => [...prev, ...list])
        setNextCursor(data.nextCursor ?? null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load audit')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [fetchPage]
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (clearThenReload) {
      setClearThenReload(false)
      load()
    }
  }, [clearThenReload, load])

  const handleApplyFilters = useCallback(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col h-full min-h-0">
      <p className="text-xs text-gray-500 mb-3">
        Audit history is permanent and cannot be edited.
      </p>

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">From date</label>
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(e) => {
              const next = e.target.value
              setFromDate(next)
              if (toDate && next && toDate < next) setToDate(next)
            }}
            className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">To date</label>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => {
              const next = e.target.value
              if (fromDate && next && next < fromDate) return
              setToDate(next)
            }}
            className="rounded-md border border-gray-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-600">Event type</label>
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="rounded-md border border-gray-200 px-2 py-1.5 text-sm min-w-[160px]"
          >
            {EVENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value || 'all'} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" size="sm" onClick={handleApplyFilters}>
          Apply
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFromDate('')
            setToDate('')
            setEventTypeFilter('')
            setNextCursor(null)
            setClearThenReload(true)
          }}
        >
          Clear
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportToCsv(events, projectName ?? '')}
          disabled={events.length === 0}
          className="ml-auto"
        >
          <Download className="h-4 w-4 mr-1.5" />
          Export CSV
        </Button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto min-h-0 border border-gray-200 rounded-lg">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading audit log…
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <FolderLock className="h-10 w-10 text-gray-300 mb-2" />
            <p className="text-sm">No audit events found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
              <tr>
                <th className="text-left py-2.5 px-3 font-medium text-gray-700 w-[140px]">Date</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-700 w-[160px]">Event type</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-700 min-w-[120px]">Details</th>
                <th className="text-left py-2.5 px-3 font-medium text-gray-700 w-[200px]">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-gray-50/80">
                  <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                    {formatSmartDateTime(ev.eventAt)}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <EventIcon eventType={ev.eventType} />
                      <span className="font-medium text-gray-900">{eventTypeLabel(ev.eventType)}</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-gray-700 max-w-xs truncate" title={eventDetails(ev)}>
                    {eventDetails(ev) || '—'}
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {ev.actorEmail ?? (ev.actorUserId ? 'User' : 'System')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {nextCursor && !loading && (
          <div className="p-2 border-t border-gray-100 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              disabled={loadingMore}
              onClick={() => load(nextCursor)}
            >
              {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
