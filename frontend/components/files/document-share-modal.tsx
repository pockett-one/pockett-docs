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
import { parseSettingsFromDb } from '@/lib/sharing-settings'
import { useProjectPersonaLabels } from '@/lib/hooks/use-project-persona-labels'

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
  externalCollaborator: false,
  guest: false,
  guestOptions: {
    sharePdfOnly: false,
    allowDownload: false,
    addWatermark: false,
    publish: false,
  },
}

function parseSettings(settings: unknown): DocumentShareSettings {
  if (!settings || typeof settings !== 'object') return defaultSettings
  const parsed = parseSettingsFromDb(settings)
  const share = parsed.share
  if (!share) return defaultSettings
  return {
    externalCollaborator: share.externalCollaborator?.enabled !== false,
    guest: share.guest?.enabled === true,
    guestOptions: {
      sharePdfOnly: share.guest?.options?.sharePdfOnly !== false,
      allowDownload: share.guest?.options?.allowDownload === true,
      addWatermark: share.guest?.options?.addWatermark === true,
      publish: share.guest?.options?.publish === true,
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
  const { projExtCollaborator, projViewer } = useProjectPersonaLabels()
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<DocumentShareSettings>(defaultSettings)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [initialSettings, setInitialSettings] = useState<DocumentShareSettings>(defaultSettings)

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
          if (!cancelled) {
            setInitialSettings(defaultSettings)
            setInitialLoadDone(true)
          }
          return
        }
        const data = await res.json()
        const hasExistingShare = data?.sharing != null
        if (!cancelled) {
          if (hasExistingShare) {
            const parsed = parseSettings(data.sharing.settings ?? {})
            setSettings(parsed)
            setInitialSettings(parsed)
          } else {
            setSettings(defaultSettings)
            setInitialSettings(defaultSettings)
          }
        }
      } catch {
        if (!cancelled) {
          setSettings(defaultSettings)
          setInitialSettings(defaultSettings)
        }
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

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)

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
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* External Collaborator (platform.personas.proj_ext_collaborator) */}
            <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <Users className="h-5 w-5 text-slate-600 shrink-0" />
                <div>
                  <Label htmlFor="share-ec" className="text-sm font-medium text-slate-900 cursor-pointer">
                    {projExtCollaborator}
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

            {/* Guest (platform.personas.proj_viewer): main toggle + options enclosed in one tile */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <UserCircle className="h-5 w-5 text-slate-600 shrink-0" />
                  <div>
                    <Label htmlFor="share-guest" className="text-sm font-medium text-slate-900 cursor-pointer">
                      {projViewer}
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
              {/* Guest options: collapsed until Guest toggle is on; expand with transition */}
              <div
                className="grid transition-[grid-template-rows] duration-200 ease-out"
                style={{ gridTemplateRows: settings.guest ? '1fr' : '0fr' }}
                aria-hidden={!settings.guest}
              >
                <div className="min-h-0 overflow-hidden border-t border-slate-200">
                  <div className="bg-white px-4 py-3 space-y-3">
                    <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">{projViewer} options</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="guest-pdf" className="text-sm text-slate-700 cursor-pointer">Share PDF version only</Label>
                        <Switch
                          id="guest-pdf"
                          checked={settings.guestOptions.sharePdfOnly}
                          onCheckedChange={(v) =>
                            setSettings((s) => ({
                              ...s,
                              guestOptions: { ...s.guestOptions, sharePdfOnly: v },
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="guest-download" className="text-sm text-slate-700 flex items-center gap-2 cursor-pointer">
                          <FileDown className="h-4 w-4" /> Allow download
                        </Label>
                        <Switch
                          id="guest-download"
                          checked={settings.guestOptions.allowDownload}
                          onCheckedChange={(v) =>
                            setSettings((s) => ({
                              ...s,
                              guestOptions: { ...s.guestOptions, allowDownload: v },
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="guest-watermark" className="text-sm text-slate-700 flex items-center gap-2 cursor-pointer">
                          <Droplets className="h-4 w-4" /> Add watermark (organization name)
                        </Label>
                        <Switch
                          id="guest-watermark"
                          checked={settings.guestOptions.addWatermark}
                          onCheckedChange={(v) =>
                            setSettings((s) => ({
                              ...s,
                              guestOptions: { ...s.guestOptions, addWatermark: v },
                            }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Label htmlFor="guest-publish" className="text-sm text-slate-700 flex items-center gap-2 cursor-pointer">
                          <Send className="h-4 w-4" /> Finalize &amp; Lock
                        </Label>
                        <Switch
                          id="guest-publish"
                          checked={settings.guestOptions.publish}
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
                      When Finalize is ON, the document is major-versioned in Google Drive and non-editable for everyone.
                    </p>
                  </div>
                </div>
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
            disabled={saving || !initialLoadDone || !hasChanges}
            className="bg-slate-900 text-white hover:bg-black focus-visible:ring-slate-400"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
