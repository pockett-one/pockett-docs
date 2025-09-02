"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { getUserData, clearAuthSession, getDefaultUserData, type UserData } from "@/lib/auth-utils"
import { getConnections, type Connection } from "@/lib/connection-utils"
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
  Building2,
  Target,
  MessageSquare,
  Kanban
} from "lucide-react"



// Initialize with empty connections - will be populated from localStorage
const defaultConnections: Connection[] = []

const navigationItems = [
  {
    href: "/demo/insights",
    label: "Insights",
    icon: Target,
    description: "Actionable document insights and recommendations"
  },
  {
    href: "/demo/documents",
    label: "Documents",
    icon: FolderOpen,
    description: "Browse and manage your documents"
  },
  {
    href: "/demo/projects",
    label: "Projects",
    icon: Kanban,
    description: "Manage project workflows and tasks"
  },
  {
    href: "/demo/analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "View document analytics and insights"
  },
  {
    href: "/demo/shared",
    label: "Shared",
    icon: Share2,
    description: "Manage shared documents and permissions"
  },
  {
    href: "/demo/contributors",
    label: "Contributors",
    icon: Users,
    description: "View team collaboration insights"
  },
  // Temporarily hidden - AI chat functionality not ready yet
  // {
  //   href: "/demo/chat",
  //   label: "Chat",
  //   icon: MessageSquare,
  //   description: "Chat with your documents using AI"
  // }
]

