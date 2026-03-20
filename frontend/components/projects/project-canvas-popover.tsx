'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, PenTool, Save, Shield, ShieldOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type CanvasState = {
  content: string
  allowExternal: boolean
  updatedAt: string
}

export function ProjectCanvasPopover({
  projectId,
  canManage,
}: {
  projectId: string
  canManage: boolean
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<CanvasState | null>(null)
  const [draft, setDraft] = useState('')
  const saveTimer = useRef<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/projects/${projectId}/canvas`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to load canvas')
      }
      const data = await res.json()
      const next: CanvasState = {
        content: data.content ?? '',
        allowExternal: Boolean(data.allowExternal),
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      }
      setState(next)
      setDraft(next.content)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load canvas')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const flushSave = useCallback(
    async (nextContent: string, nextAllowExternal?: boolean) => {
      if (!state) return
      setSaving(true)
      setError(null)
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: nextContent,
            allowExternal: typeof nextAllowExternal === 'boolean' ? nextAllowExternal : state.allowExternal,
            expectedUpdatedAt: state.updatedAt,
          }),
        })
        if (res.status === 409) {
          const data = await res.json().catch(() => ({}))
          // Refresh on conflict, but keep user draft visible; they can copy/paste if needed.
          await load()
          setError(`Canvas changed elsewhere. Reloaded latest.`)
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to save canvas')
        }
        const data = await res.json()
        setState({
          content: data.content ?? nextContent,
          allowExternal: Boolean(data.allowExternal),
          updatedAt: data.updatedAt ?? new Date().toISOString(),
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save canvas')
      } finally {
        setSaving(false)
      }
    },
    [projectId, state, load]
  )

  useEffect(() => {
    if (!open) return
    load()
  }, [open, load])

  // Autosave content changes
  useEffect(() => {
    if (!open) return
    if (!state) return
    if (draft === state.content) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      flushSave(draft)
    }, 800)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [open, state, draft, flushSave])

  const accessLabel = useMemo(() => {
    if (!state) return 'Engagement members'
    return state.allowExternal ? 'All engagement members' : 'Internal only'
  }, [state])

  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
        title="Project Canvas"
      >
        <PenTool className="h-4 w-4 text-indigo-600" />
        Canvas
      </button>

      {open ? (
        <div className="absolute right-0 top-full mt-2 w-[520px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Engagement Canvas</div>
                <div className="text-xs text-slate-600">Engagement-scoped scratchpad (autosaves).</div>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                {saving ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <Save className="h-3 w-3" />
                    Saved
                  </span>
                )}
                <button
                  type="button"
                  className="text-[11px] font-semibold text-slate-700 hover:text-slate-900"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500">
                Access: <span className="font-semibold text-slate-700">{accessLabel}</span>
              </div>
              {canManage && state ? (
                <button
                  type="button"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-semibold',
                    state.allowExternal
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/70'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  )}
                  onClick={() => {
                    const next = !state.allowExternal
                    setState({ ...state, allowExternal: next })
                    flushSave(draft, next)
                  }}
                  title="Toggle External Collaborator/Guest access"
                >
                  {state.allowExternal ? <Shield className="h-3.5 w-3.5" /> : <ShieldOff className="h-3.5 w-3.5" />}
                  {state.allowExternal ? 'External allowed' : 'Internal only'}
                </button>
              ) : null}
            </div>
          </div>

          {error ? (
            <div className="px-4 py-2 text-xs text-rose-700 bg-rose-50 border-b border-rose-100">{error}</div>
          ) : null}

          <div className="p-3">
            {loading ? (
              <div className="py-10 text-center text-sm text-slate-500">Loading…</div>
            ) : (
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Notes, links, decisions, next steps…"
                rows={12}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 resize-none"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

