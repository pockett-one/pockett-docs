"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { AppLayout } from "@/components/layouts/app-layout"
import { EngagementTab } from "@/components/dashboard/engagement-tab"
import { VisualizationsTab } from "@/components/dashboard/visualizations-tab"
import { SharedTab } from "@/components/dashboard/shared-tab"
import { ContributorsTab } from "@/components/dashboard/contributors-tab"
import { getMockData, formatRelativeTime, formatFileSize, getFileIconComponent } from "@/lib/mock-data"
import { 
  FolderOpen, 
  Search,
  FileText,
  File,
  ArrowUpDown,
  MoreHorizontal,
  BarChart3,
  Share2,
  Users
} from "lucide-react"

function DashboardContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState("documents")
  const itemsPerPage = 10

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const mockData = getMockData()
  const allDocuments = mockData.documents.concat(
    mockData.folders.map(folder => ({
      ...folder,
      id: `folder-${folder.id}`, // Prefix folder IDs to ensure uniqueness
      type: "application/vnd.google-apps.folder",
      mimeType: "application/vnd.google-apps.folder",
      size: 0,
      modifiedTime: folder.modifiedTime,
      lastAccessedTime: folder.modifiedTime,
      accessCount: 0,
      owners: [],
      contributors: [],
      sharing: {
        shared: false,
        sharedWith: [],
        sharingStatus: "private",
        expiryDate: null,
        createdDate: null,
        permissions: []
      },
      engagement: {
        viewCount: 0,
        editCount: 0,
        commentCount: 0,
        shareCount: 0,
        downloadCount: 0,
        activityPeriods: {
          pastHour: 0,
          past7Days: 0,
          past30Days: 0,
          past90Days: 0
        }
      },
      folder: {
        id: "",
        name: "",
        path: ""
      },
      isDuplicate: false,
      duplicateCount: 0,
      tags: [],
      status: "active"
    }))
  )

  const filteredDocuments = allDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentDocuments = filteredDocuments.slice(0, currentPage * itemsPerPage)
  const hasMore = filteredDocuments.length > currentPage * itemsPerPage

  const getDisplaySize = (doc: any) => {
    if (doc.mimeType?.includes('folder')) return "-"
    return formatFileSize(doc.size)
  }

  const getDisplayType = (doc: any) => {
    if (doc.mimeType?.includes('folder')) return "Folder"
    if (doc.mimeType?.includes('document')) return "Document"
    if (doc.mimeType?.includes('spreadsheet')) return "Spreadsheet"
    if (doc.mimeType?.includes('presentation')) return "Presentation"
    if (doc.type?.includes('pdf')) return "PDF"
    return "File"
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-white">
        {/* Connection Status */}
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm text-blue-800">Connected: Google Drive (1,247 documents)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FolderOpen className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Engagement</span>
            </TabsTrigger>
            <TabsTrigger value="visualizations" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Visualizations</span>
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex items-center space-x-2">
              <Share2 className="h-4 w-4" />
              <span>Shared</span>
            </TabsTrigger>
            <TabsTrigger value="contributors" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Contributors</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            {/* Breadcrumb and Search */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-medium text-gray-900">My Documents</span>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                  <div className="col-span-5 flex items-center space-x-2">
                    <span>Name</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <span>Modified</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <span>Size</span>
                    <ArrowUpDown className="h-4 w-4" />
                  </div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-1"></div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {currentDocuments.map((doc) => {
                  const iconInfo = getFileIconComponent(doc.mimeType)
                  const IconComponent = iconInfo.component === 'FolderOpen' ? FolderOpen : 
                                       iconInfo.component === 'FileText' ? FileText : File
                  
                  return (
                    <div 
                      key={doc.id}
                      className="px-6 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center space-x-3">
                          <IconComponent className={`h-5 w-5 ${iconInfo.color}`} />
                          <span className="text-gray-900 hover:text-blue-600 truncate">
                            {doc.name}
                          </span>
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {formatRelativeTime(doc.modifiedTime)}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {getDisplaySize(doc)}
                        </div>
                        <div className="col-span-2 text-sm text-gray-600">
                          {getDisplayType(doc)}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination Controls */}
              {(hasMore || currentPage > 1) && (
                <div className="border-t border-gray-200 px-6 py-4 text-center space-x-3">
                  {currentPage > 1 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentPage(1)}
                    >
                      View Less
                    </Button>
                  )}
                  {hasMore && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentPage(prev => prev + 1)}
                    >
                      View More ({filteredDocuments.length - currentDocuments.length} remaining)
                    </Button>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="engagement">
            <EngagementTab />
          </TabsContent>

          <TabsContent value="visualizations">
            <VisualizationsTab />
          </TabsContent>

          <TabsContent value="shared">
            <SharedTab />
          </TabsContent>

          <TabsContent value="contributors">
            <ContributorsTab />
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}