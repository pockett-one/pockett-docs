"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { HelpCircle } from "lucide-react"
import { ContributorsTab } from "@/components/dashboard/contributors-tab"
import { EmptyState } from "@/components/ui/empty-state"
import { TourGuide, useTourGuide, TourStep } from "@/components/ui/tour-guide"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { getMockData } from "@/lib/mock-data"
import { generateUniformSearchableData, getUniformSearchFields, getUniformSearchPlaceholder } from "@/lib/search-utils"

export default function ContributorsPage() {
  const [hasConnections, setHasConnections] = useState(true)
  const mockData = getMockData()
  
  // Tour guide functionality
  const { shouldShowTour, isTourOpen, startTour, closeTour } = useTourGuide('Contributors')

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Contributors',
      content: 'This page shows all the people who have contributed to your documents and collaboration activities.',
      target: '.contributors-header',
      position: 'bottom',
      action: 'none'
    },
    {
      id: 'contributor-list',
      title: 'Contributor Overview',
      content: 'View all contributors with their document counts, roles, and collaboration history.',
      target: '.contributors-tab',
      position: 'top',
      action: 'hover',
      actionText: 'Hover over contributor entries'
    },
    {
      id: 'document-contributions',
      title: 'Document Contributions',
      content: 'See which documents each person has contributed to and their collaboration patterns.',
      target: '.contributors-tab',
      position: 'bottom',
      action: 'hover',
      actionText: 'Explore contribution details'
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
    
    // Add contributors (users who have contributed)
    const contributors = new Set<string>()
    mockData.documents.forEach(doc => {
      if (doc.contributors) {
        doc.contributors.forEach(contributor => {
          contributors.add(contributor.emailAddress)
        })
      }
    })
    
    const contributorsData = Array.from(contributors).map((email: string) => {
      const userDocs = mockData.documents.filter(doc => 
        doc.contributors?.some(c => c.emailAddress === email)
      )
      
      return {
        id: email,
        type: 'contributor',
        name: email,
        description: `Contributor to ${userDocs.length} documents`,
        documentCount: userDocs.length,
        documents: userDocs.map(doc => doc.name)
      }
    })
    
    // Add documents with contributors
    const contributorDocuments = mockData.documents.filter(doc => doc.contributors && doc.contributors.length > 0).map(doc => ({
      id: doc.id,
      type: 'document',
      name: doc.name,
      description: doc.name,
      folder: doc.folder?.name,
      path: doc.folder?.path || (doc.folder?.name ? `/${doc.folder.name}` : undefined),
      contributors: doc.contributors?.map(c => c.emailAddress).join(', '),
      lastModified: doc.modifiedTime
    }))
    
    // Add shared documents
    const sharedDocuments = mockData.documents.filter(doc => doc.sharing.shared).map(doc => ({
      id: `shared-${doc.id}`,
      type: 'shared_document',
      name: doc.name,
      description: `Shared document: ${doc.name}`,
      folder: doc.folder?.name,
      path: doc.folder?.path || (doc.folder?.name ? `/${doc.folder.name}` : undefined),
      sharedWith: doc.sharing.sharedWith,
      permissions: Array.isArray(doc.sharing.permissions) ? doc.sharing.permissions.join(', ') : doc.sharing.permissions
    }))
    
    return [...baseData, ...contributorsData, ...contributorDocuments, ...sharedDocuments]
  }

  return (
    <AppLayout 
      showTopBar={true}
      topBarProps={{
        searchableData: getSearchableData(),
        searchFields: getUniformSearchFields(),
        enableLocalSearch: true,
        placeholder: getUniformSearchPlaceholder('contributors'),
        showGlobalSearchOption: true
      }}
    >
      <div className="min-h-screen bg-white">


        {/* Main Content */}
        <div className="px-6 py-6">
          {!hasConnections ? (
            <EmptyState type="contributors" />
          ) : (
            <>
              {/* Header with Tour Button */}
              <div className="flex items-center justify-between mb-6 contributors-header">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-medium text-gray-900">Contributors</span>
                </div>
                
                {/* Tour Help Button */}
                <button
                  onClick={startTour}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Take a tour of Contributors"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span>Take Tour</span>
                </button>
              </div>
              
              <div className="contributors-tab">
                <ContributorsTab />
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
        pageName="Contributors"
        onComplete={() => console.log('🎯 Contributors tour completed!')}
      />
    </AppLayout>
  )
}