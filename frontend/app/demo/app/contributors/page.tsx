"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { ContributorsTab } from "@/components/dashboard/contributors-tab"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"

export default function ContributorsPage() {
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


        {/* Main Content */}
        <div className="px-6 py-6">
          {!hasConnections ? (
            <EmptyState type="contributors" />
          ) : (
            <ContributorsTab />
          )}
        </div>
      </div>
    </AppLayout>
  )
}