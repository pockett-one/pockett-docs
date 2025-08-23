"use client"

import { useState, useEffect, useCallback } from "react"
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
import { semanticSearch, SemanticSearchResult } from "@/lib/semantic-search"

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
  const [allSearchResults, setAllSearchResults] = useState<SearchResult[]>([])
  const [isSemanticReady, setIsSemanticReady] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()

  // Ensure client-side rendering for dynamic search functionality
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize semantic search
  useEffect(() => {
    if (isClient && enableLocalSearch) {
      semanticSearch.initialize().then(success => {
        setIsSemanticReady(success)
        console.log('Semantic search ready:', success)
      })
    }
  }, [isClient, enableLocalSearch])

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

  // Debounced search function
  const debouncedSearch = useCallback((query: string) => {
    if (query.trim().length >= 4) {
      console.log(`🔍 TopBar: Searching for "${query.trim()}"`)
      console.log(`📊 TopBar: searchableData length: ${searchableData.length}`)
      
      // Set loading state
      setIsSearching(true)
      
      // Use semantic search if available, otherwise fallback
      semanticSearch.search(query.trim(), searchableData).then((results: SemanticSearchResult[]) => {
        console.log(`🎯 TopBar: Search returned ${results.length} results`)
        
        // Convert SemanticSearchResult to SearchResult format
        const searchResults = results.map(result => ({
          id: result.item.id || result.item.name,
          type: result.item.type || 'document',
          name: result.item.name || result.item.title || 'Untitled',
          matchedFields: result.matchType === 'semantic' ? ['semantic'] : ['name'],
          highlights: [{
            field: 'name',
            value: result.item.name || result.item.title || 'Untitled',
            indices: []
          }],
          metadata: {
            ...result.item,
            score: result.score, // Use score for match percentage
            semanticScore: result.score,
            matchType: result.matchType,
            explanation: result.explanation,
            confidence: result.confidence
          }
        }))
        
        console.log(`📝 TopBar: Converted to ${searchResults.length} SearchResults`)
        setAllSearchResults(searchResults) // Store all results
        setSearchResults(searchResults.slice(0, 8)) // Show first 8 initially
        setShowSearchDropdown(true)
        setShowGlobalSearchPrompt(false)
        setIsSearching(false) // Clear loading state
      }).catch(error => {
        console.warn('Search failed, clearing results:', error)
        setSearchResults([])
        setAllSearchResults([])
        setShowSearchDropdown(false)
        setIsSearching(false) // Clear loading state
      })
    }
  }, [searchableData])

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
            onShowMore={handleShowMore}
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
