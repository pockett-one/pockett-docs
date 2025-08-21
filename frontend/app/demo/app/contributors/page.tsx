"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layouts/app-layout"
import { ContributorsTab } from "@/components/dashboard/contributors-tab"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { getMockData } from "@/lib/mock-data"
import { generateUniformSearchableData, getUniformSearchFields, getUniformSearchPlaceholder } from "@/lib/search-utils"

export default function ContributorsPage() {
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
            <ContributorsTab />
          )}
        </div>
      </div>
    </AppLayout>
  )
}