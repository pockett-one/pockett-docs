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
  MoreHorizontal,
  PieChart,
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  HardDrive,
  BarChart3 as BarChart3Icon,
  Table
} from "lucide-react"
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts'

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState<'overview' | 'documents'>('overview')
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

  // Prepare sunburst chart data
  const prepareSunburstData = () => {
    interface SunburstItem {
      name: string
      value: number
      children?: SunburstItem[]
      size?: number
      modifiedTime?: string
      type?: string
    }
    
    const sunburstData: SunburstItem[] = []
    
    // Add root level
    sunburstData.push({
      name: 'Root',
      value: mockData.totalDocuments,
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
    foldersToShow.slice(0, 6).forEach((folder, folderIndex) => {
      const folderFiles = mockData.documents.filter(doc => doc.folder?.name === folder.name)
      const folderData: SunburstItem = {
        name: folder.name,
        value: Math.max(folderFiles.length, 1), // Ensure at least 1 for visualization
        children: []
      }
      
      // Add recent files as second level
      const recentFiles = folderFiles
        .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
        .slice(0, 4) // Limit to 4 files per folder for better visualization
      
      recentFiles.forEach(file => {
        folderData.children!.push({
          name: file.name,
          value: Math.max(file.engagement.viewCount + file.engagement.editCount + file.engagement.commentCount, 1),
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

  const sunburstData = prepareSunburstData()

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

        {/* Tab Navigation */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <BarChart3Icon className="h-5 w-5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'documents'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Table className="h-5 w-5" />
                <span>Documents</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 py-6">
          {activeTab === 'overview' ? (
            <>
              {/* Breadcrumb and Search */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <FolderOpen className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-medium text-gray-900">Documents Overview</span>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80"
                  />
                </div>
              </div>

              {/* Charts & Insights Section */}
              <div className="mb-8 space-y-6">
                {/* Key Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Documents</p>
                        <p className="text-2xl font-bold">{mockData.totalDocuments}</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Total Folders</p>
                        <p className="text-2xl font-bold">{mockData.totalFolders}</p>
                      </div>
                      <FolderOpen className="h-8 w-8 text-green-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Shared Documents</p>
                        <p className="text-2xl font-bold">{mockData.documents.filter(doc => doc.sharing.shared).length}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-200" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Recent Activity</p>
                        <p className="text-2xl font-bold">{mockData.documents.filter(doc => {
                          const hoursAgo = (Date.now() - new Date(doc.modifiedTime).getTime()) / (1000 * 60 * 60)
                          return hoursAgo < 24
                        }).length}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-200" />
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* File Type Distribution - Doughnut Chart */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <PieChart className="h-5 w-5 text-blue-600 mr-2" />
                      File Type Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            { name: 'Documents', value: mockData.summary.fileTypes.documents, fill: '#3B82F6' },
                            { name: 'Spreadsheets', value: mockData.summary.fileTypes.spreadsheets, fill: '#10B981' },
                            { name: 'Presentations', value: mockData.summary.fileTypes.presentations, fill: '#F59E0B' },
                            { name: 'PDFs', value: mockData.summary.fileTypes.pdfs, fill: '#EF4444' },
                            { name: 'Other', value: mockData.totalDocuments - (
                              mockData.summary.fileTypes.documents + 
                              mockData.summary.fileTypes.spreadsheets + 
                              mockData.summary.fileTypes.presentations + 
                              mockData.summary.fileTypes.pdfs
                            ), fill: '#6B7280' }
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
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
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
                            <span className="text-xs text-gray-600 truncate">{folder.name}</span>
                            <span className="text-xs text-gray-400">({folder.value})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="h-8 w-8 text-indigo-600" />
                      <div>
                        <p className="text-sm font-medium text-indigo-900">Engagement Score</p>
                        <p className="text-2xl font-bold text-indigo-700">
                          {Math.round((mockData.documents.reduce((sum, doc) => 
                            sum + doc.engagement.viewCount + doc.engagement.editCount + doc.engagement.commentCount, 0
                          ) / mockData.totalDocuments) * 100) / 100}
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
                          {formatFileSize(mockData.documents.reduce((sum, doc) => sum + doc.size, 0))}
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
                          {mockData.documents.filter(doc => doc.isDuplicate).length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </AppLayout>
  )
}