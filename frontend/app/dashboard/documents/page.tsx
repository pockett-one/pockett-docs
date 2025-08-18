"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { AppLayout } from "@/components/layouts/app-layout"
import { getMockData, formatRelativeTime, formatFileSize, getFileIconComponent } from "@/lib/mock-data"
import { 
  FolderOpen, 
  Search,
  FileText,
  File,
  ArrowUpDown,
  MoreHorizontal
} from "lucide-react"

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

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

  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = filteredDocuments.slice(startIndex, endIndex)

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
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1) // Reset to first page when searching
                }}
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
            {totalPages > 1 && (
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <PaginationInfo
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    totalItems={filteredDocuments.length}
                  />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}