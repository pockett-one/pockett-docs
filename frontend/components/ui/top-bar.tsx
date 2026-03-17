"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Bookmark, 
  Bell, 
  X,
  HelpCircle,
  AlertTriangle,
  CheckCircle
} from "lucide-react"
import SearchDropdown, { SearchResult } from "./search-dropdown"
import { supabase } from "@/lib/supabase"

type NotificationItem = {
  id: string
  createdAt: string
  type: string
  title: string
  body: string | null
  ctaUrl: string | null
  readAt: string | null
}

type BookmarkItem = {
  id: string
  kind: 'document' | 'project' | 'comment' | 'url'
  label?: string
  url: string
  createdAt: string
}

interface TopBarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
  // New props for local search
  searchableData?: any[]
  searchFields?: string[]
  onLocalResults?: (results: any[], query: string) => void
  enableLocalSearch?: boolean
  placeholder?: string
  showGlobalSearchOption?: boolean
  // Tour functionality props
  onStartTour?: () => void
  showTourButton?: boolean
  tourButtonText?: string
  // Semantic search indicator
  isSemanticReady?: boolean
}

export function TopBar({ 
  searchQuery = "", 
  onSearchChange,
  searchableData = [],
  searchFields = ['name'],
  onLocalResults,
  enableLocalSearch = false,
  placeholder = "Search documents...",
  showGlobalSearchOption = true,
  onStartTour,
  showTourButton = false,
  tourButtonText = "Take Tour",
  isSemanticReady = false
}: TopBarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [showGlobalSearchPrompt, setShowGlobalSearchPrompt] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [allSearchResults, setAllSearchResults] = useState<SearchResult[]>([])
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showBookmarksDropdown, setShowBookmarksDropdown] = useState(false)
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([])
  const router = useRouter()

  // Ensure client-side rendering for dynamic search functionality
  useEffect(() => {
    setIsClient(true)
  }, [])


  const loadNotifications = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!isClient) return
    loadNotifications()
    const handleUpdate = () => loadNotifications()
    window.addEventListener('pockett-notifications-updated', handleUpdate)
    return () => window.removeEventListener('pockett-notifications-updated', handleUpdate)
  }, [isClient, loadNotifications])

  const loadBookmarks = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const res = await fetch('/api/bookmarks', { headers: { Authorization: `Bearer ${session.access_token}` } })
      if (!res.ok) return
      const data = await res.json()
      setBookmarks(data.bookmarks ?? [])
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!isClient) return
    loadBookmarks()
    const handleUpdate = () => loadBookmarks()
    window.addEventListener('pockett-bookmarks-updated', handleUpdate)
    return () => window.removeEventListener('pockett-bookmarks-updated', handleUpdate)
  }, [isClient, loadBookmarks])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Handle escape key to close search dropdown
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSearchDropdown) {
        setShowSearchDropdown(false)
      }
    }

    if (isClient) {
      document.addEventListener('keydown', handleEscapeKey)
      return () => document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [showSearchDropdown, isClient])

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showSearchDropdown && !target.closest('.search-container')) {
        setShowSearchDropdown(false)
      }
      if (showBookmarksDropdown && !target.closest('.bookmarks-container')) {
        setShowBookmarksDropdown(false)
      }
      if (showNotificationsDropdown && !target.closest('.notifications-container')) {
        setShowNotificationsDropdown(false)
      }
    }

    if (isClient) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchDropdown, showBookmarksDropdown, showNotificationsDropdown, isClient])

  // Simple name-based search filter
  const debouncedSearch = useCallback((query: string) => {
    if (query.trim().length >= 2 && enableLocalSearch && searchableData.length > 0) {
      setIsSearching(true)
      
      // Simple name filter - no ML, just basic string matching
      const queryLower = query.trim().toLowerCase()
      const filtered = searchableData
        .filter(item => {
          const name = (item.name || item.title || '').toLowerCase()
          return name.includes(queryLower)
        })
        .slice(0, 20) // Limit results
      
      const searchResults: SearchResult[] = filtered.map(item => ({
        id: item.id || item.name,
        type: item.type || 'document',
        name: item.name || item.title || 'Untitled',
        matchedFields: ['name'],
        highlights: [{
          field: 'name',
          value: item.name || item.title || 'Untitled',
          indices: []
        }],
        metadata: item
      }))
      
      setAllSearchResults(searchResults)
      setSearchResults(searchResults.slice(0, 8))
      setShowSearchDropdown(true)
      setShowGlobalSearchPrompt(false)
      setIsSearching(false)
    } else if (query.trim().length < 2) {
      setSearchResults([])
      setAllSearchResults([])
      setShowSearchDropdown(false)
      setIsSearching(false)
    }
  }, [searchableData, enableLocalSearch])

  const handleShowMore = useCallback(() => {
    const currentCount = searchResults.length
    const nextBatch = allSearchResults.slice(0, currentCount + 10)
    setSearchResults(nextBatch)
  }, [searchResults.length, allSearchResults])

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
    onSearchChange?.(value)
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Handle local search if enabled and we're on the client
    if (isClient && enableLocalSearch && searchableData.length > 0) {
      if (value.trim().length >= 4) {
        // Debounce search to prevent hanging - only search on meaningful queries
        const timeout = setTimeout(() => {
          debouncedSearch(value)
        }, 300) // Wait 300ms after user stops typing - much faster now
        
        setSearchTimeout(timeout)
      } else if (value.trim().length >= 2) {
        // Show typing indicator for short queries
        setShowGlobalSearchPrompt(true)
      } else if (value.trim().length === 0) {
        // Clear search results immediately
        setSearchResults([])
        setAllSearchResults([])
        setShowSearchDropdown(false)
        setShowGlobalSearchPrompt(false)
        setIsSearching(false) // Clear loading state
      } else if (value.trim().length === 1) {
        // Show global search prompt for single character
        setShowGlobalSearchPrompt(true)
      }
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localSearchQuery.trim() && isClient) {
      // If local search is enabled and we have results, stay on page
      if (enableLocalSearch && onLocalResults && searchableData.length > 0) {
        // Local search is already handled in handleSearchChange
        return
      }
      
      // Otherwise, navigate to documents page with search query
      router.push(`/demo/documents?search=${encodeURIComponent(localSearchQuery.trim())}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && localSearchQuery.trim() && isClient) {
      // If local search is enabled and we have results, stay on page
      if (enableLocalSearch && onLocalResults && searchableData.length > 0) {
        // Local search is already handled in handleSearchChange
        return
      }
      
      // Otherwise, navigate to documents page with search query
      router.push(`/demo/documents?search=${encodeURIComponent(localSearchQuery.trim())}`)
    }
  }

  const handleGlobalSearch = () => {
    if (localSearchQuery.trim()) {
      router.push(`/demo/documents?search=${encodeURIComponent(localSearchQuery.trim())}`)
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-2 shadow-sm" data-top-bar>
      <div className="flex items-center justify-between">
        {/* Left side - Search */}
        <div className="flex-1 max-w-md">
          <div className="search-container relative">
            <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={placeholder}
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-12 h-8 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
            />
            {/* Loading indicator */}
            {isSearching && (
              <div className="absolute left-10 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              </div>
            )}
            {/* Search mode indicator */}
            {isSemanticReady ? (
              <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="AI-powered semantic search ready"></div>
              </div>
            ) : (
              <div className="absolute right-20 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-2 bg-blue-500 rounded-full" title="Enhanced fallback search active"></div>
              </div>
            )}
            {localSearchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
              <button
                type="submit"
                className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-blue-600 transition-colors"
                title="Search documents"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>
          
          {/* Global Search Prompt */}
          {isClient && showGlobalSearchPrompt && showGlobalSearchOption && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-blue-50 border border-blue-200 rounded-md p-2 text-xs text-blue-700">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    `Type ${4 - localSearchQuery.trim().length} more characters to search`
                  )}
                </span>
                <button
                  onClick={handleGlobalSearch}
                  className="text-blue-600 hover:text-blue-800 font-medium underline"
                >
                  Search All
                </button>
              </div>
            </div>
          )}

          {/* Search Dropdown */}
          <SearchDropdown
            isOpen={showSearchDropdown}
            searchQuery={localSearchQuery}
            results={searchResults}
            totalResults={allSearchResults.length}
            onSelectResult={(result) => {
              // Handle navigation based on result type
              if (result.type === 'document') {
                router.push(`/demo/documents?search=${encodeURIComponent(result.name)}`)
              } else if (result.type === 'insight' || result.type === 'insight_card') {
                router.push(`/demo/insights`)
              } else if (result.type === 'folder') {
                router.push(`/demo/documents?folder=${encodeURIComponent(result.name)}`)
              } else {
                router.push(`/demo/documents?search=${encodeURIComponent(result.name)}`)
              }
            }}
            onClose={() => setShowSearchDropdown(false)}
            onShowMore={handleShowMore}
          />
          </div>
        </div>

        {/* Right side - Quick Actions */}
        <div className="flex items-center space-x-2">
          {/* Bookmarks Dropdown */}
          <div className="relative bookmarks-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarksDropdown(!showBookmarksDropdown)}
              className="h-7 px-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              title="Bookmarks"
            >
              <Bookmark className="h-4 w-4 mr-2" />
              <span className="text-sm">Bookmarks</span>
            </Button>

            {showBookmarksDropdown && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <h3 className="text-sm font-semibold text-gray-900">Bookmarks</h3>
                  <p className="text-xs text-gray-500">Your saved links</p>
                </div>
                <div className="p-3 space-y-2 max-h-[360px] overflow-y-auto">
                  {bookmarks.length === 0 ? (
                    <div className="text-center py-6">
                      <Bookmark className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No bookmarks</p>
                      <p className="text-xs text-gray-400">Use “Bookmark” on a document to add one.</p>
                    </div>
                  ) : (
                    bookmarks.slice(0, 10).map((b) => (
                      <div key={b.id} className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50">
                        <button
                          type="button"
                          className="flex-1 min-w-0 text-left"
                          onClick={() => {
                            setShowBookmarksDropdown(false)
                            router.push(b.url)
                          }}
                        >
                          <p className="text-sm font-medium text-gray-900 truncate">{b.label || b.url}</p>
                          <p className="text-xs text-gray-500 truncate">{b.url}</p>
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="Remove"
                          onClick={async () => {
                            try {
                              const { data: { session } } = await supabase.auth.getSession()
                              if (session?.access_token) {
                                await fetch('/api/bookmarks', {
                                  method: 'DELETE',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                                  body: JSON.stringify({ id: b.id }),
                                })
                                loadBookmarks()
                              }
                            } catch {
                              // ignore
                            }
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>



          {/* Notifications Dropdown */}
          <div className="relative notifications-container">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
              className="h-7 px-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50 relative"
              title="Notifications"
            >
              <Bell className="h-4 w-4 mr-2" />
              <span className="text-sm">Notifications</span>
              {/* Notification Count Badge */}
              {unreadCount > 0 && (
                <div className="ml-2 w-4 h-4 bg-orange-400 text-white text-xs font-medium rounded-full flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </Button>
            
            {/* Notifications Dropdown Menu */}
            {showNotificationsDropdown && (
              <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                  <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  <p className="text-xs text-gray-500">Recent alerts</p>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center space-x-3 mb-4 p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-800 uppercase tracking-wide">Alerts</span>
                    <div className="ml-auto text-xs text-orange-600 font-medium">{notifications.length} items</div>
                  </div>
                  <div className="space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-4">
                        <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No notifications</p>
                        <p className="text-xs text-gray-400">Set due dates on projects/documents to see alerts here</p>
                      </div>
                    ) : (
                      notifications.slice(0, 8).map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            n.readAt ? 'bg-gray-50 border-gray-200' : 'bg-orange-50 border-orange-200 hover:bg-orange-100/60'
                          }`}
                          onClick={async () => {
                            try {
                              const { data: { session } } = await supabase.auth.getSession()
                              if (session?.access_token) {
                                await fetch('/api/notifications', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
                                  body: JSON.stringify({ ids: [n.id] }),
                                })
                                loadNotifications()
                              }
                            } catch {
                              // ignore
                            }
                            if (n.ctaUrl) router.push(n.ctaUrl)
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{n.title}</p>
                              {n.body && <p className="text-xs text-gray-600 mt-1">{n.body}</p>}
                              <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                            {!n.readAt && <span className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                

              </div>
            )}
          </div>

          {/* Take Tour Button */}
          {showTourButton && onStartTour && (
            <Button
              variant="default"
              size="sm"
              onClick={onStartTour}
              className="h-7 px-3 bg-orange-500 hover:bg-orange-600 text-white font-medium shadow-sm hover:shadow-md transition-all duration-200"
              title={tourButtonText}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              <span className="text-sm font-semibold">{tourButtonText}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
