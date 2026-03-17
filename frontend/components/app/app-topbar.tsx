"use client"

import Logo, { type OrganizationBranding } from "@/components/Logo"

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Bell, Bookmark, X } from "lucide-react"

// Cache organization branding by slug (in-memory for session)
const brandingCache = new Map<string, { branding: OrganizationBranding | null; orgId?: string }>()

const SESSION_STORAGE_KEY = (slug: string) => `pockett_org_branding_${slug}`

type NotificationItem = {
  id: string
  createdAt: string
  type: string
  title: string
  body: string | null
  ctaUrl: string | null
  readAt: string | null
}

type BookmarkItem = {
  id: string
  kind: 'document' | 'project' | 'comment' | 'url'
  label?: string
  url: string
  createdAt: string
}

function getBrandingFromSession(slug: string | null): OrganizationBranding | null {
  if (typeof window === 'undefined' || !slug) return null
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY(slug))
    return raw ? (JSON.parse(raw) as OrganizationBranding) : null
  } catch {
    return null
  }
}

function setBrandingInSession(slug: string, branding: OrganizationBranding | null): void {
  if (typeof window === 'undefined' || !slug) return
  try {
    if (branding) sessionStorage.setItem(SESSION_STORAGE_KEY(slug), JSON.stringify(branding))
    else sessionStorage.removeItem(SESSION_STORAGE_KEY(slug))
  } catch {
    // ignore
  }
}

