"use client"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/lib/sidebar-context"
import { 
  Bookmark, 
  Bell, 
  HelpCircle
} from "lucide-react"

export function AppTopbar() {
  const { isCollapsed } = useSidebar()
  
  return (
    <header className={`bg-white shadow-sm border-b border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'ml-16' : 'ml-64'
    }`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Search Bar Removed */}

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
