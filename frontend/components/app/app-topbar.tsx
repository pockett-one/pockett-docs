"use client"

import Logo, { type OrganizationBranding } from "@/components/Logo"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Bell } from "lucide-react"

// Cache organization branding by slug (in-memory for session)
const brandingCache = new Map<string, { branding: OrganizationBranding | null; orgId?: string }>()

const SESSION_STORAGE_KEY = (slug: string) => `pockett_org_branding_${slug}`

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

  // Prevent flicker during hydration on Safari
  if (!mounted) {
    return <div className="h-full w-full" />
  }

  return (
    <div className="h-full px-3 flex items-center justify-between w-full">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <Logo size="xl" branding={branding ?? undefined} />
      </div>

      {/* Right: Alerts */}
      <div className="flex items-center gap-2">
        <button type="button" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative" aria-label="Alerts">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
        </button>
      </div>
    </div>
  )
}
