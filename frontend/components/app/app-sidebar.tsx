"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import Logo from "@/components/Logo"
import { Button } from "@/components/ui/button"
import {
  LogOut,
  Settings,
  User,
  ChevronDown,
  Menu,
  ChevronLeft,
  LayoutDashboard
} from "lucide-react"

export function AppSidebar() {
  const { user, signOut } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      // Force redirect to landing page
      window.location.href = '/'
    } catch (error) {
      console.error('Sign out error:', error)
      // Even if there's an error, redirect to landing page
      window.location.href = '/'
    }
  }

  // Extract user details from Google profile
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  const getUserEmail = () => {
    return user?.email || 'user@example.com'
  }

  const getUserInitials = () => {
    const name = getUserDisplayName()
    if (name.includes('@')) {
      // If it's an email, use first letter
      return name.charAt(0).toUpperCase()
    }
    // If it's a full name, use first letters of first and last name
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
    }
    return name.charAt(0).toUpperCase()
  }

  const getUserAvatar = () => {
    return user?.user_metadata?.avatar_url || user?.user_metadata?.picture
  }

  const navigation = [
    {
      name: 'Insights',
      href: '/dash/insights',
      icon: LayoutDashboard,
      current: pathname === '/dash/insights'
    },
    {
      name: 'Connectors',
      href: '/dash/connectors',
      icon: Settings,
      current: pathname === '/dash/connectors'
    }
  ]

  return (
    <div className={`fixed inset-y-0 left-0 z-40 bg-white border-r border-slate-200 transition-all duration-300 pt-16 ${isCollapsed ? 'w-16' : 'w-64'
      }`}>
      <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
        {/* Section Header */}
        {!isCollapsed && (
          <div className="px-6 pt-8 pb-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Docs Dashboard</h3>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 mt-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center text-sm font-medium rounded-lg transition-colors px-3 py-2 ${item.current
                  ? 'bg-slate-100 text-slate-900'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                title={isCollapsed ? item.name : undefined}
              >
                <Icon className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${item.current ? 'text-slate-900' : 'text-slate-500'}`} />
                {!isCollapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Section */}
        {!isCollapsed && (
          <div className="p-4 mt-auto border-t border-slate-100" ref={profileRef}>
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 w-full p-2 rounded-xl hover:bg-slate-50 transition-colors text-left"
              >
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full text-white flex items-center justify-center text-sm font-medium shadow-sm border border-white ring-2 ring-slate-100 flex-shrink-0">
                  {getUserInitials()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {getUserEmail()}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-lg border border-slate-200 py-1 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <button
                    onClick={() => signOut()}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
