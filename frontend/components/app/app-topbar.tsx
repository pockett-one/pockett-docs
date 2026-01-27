"use client"

import Logo from "@/components/Logo"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/lib/sidebar-context"
import { useAuth } from "@/lib/auth-context"
import { createClient } from '@supabase/supabase-js'
import {
  Bookmark,
  Bell,
  HelpCircle
} from "lucide-react"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function AppTopbar() {
  const { isCollapsed } = useSidebar()
  const { user } = useAuth()
  const pathname = usePathname()
  const [organizationName, setOrganizationName] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadOrganization = async () => {
      // Skip fetching organization if we are on the onboarding page
      if (pathname?.startsWith('/onboarding')) {
        setLoading(false)
        return
      }

      if (!user) {
        setLoading(false)
        return
      }

      try {
        // Get Supabase session token
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.access_token) {
          setLoading(false)
          return
        }

        // Get organization
        const response = await fetch('/api/organization', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          const org = data.organization || data
          if (org && org.name) {
            setOrganizationName(org.name)
          }
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [user])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 h-16">
      <div className="h-full px-4 flex items-center justify-between">
        {/* Left Side */}
        <div className="flex items-center gap-3">
          <Logo />
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wide">Free</span>
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
