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
  ChevronLeft
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
          <div className="p-4 mt-auto">
            {/* Getting Started Card */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-700">Getting started</span>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">0/3</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-1.5 mb-3">
                <div className="bg-blue-600 h-1.5 rounded-full w-[10%]"></div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="space-y-1">
              <Link href="#" className="flex items-center px-2 py-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <div className="w-4 h-4 mr-3 flex items-center justify-center"><div className="w-3 h-3 border border-slate-400 rounded-sm"></div></div>
                Guide editor
              </Link>
              <Link href="#" className="flex items-center px-2 py-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <div className="w-4 h-4 mr-3 flex items-center justify-center"><div className="w-3 h-3 border border-slate-400 rounded-sm"></div></div>
                Open docs
              </Link>
              <Link href="/" className="flex items-center px-2 py-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors">
                <ChevronLeft className="w-4 h-4 mr-3" />
                Back to home
              </Link>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                onClick={() => signOut()}
                className="flex items-center w-full px-2 py-1.5 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
