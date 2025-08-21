"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { SharedTab } from "@/components/dashboard/shared-tab"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { getMockData } from "@/lib/mock-data"
import { generateUniformSearchableData, getUniformSearchFields, getUniformSearchPlaceholder } from "@/lib/search-utils"

export default function SharedPage() {
  const [hasConnections, setHasConnections] = useState(true)
  const mockData = getMockData()

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



  // Get searchable data for TopBar using centralized utility
  const getSearchableData = () => {
    // Get base searchable data (documents and folders)
    const baseData = generateUniformSearchableData(mockData)
    
    // Add shared documents with additional metadata
    const sharedDocuments = mockData.documents.filter(doc => doc.sharing.shared).map(doc => ({
      id: doc.id,
      type: 'shared_document',
      name: doc.name,
      description: doc.name,
      folder: doc.folder?.name,
      mimeType: doc.mimeType,
      path: doc.folder?.path || (doc.folder?.name ? `/${doc.folder.name}` : undefined),
      sharedWith: doc.sharing.sharedWith,
      permissions: Array.isArray(doc.sharing.permissions) ? doc.sharing.permissions.join(', ') : doc.sharing.permissions
    }))
    
    return [...baseData, ...sharedDocuments]
  }

  return (
    <AppLayout 
      showTopBar={true}
      topBarProps={{
        searchableData: getSearchableData(),
        searchFields: getUniformSearchFields(),
        enableLocalSearch: true,
        placeholder: getUniformSearchPlaceholder('shared documents'),
        showGlobalSearchOption: true
      }}
    >
      <div className="min-h-screen bg-white">


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