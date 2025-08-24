"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { HelpCircle } from "lucide-react"
import { SharedTab } from "@/components/dashboard/shared-tab"
import { EmptyState } from "@/components/ui/empty-state"
import { TourGuide, useTourGuide, TourStep, FloatingTourButton } from "@/components/ui/tour-guide"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { getMockData } from "@/lib/mock-data"
import { generateUniformSearchableData, getUniformSearchFields, getUniformSearchPlaceholder } from "@/lib/search-utils"

export default function SharedPage() {
  const [hasConnections, setHasConnections] = useState(true)
  const mockData = getMockData()
  
  // Tour guide functionality
  const { shouldShowTour, isTourOpen, startTour, closeTour, forceStartTour } = useTourGuide('Shared Documents')

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Shared Documents',
      content: 'This page shows all documents that have been shared with you or by you with others.',
      target: '.shared-header',
      position: 'bottom',
      action: 'none'
    },
    {
      id: 'shared-list',
      title: 'Shared Document Overview',
      content: 'View all shared documents with their sharing details, permissions, and collaborators.',
      target: '.shared-tab',
      position: 'top',
      action: 'hover',
      actionText: 'Hover over shared documents'
    },
    {
      id: 'permissions',
      title: 'Sharing Permissions',
      content: 'See who has access to each document and what they can do with it.',
      target: '.shared-tab',
      position: 'bottom',
      action: 'hover',
      actionText: 'Check permission details'
    }
  ]

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
            <>
              {/* Header with Tour Button */}
              <div className="flex items-center justify-between mb-6 shared-header">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900">Shared Documents</span>
                </div>
                

              </div>
              
              <div className="shared-tab">
                <SharedTab />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tour Guide */}
      <TourGuide
        isOpen={isTourOpen}
        onClose={closeTour}
        steps={tourSteps}
        pageName="Shared Documents"
        onComplete={() => console.log('🎯 Shared Documents tour completed!')}
      />
      
      {/* Floating Tour Button */}
      <FloatingTourButton 
        pageName="Shared Documents" 
        onStartTour={forceStartTour} 
      />
    </AppLayout>
  )
}