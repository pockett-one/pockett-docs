"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layouts/app-layout"
import { getMockData, formatFileSize } from "@/lib/mock-data"
import { EmptyState } from "@/components/ui/empty-state"
import { TourGuide, useTourGuide, TourStep } from "@/components/ui/tour-guide"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { generateUniformSearchableData, getUniformSearchFields, getUniformSearchPlaceholder } from "@/lib/search-utils"
import { 
  FolderOpen, 
  FileText,
  File,
  PieChart,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  HardDrive,
  HelpCircle
} from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts'

export default function AnalyticsPage() {
  const [hasConnections, setHasConnections] = useState(true)
  const [mockData, setMockData] = useState<any>(null)
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  
  // Tour guide functionality
  const { shouldShowTour, isTourOpen, startTour, closeTour, forceStartTour } = useTourGuide('Analytics')

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Analytics',
      content: 'This page provides comprehensive insights into your document workspace with interactive charts and metrics.',
      target: '.analytics-header',
      position: 'bottom',
      action: 'none'
    },
    {
      id: 'key-metrics',
      title: 'Key Metrics',
      content: 'View important numbers like total documents, folders, shared documents, and recent activity at a glance.',
      target: '.key-metrics',
      position: 'bottom',
      action: 'hover',
      actionText: 'Hover over the metric cards'
    },
    {
      id: 'file-type-chart',
      title: 'File Type Distribution',
      content: 'See how your documents are distributed across different file types with an interactive pie chart.',
      target: '.file-type-chart',
      position: 'top',
      action: 'hover',
      actionText: 'Hover over the chart sections'
    },
    {
      id: 'folder-structure',
      title: 'Folder Structure',
      content: 'Explore your folder hierarchy with the interactive sunburst chart showing document distribution.',
      target: '.folder-structure',
      position: 'left',
      action: 'hover',
      actionText: 'Hover over chart segments'
    },
    {
      id: 'engagement-score',
      title: 'Engagement Insights',
      content: 'Monitor document engagement, storage usage, and identify duplicate files for optimization.',
      target: '.engagement-insights',
      position: 'right',
      action: 'hover',
      actionText: 'Hover over insight cards'
    }
  ]
  
  // Helper function to safely get values with fallbacks
  const getSafeValue = (obj: any, key: string, fallback: any = 0) => {
    if (obj && typeof obj === 'object' && key in obj) {
      const value = obj[key]
      return value !== undefined && value !== null ? value : fallback
    }
    return fallback
  }
  
  // Helper function to safely get nested values with fallbacks
  const getNestedValue = (obj: any, path: string, fallback: any = 0) => {
    try {
      const keys = path.split('.')
      let current = obj
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key]
        } else {
          return fallback
        }
      }
      return current !== undefined && current !== null ? current : fallback
    } catch {
      return fallback
    }
  }
  
  // Load mock data on client side to prevent hydration issues
  useEffect(() => {
    const data = getMockData()
    setMockData(data)
    setIsDataLoaded(true)
    
    // Debug: Log mock data structure to understand what properties exist
    console.log('🔍 Analytics Mock Data Structure:', {
      hasDocuments: !!data.documents,
      documentsLength: data.documents?.length || 0,
      hasFolders: !!data.folders,
      foldersLength: data.folders?.length || 0,
      hasTotalDocuments: 'totalDocuments' in data,
      totalDocumentsValue: data.totalDocuments,
      hasTotalFolders: 'totalFolders' in data,
      totalFoldersValue: data.totalFolders,
      hasSummary: !!data.summary,
      summaryKeys: data.summary ? Object.keys(data.summary) : []
    })
  }, [])

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

  // Prepare sunburst chart data
  const prepareSunburstData = () => {
    // Return empty data if mockData is not loaded yet
    if (!mockData) {
      return []
    }
    
    interface SunburstItem {
      name: string
      value: number
      children?: SunburstItem[]
      size?: number
      modifiedTime?: string
      type?: string
    }
    
    const sunburstData: SunburstItem[] = []
    
    // Add root level with robust fallback
    const totalDocs = mockData.totalDocuments || mockData.documents?.length || 0
    sunburstData.push({
      name: 'Root',
      value: totalDocs,
      children: []
    })
    
    // Get folders with files, or use existing folders
    let foldersToShow = mockData.folders
    
    // If no folders exist, create some sample data for visualization
    if (foldersToShow.length === 0) {
      // Create sample folder structure for demonstration
      const sampleFolders = [
        { name: 'Documents', id: '1', path: '/Documents', documentCount: 5, createdTime: new Date().toISOString(), modifiedTime: new Date().toISOString() },
        { name: 'Projects', id: '2', path: '/Projects', documentCount: 3, createdTime: new Date().toISOString(), modifiedTime: new Date().toISOString() },
        { name: 'Work', id: '3', path: '/Work', documentCount: 4, createdTime: new Date().toISOString(), modifiedTime: new Date().toISOString() }
      ]
      
      // Add sample folders with sample files
      sampleFolders.forEach((folder, folderIndex) => {
        const folderData: SunburstItem = {
          name: folder.name,
          value: 3, // Sample value
          children: []
        }
        
        // Add sample files
        for (let i = 1; i <= 3; i++) {
          folderData.children!.push({
            name: `Sample ${folder.name} File ${i}`,
            value: Math.floor(Math.random() * 10) + 1,
            size: 1024 * (Math.floor(Math.random() * 100) + 50),
            modifiedTime: new Date().toISOString(),
            type: 'document'
          })
        }
        
        sunburstData[0].children!.push(folderData)
      })
      
      return sunburstData
    }
    
    // Add folders as first level (limit to 6 for better visualization)
    foldersToShow.slice(0, 6).forEach((folder: any, folderIndex: number) => {
      const folderFiles = mockData.documents.filter((doc: any) => doc.folder?.name === folder.name)
      const folderData: SunburstItem = {
        name: folder.name,
        value: Math.max(folderFiles.length, 1), // Ensure at least 1 for visualization
        children: []
      }
      
      // Add recent files as second level
      const recentFiles = folderFiles
        .sort((a: any, b: any) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
        .slice(0, 4) // Limit to 4 files per folder for better visualization
      
      recentFiles.forEach((file: any) => {
        folderData.children!.push({
          name: file.name,
          value: Math.max(file.engagement.views + file.engagement.downloads + file.engagement.comments, 1),
          size: file.size,
          modifiedTime: file.modifiedTime,
          type: getDisplayType(file)
        })
      })
      
      // If no files in folder, add a placeholder
      if (folderData.children!.length === 0) {
        folderData.children!.push({
          name: 'No files',
          value: 1,
          size: 0,
          modifiedTime: new Date().toISOString(),
          type: 'folder'
        })
      }
      
      sunburstData[0].children!.push(folderData)
    })
    
    return sunburstData
  }

  const getDisplayType = (doc: any) => {
    if (doc.mimeType?.includes('folder')) return "Folder"
    if (doc.mimeType?.includes('document')) return "Document"
    if (doc.mimeType?.includes('spreadsheet')) return "Spreadsheet"
    if (doc.mimeType?.includes('presentation')) return "Presentation"
    if (doc.type?.includes('pdf')) return "PDF"
    return "File"
  }

  // Prepare sunburst data only when mockData is loaded
  const sunburstData = mockData ? prepareSunburstData() : []

  // Get searchable data for TopBar using centralized utility
  const getSearchableData = () => {
    // Return empty data if mockData is not loaded yet
    if (!mockData) {
      return []
    }
    
    // Get base searchable data (documents and folders)
    const baseData = generateUniformSearchableData(mockData)
    
    // Add analytics metrics
    const metrics = [
      {
        id: 'total-documents',
        type: 'metric',
        name: 'Total Documents',
        value: getSafeValue(mockData, 'totalDocuments', mockData.documents?.length || 0),
        description: 'Total number of documents in workspace'
      },
      {
        id: 'total-folders',
        type: 'metric',
        name: 'Total Folders',
        value: getSafeValue(mockData, 'totalFolders', mockData.folders?.length || 0),
        description: 'Total number of folders in workspace'
      }
    ]
    
    return [...baseData, ...metrics]
  }

  // Don't render anything until data is loaded to prevent hydration issues
  if (!isDataLoaded || !mockData) {
    return (
      <AppLayout 
        showTopBar={true}
        topBarProps={{
          searchableData: [],
          searchFields: getUniformSearchFields(),
          enableLocalSearch: false,
          placeholder: getUniformSearchPlaceholder('analytics'),
          showGlobalSearchOption: true,
          onStartTour: forceStartTour,
          showTourButton: true,
          tourButtonText: "Take Tour"
        }}
      >
        <div className="min-h-screen bg-white">
          <div className="px-6 py-6">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading analytics data...</span>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout 
      showTopBar={true}
      topBarProps={{
        searchableData: getSearchableData(),
        searchFields: getUniformSearchFields(),
        enableLocalSearch: true,
        placeholder: getUniformSearchPlaceholder('analytics'),
        showGlobalSearchOption: true,
        onStartTour: forceStartTour,
        showTourButton: true,
        tourButtonText: "Take Tour"
      }}
    >
      <div className="min-h-screen bg-white">
        {/* Main Content */}
        <div className="px-6 py-6">
          {!hasConnections ? (
            <EmptyState type="analytics" />
          ) : (
            <>
              {/* Header with Tour Button */}
              <div className="flex items-center justify-between mb-6 analytics-header">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-medium text-gray-900">Documents Analytics</span>
                </div>
                

              </div>

              {/* Charts & Insights Section */}
              <div className="mb-8 space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 key-metrics">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Documents</p>
                        <p className="text-2xl font-bold text-gray-900">{getSafeValue(mockData, 'totalDocuments', mockData.documents?.length || 0)}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Total Folders</p>
                        <p className="text-2xl font-bold text-gray-900">{mockData.totalFolders}</p>
                      </div>
                      <FolderOpen className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Shared Documents</p>
                        <p className="text-2xl font-bold text-gray-900">{mockData.documents.filter((doc: any) => doc.sharing.shared).length}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-100 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Recent Activity</p>
                        <p className="text-2xl font-bold text-gray-900">{mockData.documents.filter((doc: any) => {
                          const hoursAgo = (Date.now() - new Date(doc.modifiedTime).getTime()) / (1000 * 60 * 60)
                          return hoursAgo < 24
                        }).length}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* File Type Distribution - Doughnut Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 file-type-chart">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <PieChart className="h-5 w-5 text-blue-600 mr-2" />
                      File Type Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Documents', value: getNestedValue(mockData, 'summary.fileTypes.documents', 0), fill: '#3B82F6' },
                            { name: 'Spreadsheets', value: getNestedValue(mockData, 'summary.fileTypes.spreadsheets', 0), fill: '#10B981' },
                            { name: 'Presentations', value: getNestedValue(mockData, 'summary.fileTypes.presentations', 0), fill: '#F59E0B' },
                            { name: 'PDFs', value: getNestedValue(mockData, 'summary.fileTypes.pdfs', 0), fill: '#EF4444' },
                            { name: 'Other', value: Math.max(0, getSafeValue(mockData, 'totalDocuments', mockData.documents?.length || 0) - (
                              getNestedValue(mockData, 'summary.fileTypes.documents', 0) + 
                              getNestedValue(mockData, 'summary.fileTypes.spreadsheets', 0) + 
                              getNestedValue(mockData, 'summary.fileTypes.presentations', 0) + 
                              getNestedValue(mockData, 'summary.fileTypes.pdfs', 0)
                            )), fill: '#6B7280' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                        />
                        <Tooltip 
                          formatter={(value, name) => [value, name]}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Folder Structure & Recent Files - Sunburst Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6 folder-structure">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
                      Folder Structure & Recent Activity
                    </h3>
                    
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        {/* Root level - center */}
                        <Pie
                          data={[{ name: 'Root', value: 1, fill: '#1f2937' }]}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={30}
                          dataKey="value"
                        />
                        
                        {/* Folders level - middle ring */}
                        <Pie
                          data={(sunburstData[0]?.children || []).map((entry, index) => ({
                            ...entry,
                            fill: `hsl(${index * 45 + 15}, 75%, 55%)`
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        />
                        
                        {/* Files level - outer ring */}
                        <Pie
                          data={(sunburstData[0]?.children?.flatMap(folder => folder.children || []) || []).map((entry, index) => ({
                            ...entry,
                            fill: `hsl(${(index * 25 + 180) % 360}, 65%, 65%)`
                          }))}
                          cx="50%"
                          cy="50%"
                          innerRadius={85}
                          outerRadius={120}
                          paddingAngle={1}
                          dataKey="value"
                        />
                        
                        <Tooltip 
                          formatter={(value, name, props) => {
                            if (props.payload.size) {
                              return [`Size: ${formatFileSize(props.payload.size)}`, props.payload.name]
                            } else if (props.payload.children) {
                              return [`${value} files`, props.payload.name]
                            } else {
                              return [`Engagement: ${value}`, props.payload.name]
                            }
                          }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                    
                    {/* Enhanced Legend */}
                    <div className="mt-4 space-y-3">
                      {/* Root Legend */}
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-gray-800" />
                        <span className="text-sm font-medium text-gray-800">Root</span>
                      </div>
                      
                      {/* Folders Legend */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-xs font-medium text-gray-600 mb-1 col-span-2">Folders:</div>
                        {sunburstData[0]?.children?.map((folder, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div 
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: `hsl(${index * 45 + 15}, 75%, 55%)` }}
                            />
                            <div>
                              <div className="text-xs text-gray-600 truncate">{folder.name}</div>
                              <div className="text-xs text-gray-400">{folder.value}% of total</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 engagement-insights">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Engagement Score</p>
                        <p className="text-2xl font-bold text-indigo-700">
                          {(() => {
                            const totalEngagement = mockData.documents.reduce((sum: number, doc: any) => 
                              sum + doc.engagement.views + doc.engagement.downloads + doc.engagement.comments, 0
                            )
                            const totalDocs = mockData.totalDocuments || mockData.documents.length || 1
                            const score = totalDocs > 0 ? (totalEngagement / totalDocs) : 0
                            return Math.round(score * 100) / 100 || 0
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <HardDrive className="h-8 w-8 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium text-yellow-900">Storage Used</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {formatFileSize(mockData.documents.reduce((sum: number, doc: any) => sum + doc.size, 0))}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <File className="h-8 w-8 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-900">Duplicate Files</p>
                        <p className="text-2xl font-bold text-red-700">
                          {mockData.documents.filter((doc: any) => doc.isDuplicate).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
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
        pageName="Analytics"
        onComplete={() => console.log('🎯 Analytics tour completed!')}
      />
      

    </AppLayout>
  )
}
