"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Bookmark, 
  Bell, 
  X
} from "lucide-react"
import SearchDropdown, { SearchResult } from "./search-dropdown"

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
}

export function TopBar({ 
  searchQuery = "", 
  onSearchChange,
  searchableData = [],
  searchFields = ['name'],
  onLocalResults,
  enableLocalSearch = false,
  placeholder = "Search documents...",
  showGlobalSearchOption = true
}: TopBarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const [showGlobalSearchPrompt, setShowGlobalSearchPrompt] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const router = useRouter()

  // Ensure client-side rendering for dynamic search functionality
  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (showSearchDropdown && !target.closest('.search-container')) {
        setShowSearchDropdown(false)
      }
    }

    if (isClient) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showSearchDropdown, isClient])

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
    onSearchChange?.(value)
    
    // Handle local search if enabled and we're on the client
    if (isClient && enableLocalSearch && searchableData.length > 0) {
      if (value.trim().length >= 2) {
        // Perform local search and show modal
        const results = searchableData.filter(item => {
          return searchFields.some(field => {
            const fieldValue = (item as any)[field]
            if (!fieldValue) return false
            
            const fieldStr = String(fieldValue).toLowerCase()
            const searchQuery = value.toLowerCase()
            
            // Special handling for path field - search for folder names within paths
            if (field === 'path' && fieldStr.includes('/')) {
              // Split path by '/' and search in each segment
              const pathSegments = fieldStr.split('/').filter(segment => segment.trim())
              return pathSegments.some(segment => segment.includes(searchQuery))
            }
            
            // Regular includes search for other fields
            return fieldStr.includes(searchQuery)
          })
        })
        
        // Convert to SearchResult format
        const searchResults = results.map(item => ({
          id: item.id || item.name,
          type: item.type || 'document',
          name: item.name || item.title || 'Untitled',
          matchedFields: searchFields.filter(field => {
            const fieldValue = (item as any)[field]
            return fieldValue && String(fieldValue).toLowerCase().includes(value.toLowerCase())
          }),
          highlights: searchFields.map(field => {
            const fieldValue = (item as any)[field]
            if (fieldValue && String(fieldValue).toLowerCase().includes(value.toLowerCase())) {
              return {
                field,
                value: String(fieldValue),
                indices: []
              }
            }
            return null
          }).filter(Boolean) as any[],
          metadata: item
        }))
        
        setSearchResults(searchResults)
        setShowSearchDropdown(true)
        setShowGlobalSearchPrompt(false)
      } else if (value.trim().length === 0) {
        // Clear search results
        setSearchResults([])
        setShowSearchDropdown(false)
        setShowGlobalSearchPrompt(false)
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
      router.push(`/demo/app/documents?search=${encodeURIComponent(localSearchQuery.trim())}`)
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
      router.push(`/demo/app/documents?search=${encodeURIComponent(localSearchQuery.trim())}`)
    }
  }

  const handleGlobalSearch = () => {
    if (localSearchQuery.trim()) {
      router.push(`/demo/app/documents?search=${encodeURIComponent(localSearchQuery.trim())}`)
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-2 shadow-sm">
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
                <span>Press Enter to search in all documents</span>
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
            onSelectResult={(result) => {
              // Handle navigation based on result type
              if (result.type === 'document') {
                router.push(`/demo/app/documents?search=${encodeURIComponent(result.name)}`)
              } else if (result.type === 'insight' || result.type === 'insight_card') {
                router.push(`/demo/app/insights`)
              } else if (result.type === 'folder') {
                router.push(`/demo/app/documents?folder=${encodeURIComponent(result.name)}`)
              } else {
                router.push(`/demo/app/documents?search=${encodeURIComponent(result.name)}`)
              }
            }}
            onClose={() => setShowSearchDropdown(false)}
          />
          </div>
        </div>

        {/* Right side - Quick Actions */}
        <div className="flex items-center space-x-2">
          {/* Bookmarked Documents */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
            title="Bookmarked Documents"
          >
            <Bookmark className="h-4 w-4 mr-2" />
            <span className="text-sm">Bookmarks</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
            title="Notifications"
          >
            <Bell className="h-4 w-4 mr-2" />
            <span className="text-sm">Notifications</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
