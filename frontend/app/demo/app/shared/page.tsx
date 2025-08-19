"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { SharedTab } from "@/components/dashboard/shared-tab"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"

export default function SharedPage() {
  const [hasConnections, setHasConnections] = useState(true)

  // Check connection status on mount and when connections change
  useEffect(() => {
    const checkConnections = () => {
      setHasConnections(shouldLoadMockData())
    }

    checkConnections()

    // Listen for connection updates
    window.addEventListener('pockett-connections-updated', checkConnections)
    window.addEventListener('storage', checkConnections)

    return () => {
      window.removeEventListener('pockett-connections-updated', checkConnections)
      window.removeEventListener('storage', checkConnections)
    }
  }, [])

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        {/* Connection Status */}
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${hasConnections ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-blue-800">
                  {hasConnections ? 'Connected: Google Drive (1,247 documents)' : 'No connections available'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          {!hasConnections ? (
            <EmptyState type="shared" />
          ) : (
            <SharedTab />
          )}
        </div>
      </div>
    </AppLayout>
  )
}