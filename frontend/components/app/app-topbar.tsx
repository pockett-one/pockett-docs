"use client"

import Logo, { type OrganizationBranding } from "@/components/Logo"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Bell } from "lucide-react"

// Cache organization branding by slug
const brandingCache = new Map<string, { branding: OrganizationBranding | null; orgId?: string }>()

export function AppTopbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [organizationName, setOrganizationName] = useState<string>('')
  const [branding, setBranding] = useState<OrganizationBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const currentSlugRef = useRef<string | null>(null)

  // Extract organization slug from pathname
  const getSlug = () => {
    const match = pathname?.match(/^\/d\/o\/([^/]+)/)
    return match ? match[1] : null
  }
  const slug = getSlug()

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
          
          // Cache by slug
          if (slug) {
            brandingCache.set(slug, { branding: brandingData, orgId: org?.id })
            currentSlugRef.current = slug
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

  return (
    <div className="h-full px-4 flex items-center justify-between w-full">
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
