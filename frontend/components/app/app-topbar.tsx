"use client"

import Logo, { type OrganizationBranding } from "@/components/Logo"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { supabase } from "@/lib/supabase"
import { Bell } from "lucide-react"

export function AppTopbar() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [organizationName, setOrganizationName] = useState<string>('')
  const [branding, setBranding] = useState<OrganizationBranding | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrganization = async () => {
      // Only show org branding on app routes under /d/ (dashboard)
      if (!pathname?.startsWith('/d')) {
        setBranding(null)
        setLoading(false)
        return
      }

      if (!user) {
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setLoading(false)
          return
        }

        const slugFromPath = pathname?.match(/^\/d\/o\/([^/]+)/)?.[1] ?? null
        const url = slugFromPath
          ? `/api/organization?slug=${encodeURIComponent(slugFromPath)}`
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
          if (logoUrl || themeColor || b.brandColor || org?.name || b.name)
            setBranding({
              logoUrl: logoUrl ?? null,
              name: org?.name ?? b.name ?? null,
              subtext: subtext ?? null,
              themeColor: themeColor ?? null,
            })
          else
            setBranding(null)
        }
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()

    const onBrandingUpdated = () => loadOrganization()
    window.addEventListener('organization-branding-updated', onBrandingUpdated)
    return () => window.removeEventListener('organization-branding-updated', onBrandingUpdated)
  }, [user, pathname])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <Logo size="lg" branding={branding ?? undefined} />
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>


        </div>
      </div>
    </header>
  )
}