export function AppTopbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [organizationName, setOrganizationName] = useState<string>('')
  const [branding, setBranding] = useState<OrganizationBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const currentSlugRef = useRef<string | null>(null)

  const [showBookmarksDropdown, setShowBookmarksDropdown] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])

  // Hydration guard
  useEffect(() => {
    setMounted(true)
  }, [])

  // Extract organization slug from pathname
  const getSlug = () => {
    const match = pathname?.match(/^\/d\/o\/([^/]+)/)
    return match ? match[1] : null
  }
  const slug = getSlug()

  // Restore branding from sessionStorage before paint to avoid flip on refresh/reload
  useLayoutEffect(() => {
    if (!pathname?.startsWith('/d') || !slug) return
    const cached = getBrandingFromSession(slug)
    if (cached) setBranding(cached)
  }, [pathname, slug])

  // Load organization branding with caching
  useEffect(() => {
    const loadOrganization = async () => {
      // Only show org branding on app routes under /d/ (dashboard)
      if (!pathname?.startsWith('/d')) {
        setBranding(null)
        setLoading(false)
        currentSlugRef.current = null
        return
      }

      if (!user) {
        setLoading(false)
        currentSlugRef.current = null
        return
      }

      // Check cache first - only refetch if slug changed
      if (slug && currentSlugRef.current === slug && brandingCache.has(slug)) {
        const cached = brandingCache.get(slug)!
        setBranding(cached.branding)
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setLoading(false)
          return
        }

        const url = slug
          ? `/api/organization?slug=${encodeURIComponent(slug)}`
          : '/api/organization'
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const org = data.organization || data
          if (org?.name) setOrganizationName(org.name)
          const settings = (org?.settings as Record<string, unknown>) || {}
          const b = (settings.branding as Record<string, string | undefined>) || {}
          // Prefer org-level branding columns (logoUrl, themeColorHex, brandingSubtext), then settings.branding
          const logoUrl = (org?.logoUrl as string) ?? b.logoUrl ?? null
          const themeColor = (org?.themeColorHex as string) ?? b.themeColor ?? b.brandColor ?? null
          const subtext = (org?.brandingSubtext as string) ?? b.subtext ?? null
          const brandingData: OrganizationBranding | null = (logoUrl || themeColor || b.brandColor || org?.name || b.name)
            ? {
              logoUrl: logoUrl ?? null,
              name: org?.name ?? b.name ?? null,
              subtext: subtext ?? null,
              themeColor: themeColor ?? null,
            }
            : null

          setBranding(brandingData)

          // Cache by slug (in-memory + sessionStorage so cache is built on every fetch, including after Org Settings Save)
          if (slug) {
            brandingCache.set(slug, { branding: brandingData, orgId: org?.id })
            currentSlugRef.current = slug
            setBrandingInSession(slug, brandingData)
          }
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()

    const onBrandingUpdated = () => {
      // Clear cache and reload when branding is updated
      if (slug) {
        brandingCache.delete(slug)
        currentSlugRef.current = null
      }
      loadOrganization()
    }
    window.addEventListener('organization-branding-updated', onBrandingUpdated)
    return () => window.removeEventListener('organization-branding-updated', onBrandingUpdated)
  }, [user, pathname, slug])

  const loadNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // ignore
    }
  }, [])

  const loadBookmarks = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/bookmarks', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) return
      const data = await res.json()
      setBookmarks(data.bookmarks ?? [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    loadNotifications()
    loadBookmarks()
    const handleNotificationsUpdate = () => loadNotifications()
    const handleBookmarksUpdate = () => loadBookmarks()
    window.addEventListener('pockett-notifications-updated', handleNotificationsUpdate)
    window.addEventListener('pockett-bookmarks-updated', handleBookmarksUpdate)
    return () => {
      window.removeEventListener('pockett-notifications-updated', handleNotificationsUpdate)
      window.removeEventListener('pockett-bookmarks-updated', handleBookmarksUpdate)
    }
  }, [mounted, loadNotifications, loadBookmarks])

  useEffect(() => {
    if (!mounted) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showBookmarksDropdown && !target.closest('.bookmarks-container')) setShowBookmarksDropdown(false)
      if (showNotificationsDropdown && !target.closest('.notifications-container')) setShowNotificationsDropdown(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mounted, showBookmarksDropdown, showNotificationsDropdown])

  // Prevent flicker during hydration on Safari
  if (!mounted) {
    return <div className="h-full w-full" />
  }

  return (
    <div className="h-full px-2.5 py-2.5 flex items-center justify-between w-full">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <Logo size="xl" branding={branding ?? undefined} />
      </div>

      {/* Right: Bookmarks + Alerts */}
      <div className="flex items-center gap-1.5">
        <div className="relative bookmarks-container">
          <button
            type="button"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Bookmarks"
            onClick={() => setShowBookmarksDropdown((v) => !v)}
          >
            <Bookmark className="h-5 w-5" />
          </button>
          {showBookmarksDropdown ? (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="text-sm font-semibold text-slate-900">Bookmarks</div>
                <div className="text-xs text-slate-500">Your saved links</div>
              </div>
              <div className="p-3 space-y-2 max-h-[380px] overflow-y-auto">
                {bookmarks.length === 0 ? (
                  <div className="text-center py-6">
                    <Bookmark className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No bookmarks</p>
                    <p className="text-xs text-slate-400">Use “Bookmark” on a document to add one.</p>
                  </div>
                ) : (
                  bookmarks.slice(0, 10).map((b) => (
                    <div key={b.id} className="flex items-start gap-2 p-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                      <button
                        type="button"
                        className="flex-1 min-w-0 text-left"
                        onClick={() => {
                          setShowBookmarksDropdown(false)
                          window.location.href = b.url
                        }}
                      >
                        <p className="text-sm font-medium text-slate-900 truncate">{b.label || b.url}</p>
                        <p className="text-xs text-slate-500 truncate">{b.url}</p>
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                        title="Remove"
                        onClick={async () => {
                          try {
                            const { data: { session } } = await supabase.auth.getSession()
                            if (session?.access_token) {
                              await fetch('/api/bookmarks', {
                                method: 'DELETE',
                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                                body: JSON.stringify({ id: b.id }),
                              })
                              loadBookmarks()
                            }
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative notifications-container">
          <button
            type="button"
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
            aria-label="Notifications"
            onClick={() => setShowNotificationsDropdown((v) => !v)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-semibold rounded-full border-2 border-white flex items-center justify-center">
                {unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-slate-300 rounded-full border-2 border-white" />
            )}
          </button>
          {showNotificationsDropdown ? (
            <div className="absolute right-0 top-full mt-2 w-[360px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="text-sm font-semibold text-slate-900">Notifications</div>
                <div className="text-xs text-slate-500">Recent alerts</div>
              </div>
              <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">No notifications</p>
                    <p className="text-xs text-slate-400">Set due dates on projects/documents to see alerts here.</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        n.readAt ? 'bg-slate-50 border-slate-200' : 'bg-red-50 border-red-200 hover:bg-red-100/60'
                      }`}
                      onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession()
                          if (session?.access_token) {
                            await fetch('/api/notifications', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                              body: JSON.stringify({ ids: [n.id] }),
                            })
                            loadNotifications()
                          }
                        } catch {
                          // ignore
                        }
                        if (n.ctaUrl) window.location.href = n.ctaUrl
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900">{n.title}</p>
                          {n.body ? <p className="text-xs text-slate-600 mt-1">{n.body}</p> : null}
                          <p className="text-xs text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                        {!n.readAt ? <span className="mt-1 h-2 w-2 rounded-full bg-red-500 shrink-0" /> : null}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