export function Sidebar() {
  const router = useRouter()
  const [connectionsExpanded, setConnectionsExpanded] = useState(true)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isLoadingUserData, setIsLoadingUserData] = useState(true)
  const [currentUrl, setCurrentUrl] = useState('')
  const [connections, setConnections] = useState<Connection[]>(defaultConnections)
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigatingTo, setNavigatingTo] = useState<string>('')
  const profileRef = useRef<HTMLDivElement>(null)

  // Sync connections with localStorage and ensure Google Drive is always shown
  useEffect(() => {
    const syncConnections = () => {
      const storedConnections = getConnections()
      
      // Always ensure Google Drive is shown, even if not in localStorage
      const googleDriveConnection = storedConnections.find(conn => conn.id === 'google-drive')
      
      if (!googleDriveConnection) {
        // Add default Google Drive connection if it doesn't exist
        const defaultConnections = [
          {
            id: 'google-drive',
            name: 'Google Drive',
            status: 'disconnected' as const,
            icon: 'google-drive',
            color: 'bg-white',
            documentCount: undefined
          },
          ...storedConnections
        ]
        setConnections(defaultConnections)
      } else {
        setConnections(storedConnections)
      }
    }

    // Initial sync
    syncConnections()

    // Listen for connection updates from other components
    const handleConnectionsUpdate = () => {
      syncConnections()
    }

    window.addEventListener('pockett-connections-updated', handleConnectionsUpdate)
    window.addEventListener('storage', handleConnectionsUpdate)

    return () => {
      window.removeEventListener('pockett-connections-updated', handleConnectionsUpdate)
      window.removeEventListener('storage', handleConnectionsUpdate)
    }
  }, [])

  const getConnectionIcon = (iconType: string) => {
    switch (iconType) {
      case 'google-drive':
        return (
          <svg className="w-5 h-5" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
            <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
            <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
            <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 23.8z" fill="#ea4335"/>
            <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
            <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
            <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
          </svg>
        )
      case 'dropbox':
        return (
          <Image 
            src="/images/brand-logos/dropbox-logo.png" 
            alt="Dropbox" 
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'box':
        return (
          <Image 
            src="/images/brand-logos/box-logo.png" 
            alt="Box" 
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'onedrive':
        return (
          <Image 
            src="/images/brand-logos/onedrive-logo.png" 
            alt="OneDrive" 
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'notion':
        return (
          <Image 
            src="/images/brand-logos/notion-logo.png" 
            alt="Notion" 
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      case 'confluence':
        return (
          <Image 
            src="/images/brand-logos/confluence-logo.png" 
            alt="Confluence" 
            width={20}
            height={20}
            className="w-5 h-5 object-contain"
            onError={() => {
              // Fallback handled by Next.js Image component
            }}
          />
        )
      default:
        return (
          <span className="text-white font-bold text-sm">{iconType}</span>
        )
    }
  }

  // Update current URL and listen for changes
  useEffect(() => {
    const updateUrl = () => {
      if (typeof window !== 'undefined') {
        const newUrl = window.location.pathname + window.location.search
        setCurrentUrl(newUrl)
        // Reset navigation state when URL changes
        setIsNavigating(false)
        setNavigatingTo('')
        console.log('URL updated to:', newUrl)
      }
    }
    
    updateUrl() // Set initial URL
    
    // Listen for navigation changes
    window.addEventListener('popstate', updateUrl)
    
    // Also listen for Next.js router events
    const handleRouteChange = () => {
      updateUrl()
    }
    
    // Add a small delay to ensure the URL has updated
    const routeChangeTimeout = setTimeout(updateUrl, 100)
    
    return () => {
      window.removeEventListener('popstate', updateUrl)
      clearTimeout(routeChangeTimeout)
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

  const handleNavigation = (href: string) => {
    // Prevent navigation to current page to avoid deadlock
    const normalizeUrl = (url: string) => url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url
    const normalizedCurrentUrl = normalizeUrl(currentUrl)
    const normalizedHref = normalizeUrl(href)
    
    console.log('Navigation attempt:', {
      from: normalizedCurrentUrl,
      to: normalizedHref,
      isCurrentPage: normalizedCurrentUrl === normalizedHref
    })
    
    if (normalizedCurrentUrl === normalizedHref) {
      console.log('Already on this page, skipping navigation')
      return
    }
    
    setIsNavigating(true)
    setNavigatingTo(href)
    
    // Add a small delay to show the loading state
    setTimeout(() => {
      router.push(href)
    }, 100)
    
    // Safety timeout to reset navigation state if something goes wrong
    setTimeout(() => {
      if (isNavigating) {
        console.log('Navigation timeout, resetting state')
        setIsNavigating(false)
        setNavigatingTo('')
      }
    }, 5000) // 5 second safety timeout
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* Header */}
      <div className="px-6 py-2 border-b border-gray-200 bg-white shadow-sm">
        <button 
          onClick={() => handleNavigation('/demo/')}
          disabled={isNavigating}
          className="flex items-center space-x-2 hover:opacity-80 transition-opacity cursor-pointer disabled:opacity-75"
        >
          <FolderOpen className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-semibold text-gray-900">Pockett</span>
        </button>
        

      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Navigation
          </div>
          
          {navigationItems.map((item) => {
            // Simple matching with trailing slash normalization
            const normalizeUrl = (url: string) => url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url
            const normalizedCurrentUrl = normalizeUrl(currentUrl)
            const normalizedHref = normalizeUrl(item.href)
            // Check if current URL starts with the navigation item href (for nested routes)
            const isActive = normalizedCurrentUrl === normalizedHref || normalizedCurrentUrl.startsWith(normalizedHref + '/')
            const isNavigatingToThis = isNavigating && navigatingTo === item.href
            
            return (
              <button
                key={item.href}
                onClick={() => handleNavigation(item.href)}
                disabled={isNavigating || isActive}
                title={isActive ? `You are currently on ${item.label}` : `Navigate to ${item.label}`}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full text-left ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200 cursor-default'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                } ${isNavigatingToThis ? 'bg-blue-100 border-blue-300' : ''} ${
                  isNavigating ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : isNavigatingToThis ? 'text-blue-600' : ''}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
                {isNavigatingToThis && !isActive && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </button>
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
                    <div className={`w-8 h-8 ${connection.color} rounded-lg flex items-center justify-center border border-gray-200`}>
                      {getConnectionIcon(connection.icon)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{connection.name}</div>
                      <div className="flex items-center space-x-1">
                        {getConnectionStatusIcon(connection.status)}
                        <span className="text-xs text-gray-500">
                          {getConnectionStatusText(connection.status)}
                        </span>
                      </div>
                      {/* Only show document count when connected */}
                      {connection.status === 'connected' && connection.documentCount && (
                        <div className="text-xs text-gray-500">
                          {connection.documentCount.toLocaleString()} documents
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {(() => {
                const normalizeUrl = (url: string) => url.endsWith('/') && url !== '/' ? url.slice(0, -1) : url
                const isConnectorsActive = normalizeUrl(currentUrl) === normalizeUrl('/demo/connectors')
                
                return (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleNavigation('/demo/connectors')}
                    disabled={isNavigating}
                    className={`w-full mt-2 transition-colors ${
                      isConnectorsActive
                        ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                        : 'hover:bg-gray-50'
                    } ${isNavigating && navigatingTo === '/demo/connectors' ? 'bg-blue-100 border-blue-300' : ''}`}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Connectors
                    {isNavigating && navigatingTo === '/demo/connectors' && (
                      <div className="ml-2 w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </Button>
                )
              })()}
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
