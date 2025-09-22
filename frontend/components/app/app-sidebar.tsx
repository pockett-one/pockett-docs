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
    <div className={`fixed inset-y-0 left-0 z-50 bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header with Logo and Toggle */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && <Logo size="sm" />}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100"
          >
            {isCollapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center text-sm font-medium rounded-lg transition-all duration-200 ${
                  isCollapsed 
                    ? 'p-2 justify-center bg-gray-100 hover:bg-gray-200' 
                    : 'px-3 py-2'
                } ${
                  item.current
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.name : undefined}
              >
                {isCollapsed ? (
                  <Icon className="h-7 w-7 text-gray-700" />
                ) : (
                  <>
                    <Icon className="h-5 w-5 mr-3 text-gray-700" />
                    <span>{item.name}</span>
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Profile Section */}
        <div className={`border-t border-gray-200 p-4 ${isCollapsed ? 'flex justify-center' : ''}`}>
          <div className="relative" ref={profileRef}>
            <Button
              variant="ghost"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`p-2 h-auto transition-all duration-200 ${
                isCollapsed ? 'w-auto px-2 justify-center' : 'w-full justify-between'
              }`}
              title={isCollapsed ? getUserDisplayName() : undefined}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  {getUserAvatar() && !imageError ? (
                    <Image
                      src={getUserAvatar()}
                      alt={getUserDisplayName()}
                      width={32}
                      height={32}
                      className="h-8 w-8 rounded-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-600">
                        {getUserInitials()}
                      </span>
                    </div>
                  )}
                </div>
                {!isCollapsed && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {getUserDisplayName()}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {getUserEmail()}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronDown className="h-4 w-4 text-gray-400" />}
            </Button>

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className={`absolute bottom-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 ${
                isCollapsed ? 'left-0 right-0 mb-2' : 'left-0 right-0 mb-2'
              }`}>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className={`h-4 w-4 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                  {!isCollapsed && 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
