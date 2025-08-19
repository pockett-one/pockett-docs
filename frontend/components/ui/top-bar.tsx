"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { 
  Search, 
  Bookmark, 
  Clock, 
  X
} from "lucide-react"

interface TopBarProps {
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function TopBar({ 
  searchQuery = "", 
  onSearchChange
}: TopBarProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery)
  const router = useRouter()

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value)
    onSearchChange?.(value)
    
    // Navigate to documents page when user starts typing
    if (value.trim() && window.location.pathname !== '/demo/app/documents') {
      router.push(`/demo/app/documents?search=${encodeURIComponent(value.trim())}`)
    }
  }

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-6 py-2 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Left side - Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search documents..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 h-8 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-300"
            />
            {localSearchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
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

          {/* Upcoming Expiry */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-3 text-gray-600 hover:text-orange-600 hover:bg-orange-50"
            title="Upcoming Expiry Documents"
          >
            <Clock className="h-4 w-4 mr-2" />
            <span className="text-sm">Expiring</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
