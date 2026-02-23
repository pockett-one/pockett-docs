"use client"

import { useEffect, useState } from 'react'
import { Cloud } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BYTES_PER_GB = 1024 ** 3

function formatGB(bytes: number): string {
  const gb = bytes / BYTES_PER_GB
  return gb % 1 === 0 ? `${gb} GB` : `${gb.toFixed(1)} GB`
}

export interface StorageWidgetProps {
  /** Current organization slug; when not provided, API uses default org. */
  orgSlug?: string | null
  /** When true (e.g. sidebar collapsed), render nothing or a compact placeholder. */
  collapsed?: boolean
  className?: string
}

export function StorageWidget({ orgSlug, collapsed = false, className }: StorageWidgetProps) {
  const { session } = useAuth()
  const [data, setData] = useState<{ usedBytes: number; limitBytes: number | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!session?.access_token) {
      setData(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(false)
    const url = orgSlug
      ? `/api/organization-storage?orgSlug=${encodeURIComponent(orgSlug)}`
      : '/api/organization-storage'
    fetch(url, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load'))))
      .then((json) => setData({ usedBytes: json.usedBytes ?? 0, limitBytes: json.limitBytes ?? null }))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [session?.access_token, orgSlug])

  if (collapsed) return null

  const usedBytes = data?.usedBytes ?? 0
  const limitBytes = data?.limitBytes ?? null
  const ratio = limitBytes != null && limitBytes > 0 ? Math.min(1, usedBytes / limitBytes) : 0

  return (
    <div
      className={cn(
        'rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Cloud className="h-4 w-4 text-slate-600" />
        <span className="text-sm font-medium text-slate-900">Storage</span>
      </div>

      {/* Progress bar: filled green, track slate-100 */}
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: loading || error ? '0%' : `${Math.max(0, ratio) * 100}%` }}
        />
      </div>

      {loading ? (
        <p className="text-xs text-slate-500">Loading…</p>
      ) : error ? (
        <p className="text-xs text-slate-500">Unable to load storage</p>
      ) : limitBytes != null ? (
        <p className="text-xs text-slate-600">
          {formatGB(usedBytes)} of {formatGB(limitBytes)} used
        </p>
      ) : (
        <p className="text-xs text-slate-600">
          {formatGB(usedBytes)} used
        </p>
      )}

      <Button
        variant="default"
        size="sm"
        className="w-full h-8 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800"
        asChild
      >
        <a href="https://one.google.com/storage" target="_blank" rel="noopener noreferrer">
          Get More Storage
        </a>
      </Button>
    </div>
  )
}
