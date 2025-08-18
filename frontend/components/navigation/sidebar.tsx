"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getUserData, clearAuthSession, getDefaultUserData, type UserData } from "@/lib/auth-utils"
import { 
  FolderOpen, 
  Settings, 
  BarChart3, 
  Users, 
  Share2, 
  Plus,
  ChevronDown,
  User,
  CheckCircle,
  AlertCircle,
  Plug,
  LogOut,
  UserCircle,
  Building2
} from "lucide-react"

interface Connection {
  id: string
  name: string
  status: 'connected' | 'error' | 'disconnected'
  icon: string
  color: string
  documentCount?: number
}

const connections: Connection[] = [
  {
    id: "google-drive",
    name: "Google Drive",
    status: "connected",
    icon: "G",
    color: "bg-blue-600",
    documentCount: 1247
  },
  {
    id: "box",
    name: "Box",
    status: "disconnected", 
    icon: "B",
    color: "bg-blue-700"
  },
  {
    id: "dropbox",
    name: "Dropbox",
    status: "disconnected",
    icon: "D", 
    color: "bg-blue-500"
  }
]

const navigationItems = [
  {
    href: "/dashboard/documents",
    label: "Documents",
    icon: FolderOpen,
    description: "Browse and manage your documents"
  },
  {
    href: "/dashboard/engagement", 
    label: "Engagement",
    icon: BarChart3,
    description: "View document activity and analytics"
  },
  {
    href: "/dashboard/shared",
    label: "Shared",
    icon: Share2,
    description: "Manage shared documents and permissions"
  },
  {
    href: "/dashboard/contributors",
    label: "Contributors", 
    icon: Users,
    description: "View team collaboration insights"
  },
  {
    href: "/dashboard/connectors",
    label: "Connectors",
    icon: Settings,
    description: "Manage your document connections"
  }
]

export function Sidebar() {
  const [connectionsExpanded, setConnectionsExpanded] = useState(true)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)
  const [currentUrl, setCurrentUrl] = useState('')
  const profileRef = useRef<HTMLDivElement>(null)

  // Update current URL and listen for changes
  useEffect(() => {
    const updateUrl = () => {
      if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.pathname + window.location.search)
      }
    }
    
    updateUrl() // Set initial URL
    
    // Listen for navigation changes
    window.addEventListener('popstate', updateUrl)
    
    return () => {
      window.removeEventListener('popstate', updateUrl)
    }
  }, [])

  // Load user data from localStorage on component mount
  useEffect(() => {
    const loadUserData = () => {
      try {
        const storedUserData = getUserData()
        setUserData(storedUserData || getDefaultUserData())
      } catch (error) {
        console.error('Error loading user data:', error)
        setUserData(getDefaultUserData())
      } finally {
        setIsLoadingUserData(false)
      }
    }

    // Small delay to prevent flash of loading state
    const timer = setTimeout(loadUserData, 100)
    return () => clearTimeout(timer)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const getConnectionStatusIcon = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'disconnected':
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getConnectionStatusText = (status: Connection['status']) => {
    switch (status) {
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Error'
      case 'disconnected':
        return 'Not connected'
    }
  }

  const handleLogout = () => {
    // Clear only the authentication session, keep user profile data for returning users
    clearAuthSession()
    console.log('Logging out... (keeping user profile for returning user)')
    // Redirect to landing page
    window.location.href = "/"
  }

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen)
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FolderOpen className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-semibold text-gray-900">Pockett</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Navigation
          </div>
          
          {navigationItems.map((item) => {
            // Simple matching with trailing slash normalization
            let isActive = false
            
            // Remove trailing slash from both for comparison
            const normalizeUrl = (url: string) => url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url
            const normalizedCurrentUrl = normalizeUrl(currentUrl)
            const normalizedHref = normalizeUrl(item.href)
            
            isActive = normalizedCurrentUrl === normalizedHref
            
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Connections Section */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => setConnectionsExpanded(!connectionsExpanded)}
            className="flex items-center justify-between w-full text-xs font-medium text-gray-500 uppercase tracking-wide mb-3 hover:text-gray-700"
          >
            <span>Connections</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${connectionsExpanded ? 'rotate-180' : ''}`} />
          </button>
          
          {connectionsExpanded && (
            <div className="space-y-2">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${connection.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                      {connection.icon}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                      <div className="flex items-center space-x-1">
                        {getConnectionStatusIcon(connection.status)}
                        <span className="text-xs text-gray-500">
                          {getConnectionStatusText(connection.status)}
                        </span>
                      </div>
                      {connection.documentCount && (
                        <div className="text-xs text-gray-500">
                          {connection.documentCount.toLocaleString()} documents
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              <Link href="/dashboard/connectors">
                <Button variant="outline" size="sm" className="w-full mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Connection
                </Button>
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* User Profile */}
      <div ref={profileRef} className="p-4 border-t border-gray-200 relative">
        {isLoadingUserData ? (
          <div className="flex items-center space-x-3 p-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <div className="h-4 bg-gray-300 rounded animate-pulse mb-1"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        ) : (
          <button
            onClick={toggleProfileDropdown}
            className="flex items-center space-x-3 w-full hover:bg-gray-50 rounded-lg p-2 transition-colors"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              {userData?.initials || "??"}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-medium text-gray-900 truncate">
                {userData?.firstName} {userData?.lastName}
              </div>
              <div className="text-xs text-gray-500 truncate">{userData?.email}</div>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        )}

        {/* Profile Dropdown */}
        {profileDropdownOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-0 max-w-xs">
            {/* Profile Header */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-lg flex-shrink-0">
                  {userData?.initials || "??"}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="text-sm font-medium text-gray-900 break-words">
                    {userData?.firstName} {userData?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 flex items-start">
                    <UserCircle className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="break-all leading-tight">{userData?.email}</span>
                  </div>
                  <div className="text-xs text-gray-500 flex items-start">
                    <Building2 className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="break-words leading-tight">{userData?.organization}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Actions */}
            <div className="p-2">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
