'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Share2, Users, UserCircle, FileDown, Droplets, Send } from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export interface DocumentShareSettings {
  externalCollaborator: boolean
  guest: boolean
  guestOptions: {
    sharePdfOnly: boolean
    allowDownload: boolean
    addWatermark: boolean
    publish: boolean
  }
}

const defaultSettings: DocumentShareSettings = {
  externalCollaborator: true,
  guest: false,
  guestOptions: {
    sharePdfOnly: true,
    allowDownload: false,
    addWatermark: false,
    publish: false,
  },
}

function parseSettings(settings: unknown): DocumentShareSettings {
  if (!settings || typeof settings !== 'object') return defaultSettings
  const s = settings as Record<string, unknown>
  const guestOpts = (s.guestOptions as Record<string, unknown>) || {}
  return {
    externalCollaborator: s.externalCollaborator !== false,
    guest: s.guest === true,
    guestOptions: {
      sharePdfOnly: guestOpts.sharePdfOnly !== false,
      allowDownload: guestOpts.allowDownload === true,
      addWatermark: guestOpts.addWatermark === true,
      publish: guestOpts.publish === true,
    },
  }
}

export interface DocumentShareModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  document: { id: string; name: string; mimeType?: string }
  projectId: string
  onSaved?: () => void
}

export function DocumentShareModal({
  open,
  onOpenChange,
  document: doc,
  projectId,
  onSaved,
}: DocumentShareModalProps) {
  const { addToast } = useToast()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<DocumentShareSettings>(defaultSettings)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  // When modal opens or document changes: reset to defaults, then load existing share settings
  useEffect(() => {
    if (!open || !projectId) return
    setSettings(defaultSettings)
    setInitialLoadDone(false)
    let cancelled = false
    const load = async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/documents/${encodeURIComponent(doc.id)}/sharing`
        )
        if (cancelled) return
        if (!res.ok) {
          setInitialLoadDone(true)
          return
        }
        const data = await res.json()
        const existing = data?.sharing?.settings
        if (!cancelled) {
          setSettings(parseSettings(existing ?? {}))
        }
      } catch {
        if (!cancelled) setSettings(defaultSettings)
      } finally {
        if (!cancelled) setInitialLoadDone(true)
      }
    }
    load()
    return () => { cancelled = true }
  }, [open, projectId, doc.id])

  useEffect(() => {
    if (!open) setInitialLoadDone(false)
  }, [open])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(
        `/api/projects/${projectId}/documents/${encodeURIComponent(doc.id)}/sharing`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            externalCollaborator: settings.externalCollaborator,
            guest: settings.guest,
            guestOptions: settings.guestOptions,
            title: doc.name,
            mimeType: doc.mimeType || 'application/octet-stream',
          }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || 'Failed to save')
      }
      addToast({ type: 'success', title: 'Saved', message: 'Share settings updated.' })
      onOpenChange(false)
      onSaved?.()
    } catch (e: unknown) {
      addToast({
        type: 'error',
        title: 'Could not save',
        message: e instanceof Error ? e.message : 'Something went wrong.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-4 border-slate-200 p-6">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-600" />
            <DialogTitle className="text-slate-900">Share document</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-500 truncate" title={doc.name}>
            {doc.name}
          </DialogDescription>
        </DialogHeader>

        {!initialLoadDone ? (
          <div className="space-y-5 py-2" aria-busy="true" aria-label="Loading share settings">
            <Skeleton className="h-[72px] w-full rounded-lg" />
            <Skeleton className="h-[72px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* External Collaborator */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Users className="h-5 w-5 text-slate-600 shrink-0" />
                <div>
                  <Label htmlFor="share-ec" className="text-sm font-medium text-slate-900 cursor-pointer">
                    External Collaborator
                  </Label>
                  <p className="text-xs text-slate-500">Document visible in file list for external collaborators</p>
                </div>
              </div>
              <Switch
                id="share-ec"
                checked={settings.externalCollaborator}
                onCheckedChange={(v) => setSettings((s) => ({ ...s, externalCollaborator: v }))}
              />
            </div>

            {/* Guest section: main toggle + Guest options enclosed in one tile */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserCircle className="h-5 w-5 text-slate-600 shrink-0" />
                  <div>
                    <Label htmlFor="share-guest" className="text-sm font-medium text-slate-900 cursor-pointer">
                      Guest
                    </Label>
                    <p className="text-xs text-slate-500">Share with guests; optional PDF-only, download, watermark, publish</p>
                  </div>
                </div>
                <Switch
                  id="share-guest"
                  checked={settings.guest}
                  onCheckedChange={(v) => setSettings((s) => ({ ...s, guest: v }))}
                />
              </div>
              {/* Guest options: always visible, disabled when Guest toggle is off */}
              <div
                className={cn(
                  'border-t border-slate-200 bg-white px-4 py-3 space-y-3',
                  !settings.guest && 'pointer-events-none opacity-60'
                )}
                aria-disabled={!settings.guest}
              >
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Guest options</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="guest-pdf" className={cn('text-sm text-slate-700', settings.guest && 'cursor-pointer')}>Share PDF version only</Label>
                    <Switch
                      id="guest-pdf"
                      checked={settings.guestOptions.sharePdfOnly}
                      disabled={!settings.guest}
                      onCheckedChange={(v) =>
                        setSettings((s) => ({
                          ...s,
                          guestOptions: { ...s.guestOptions, sharePdfOnly: v },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="guest-download" className={cn('text-sm text-slate-700 flex items-center gap-2', settings.guest && 'cursor-pointer')}>
                      <FileDown className="h-4 w-4" /> Allow download
                    </Label>
                    <Switch
                      id="guest-download"
                      checked={settings.guestOptions.allowDownload}
                      disabled={!settings.guest}
                      onCheckedChange={(v) =>
                        setSettings((s) => ({
                          ...s,
                          guestOptions: { ...s.guestOptions, allowDownload: v },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="guest-watermark" className={cn('text-sm text-slate-700 flex items-center gap-2', settings.guest && 'cursor-pointer')}>
                      <Droplets className="h-4 w-4" /> Add watermark (organization name)
                    </Label>
                    <Switch
                      id="guest-watermark"
                      checked={settings.guestOptions.addWatermark}
                      disabled={!settings.guest}
                      onCheckedChange={(v) =>
                        setSettings((s) => ({
                          ...s,
                          guestOptions: { ...s.guestOptions, addWatermark: v },
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="guest-publish" className={cn('text-sm text-slate-700 flex items-center gap-2', settings.guest && 'cursor-pointer')}>
                      <Send className="h-4 w-4" /> Publish
                    </Label>
                    <Switch
                      id="guest-publish"
                      checked={settings.guestOptions.publish}
                      disabled={!settings.guest}
                      onCheckedChange={(v) =>
                        setSettings((s) => ({
                          ...s,
                          guestOptions: { ...s.guestOptions, publish: v },
                        }))
                      }
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  When Publish is on, the document is major-versioned in Google Drive and non-editable for everyone.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !initialLoadDone}
            className="bg-slate-900 text-white hover:bg-black focus-visible:ring-slate-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
