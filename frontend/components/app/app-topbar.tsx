"use client"

import { useState, useEffect } from "react"
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
  const [organizationName, setOrganizationName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const loadOrganization = async () => {
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
          const organization = await response.json()
          setOrganizationName(organization.name)
        }
      } catch (error) {
        console.error('Failed to load organization:', error)
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [user])
  
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'ml-16' : 'ml-64'
    }`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left Side - Organization Name */}
          <div className="flex items-center">
            {loading ? (
              <div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>
            ) : (
              <h1 className="text-lg font-semibold text-gray-900">
                {organizationName || 'Loading...'}
              </h1>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Bookmarks */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <Bookmark className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Bookmarks</span>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50 relative"
            >
              <Bell className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Notifications</span>
              {/* Notification Badge */}
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                3
              </span>
            </Button>

            {/* Take Tour */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            >
              <HelpCircle className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Take Tour</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
