"use client"

import Logo, { type OrganizationBranding } from "@/components/Logo"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useViewAs } from "@/lib/view-as-context"
import { supabase } from "@/lib/supabase"
import { Bell, Eye, ChevronDown, Check } from "lucide-react"

// Cache organization branding by slug
const brandingCache = new Map<string, { branding: OrganizationBranding | null; orgId?: string }>()

export function AppTopbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const { viewAsPersonaSlug, setViewAsPersonaSlug, personas, isViewAsActive } = useViewAs()
  const [organizationName, setOrganizationName] = useState<string>('')
  const [branding, setBranding] = useState<OrganizationBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewAsDropdownOpen, setViewAsDropdownOpen] = useState(false)
  const [orgPermissions, setOrgPermissions] = useState<{ canManage?: boolean; isOrgOwner?: boolean } | null>(null)
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const viewAsDropdownRef = useRef<HTMLDivElement>(null)
  const currentSlugRef = useRef<string | null>(null)

  // Extract organization slug from pathname
  const getSlug = () => {
    const match = pathname?.match(/^\/d\/o\/([^/]+)/)
    return match ? match[1] : null
  }
  const slug = getSlug()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (viewAsDropdownRef.current && !viewAsDropdownRef.current.contains(target)) {
        setViewAsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
        if (cached.orgId) {
          setCurrentOrgId(cached.orgId)
          // Fetch permissions for View As dropdown
          fetchOrgPermissions(cached.orgId)
        }
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
          if (org?.id) {
            setCurrentOrgId(org.id)
            fetchOrgPermissions(org.id)
          }
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

  // Fetch organization permissions for View As dropdown
  const fetchOrgPermissions = async (orgId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      
      const permResponse = await fetch(`/api/permissions/organization?orgId=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      })
      if (permResponse.ok) {
        const permData = await permResponse.json()
        setOrgPermissions(permData)
      }
    } catch {
      // Silent fail
    }
  }

  // Check if View As dropdown should be shown
  const canShowViewAsDropdown = !!slug && (orgPermissions?.isOrgOwner === true || orgPermissions?.canManage === true)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <Logo size="xl" branding={branding ?? undefined} />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* View As Dropdown */}
          {canShowViewAsDropdown && (
            <div className="relative" ref={viewAsDropdownRef}>
              <button
                type="button"
                onClick={() => setViewAsDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                <Eye className="h-4 w-4 shrink-0 text-slate-500" />
                <span className="hidden sm:inline">
                  {personas.find((p) => p.slug === (viewAsPersonaSlug ?? 'org_admin'))?.displayName ?? (viewAsPersonaSlug ?? 'org_admin')}
                </span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 ${viewAsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {viewAsDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 py-2 bg-white rounded-xl border border-slate-100 shadow-lg z-50 min-w-[200px] max-h-64 overflow-y-auto">
                  {personas.map((p) => {
                    const selected = (viewAsPersonaSlug ?? 'org_admin') === p.slug
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => {
                          setViewAsPersonaSlug(p.slug === 'org_admin' ? null : p.slug)
                          setViewAsDropdownOpen(false)
                          window.location.reload()
                        }}
                        className={`w-full flex items-center justify-between gap-2 rounded-lg py-2.5 px-3 mx-1 text-left text-sm transition-colors ${selected ? 'bg-slate-100 text-slate-900 font-medium' : 'text-slate-700 hover:bg-slate-50'}`}
                      >
                        <span>{p.displayName}</span>
                        {selected && <Check className="h-4 w-4 shrink-0 text-slate-600" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </div>
    </header>
  )
}
