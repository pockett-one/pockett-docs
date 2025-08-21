"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { AppLayout } from "@/components/layouts/app-layout"
import { DocumentActionMenu } from "@/components/ui/document-action-menu"
import { getMockData, formatRelativeTime, formatFileSize, getFileIconComponent } from "@/lib/mock-data"
import { EmptyState } from "@/components/ui/empty-state"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { 
  FolderOpen, 
  FileText,
  File,
  ArrowUpDown,
  MoreHorizontal,
  Table,
  Download,
  ExternalLink,
  Share2,
  Bookmark
} from "lucide-react"

function DocumentsPageContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const [openModalOpen, setOpenModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [hasConnections, setHasConnections] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const itemsPerPage = 10

  // Ensure client-side rendering for dynamic content
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Add loading delay for skeleton effect
  useEffect(() => {
    if (hasConnections && isClient) {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [hasConnections, isClient])

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

  // Handle URL search parameters
  useEffect(() => {
    if (!isClient) return // Wait for client-side hydration
    
    const searchFromUrl = searchParams.get('search')
    const folderFromUrl = searchParams.get('folder')
    
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl)
      setCurrentPage(1) // Reset to first page when search is applied
    }
    
    if (folderFromUrl) {
      // Navigate to the specified folder from URL parameter
      enterFolder(decodeURIComponent(folderFromUrl))
    }
  }, [searchParams, isClient])

  // Handle escape key and click outside for modals
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenModalOpen(false)
        setShareModalOpen(false)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (openModalOpen || shareModalOpen) {
        const target = event.target as Element
        if (!target.closest('.modal-content')) {
          setOpenModalOpen(false)
          setShareModalOpen(false)
        }
      }
    }

    if (openModalOpen || shareModalOpen) {
      document.addEventListener('keydown', handleEscapeKey)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openModalOpen, shareModalOpen])

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
        createdDate: null,
        expiryDate: null,
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

  // Filter documents by current folder
  const getDocumentsInCurrentFolder = () => {
    if (!currentFolder) {
      // Root level - show all documents and folders
      return allDocuments
    }
    
    // Filter documents that belong to the current folder
    return allDocuments.filter(doc => {
      if (doc.mimeType?.includes('folder')) {
        // For folders, check if they're in the current folder path
        return doc.folder?.name === currentFolder
      } else {
        // For files, check if they're in the current folder
        return doc.folder?.name === currentFolder
      }
    })
  }

  // Handle folder navigation
  const enterFolder = (folderName: string) => {
    setCurrentFolder(folderName)
    setFolderPath([...folderPath, folderName])
    setCurrentPage(1) // Reset to first page when entering folder
    setSearchQuery("") // Clear search when entering folder
    setActiveFilter('all') // Reset filter when entering folder
  }

  // Navigate back to parent folder
  const goToParentFolder = () => {
    if (folderPath.length > 0) {
      const newPath = folderPath.slice(0, -1)
      setFolderPath(newPath)
      setCurrentFolder(newPath.length > 0 ? newPath[newPath.length - 1] : null)
      setCurrentPage(1)
      setSearchQuery("")
      setActiveFilter('all') // Reset filter when navigating
    }
  }

  // Navigate to root
  const goToRoot = () => {
    setCurrentFolder(null)
    setFolderPath([])
    setCurrentPage(1)
    setSearchQuery("")
    setActiveFilter('all') // Reset filter when going to root
  }

  // Helper function to get document access period
  const getDocumentAccessPeriod = (doc: any) => {
    const lastAccessed = new Date(doc.lastAccessedTime || doc.modifiedTime)
    const now = new Date()
    const hoursDiff = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60)
    const daysDiff = hoursDiff / 24

    if (hoursDiff < 1) return 'hour'
    if (daysDiff < 7) return '7days'
    if (daysDiff < 30) return '30days'
    if (daysDiff < 90) return '90days'
    return 'dormant'
  }

  // Helper function to get heat level
  const getHeatLevel = (doc: any) => {
    const period = getDocumentAccessPeriod(doc)
    switch (period) {
      case 'hour': return 'high'
      case '7days': return 'high'
      case '30days': return 'medium'
      case '90days': return 'low'
      case 'dormant': return 'low'
      default: return 'low'
    }
  }

  // Get filter counts with client-side check
  const getFilterCounts = () => {
    if (!isClient) {
      return {
        hour: 0,
        '7days': 0,
        '30days': 0,
        '90days': 0,
        dormant: 0,
        duplicates: 0
      }
    }

    const docsInCurrentFolder = getDocumentsInCurrentFolder()
    const counts = {
      hour: 0,
      '7days': 0,
      '30days': 0,
      '90days': 0,
      dormant: 0,
      duplicates: 0
    }

    docsInCurrentFolder.forEach(doc => {
      if (doc.mimeType?.includes('folder')) return // Skip folders for timeline filters
      
      const period = getDocumentAccessPeriod(doc)
      if (period in counts) {
        counts[period as keyof typeof counts]++
      }
    })

    // Count duplicates (files with same name)
    const nameCounts: { [key: string]: number } = {}
    docsInCurrentFolder.forEach(doc => {
      if (doc.mimeType?.includes('folder')) return
      nameCounts[doc.name] = (nameCounts[doc.name] || 0) + 1
    })
    counts.duplicates = Object.values(nameCounts).filter(count => count > 1).length

    return counts
  }

  // Client-side document count
  const getDocumentCountClient = () => {
    return isClient ? getDocumentsInCurrentFolder().length : 0
  }

  // Get duplicate groups for display
  const getDuplicateGroups = () => {
    const docsInCurrentFolder = getDocumentsInCurrentFolder()
    const nameCounts: { [key: string]: number } = {}
    const duplicateGroups: { 
      name: string; 
      count: number; 
      files: any[];
      latestModified: string;
      largestSize: number;
    }[] = []
    
    // Count files by name
    docsInCurrentFolder.forEach(doc => {
      if (doc.mimeType?.includes('folder')) return
      if (!nameCounts[doc.name]) {
        nameCounts[doc.name] = 0
      }
      nameCounts[doc.name]++
    })
    
    // Create groups for duplicates
    Object.entries(nameCounts).forEach(([name, count]) => {
      if (count > 1) {
        const files = docsInCurrentFolder.filter(doc => 
          doc.name === name && !doc.mimeType?.includes('folder')
        )
        
        // Find latest modification time and largest size
        const latestModified = files.reduce((latest, file) => {
          const fileTime = new Date(file.modifiedTime).getTime()
          const latestTime = new Date(latest).getTime()
          return fileTime > latestTime ? file.modifiedTime : latest
        }, files[0].modifiedTime)
        
        const largestSize = files.reduce((largest, file) => {
          const fileSize = file.size || 0
          return fileSize > largest ? fileSize : largest
        }, 0)
        
        duplicateGroups.push({ 
          name, 
          count, 
          files,
          latestModified,
          largestSize
        })
      }
    })
    
    return duplicateGroups
  }

  // Filter documents by active filter
  const getFilteredDocuments = () => {
    const docsInCurrentFolder = getDocumentsInCurrentFolder()
    
    if (activeFilter === 'all') {
      return docsInCurrentFolder
    }

    if (activeFilter === 'duplicates') {
      const duplicateGroups = getDuplicateGroups()
      // Return one representative file from each duplicate group
      return duplicateGroups.map(group => group.files[0]) // Take first file as representative
    }

    // Filter by time period
    return docsInCurrentFolder.filter(doc => {
      if (doc.mimeType?.includes('folder')) return false
      const period = getDocumentAccessPeriod(doc)
      return period === activeFilter
    })
  }

  const filteredDocuments = getFilteredDocuments().filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort documents: Folders first, then files, both alphabetically
  const sortedDocuments = filteredDocuments.sort((a, b) => {
    const aIsFolder = a.mimeType?.includes('folder') || a.type === "application/vnd.google-apps.folder"
    const bIsFolder = b.mimeType?.includes('folder') || b.type === "application/vnd.google-apps.folder"
    
    // First, sort by type: folders come before files
    if (aIsFolder && !bIsFolder) return -1
    if (!aIsFolder && bIsFolder) return 1
    
    // Then, sort alphabetically within each group
    return a.name.localeCompare(b.name)
  })

  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDocuments = sortedDocuments.slice(startIndex, endIndex)

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)}${sizes[i]}`
  }

  // Get display size for a document
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

  // Function to open document modal
  const handleOpenDocument = (doc: any) => {
    setSelectedDocument(doc)
    setOpenModalOpen(true)
  }

  // Function to open share modal
  const handleShareDocument = (doc: any) => {
    setSelectedDocument(doc)
    setShareModalOpen(true)
  }

  // Download function that creates dummy files based on extension
  const handleDownload = (doc: any) => {
    if (doc.mimeType?.includes('folder')) return

    const extension = doc.name.split('.').pop()?.toLowerCase() || 'txt'
    let content: string
    let mimeType = 'text/plain'
    let filename = doc.name

    switch (extension) {
      case 'doc':
        content = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}
{\\f0\\fs24 This is a sample Microsoft Word document.\\par
\\par
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\\par
\\par
This document was created as a sample file for demonstration purposes.\\par}`
        mimeType = 'application/rtf'
        filename = doc.name.replace(/\.doc$/, '.rtf')
        break
        
      case 'docx':
        content = `This is a sample Microsoft Word document.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

This document contains sample content for demonstration purposes.
You can open this text file and convert it to DOCX format if needed.

File Information:
- Name: ${doc.name}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

Thank you for using our document management system.`
        mimeType = 'text/plain'
        filename = doc.name.replace(/\.docx$/, '.txt')
        break
        
      case 'xls':
        content = `Column A,Column B,Column C
Data 1,Data 2,Data 3
Data 4,Data 5,Data 6
Data 7,Data 8,Data 9
This is a sample Excel spreadsheet created for demonstration purposes.`
        mimeType = 'text/csv'
        filename = doc.name.replace(/\.xls$/, '.csv')
        break
        
      case 'xlsx':
        content = `This is a sample Excel spreadsheet.

Column A    Column B    Column C
Data 1      Data 2      Data 3
Data 4      Data 5      Data 6
Data 7      Data 8      Data 9

This spreadsheet contains sample data for demonstration purposes.
You can open this text file and convert it to XLSX format if needed.

File Information:
- Name: ${doc.name}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

Thank you for using our document management system.`
        mimeType = 'text/plain'
        filename = doc.name.replace(/\.xlsx$/, '.txt')
        break
        
      case 'ppt':
        content = `This is a sample PowerPoint presentation.

Slide 1: Introduction
- Welcome to the presentation
- This is a sample file

Slide 2: Content
- Main points
- Supporting details

Slide 3: Conclusion
- Summary
- Thank you

This file was created for demonstration purposes.
You can open this text file and convert it to PPT format if needed.`
        mimeType = 'text/plain'
        filename = doc.name.replace(/\.ppt$/, '.txt')
        break
        
      case 'pptx':
        content = `This is a sample PowerPoint presentation.

Slide 1: Introduction
- Welcome to the presentation
- This is a sample file

Slide 2: Content
- Main points
- Supporting details

Slide 3: Conclusion
- Summary
- Thank you

This file was created for demonstration purposes.
You can open this text file and convert it to PPTX format if needed.`
        mimeType = 'text/plain'
        filename = doc.name.replace(/\.pptx$/, '.txt')
        break
        
      case 'pdf':
        content = `This is a sample PDF document.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

This document contains sample content for demonstration purposes.
You can open this text file and convert it to PDF using your preferred method.

File Information:
- Name: ${doc.name}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

Thank you for using our document management system.`
        mimeType = 'text/plain'
        filename = doc.name.replace(/\.pdf$/, '.txt')
        break
        
      case 'txt':
        content = `This is a sample text file.

Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

This file was created for demonstration purposes and contains sample content.

File Details:
- Name: ${doc.name}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

You can edit this file with any text editor.`
        mimeType = 'text/plain'
        break
        
      default:
        content = `This is a sample ${extension.toUpperCase()} file.

File Information:
- Name: ${doc.name}
- Extension: ${extension}
- Size: ${formatFileSize(doc.size)}
- Modified: ${new Date(doc.modifiedTime).toLocaleString()}

This is a dummy file created for demonstration purposes.
The content is formatted as plain text for compatibility.`
        mimeType = 'text/plain'
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }



  return (
    <AppLayout 
      showTopBar={true}
      topBarProps={{
        searchQuery: searchQuery,
        onSearchChange: (query) => {
          setSearchQuery(query)
          setCurrentPage(1) // Reset to first page when searching
        }
      }}
    >
      <div className="min-h-screen bg-white">


                {/* Main Content */}
        <div className="px-6 py-6">
          {!hasConnections ? (
            <EmptyState type="documents" />
          ) : (
            <>
              {/* Breadcrumb */}
              <div className="flex items-center space-x-2 mb-6">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-medium text-gray-900">
                  {currentFolder ? `📁 ${currentFolder}` : 'My Documents'}
                </span>
              </div>

              {/* Documents Table */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {/* Document Access Timeline Filters */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Filters</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* All Documents Filter */}
                    <Button
                      variant={activeFilter === 'all' ? "default" : "outline"}
                      onClick={() => {
                        setActiveFilter('all')
                        setCurrentPage(1)
                      }}
                      className="flex items-center space-x-2"
                    >
                      <span>All Documents</span>
                      <span className="bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs">
                        {getDocumentCountClient()}
                      </span>
                    </Button>
                    
                    {/* Timeline Filters */}
                    {Object.entries(getFilterCounts()).map(([filter, count]) => {
                      const filterLabels: { [key: string]: string } = {
                        hour: 'Past Hour',
                        '7days': 'Past 7 days',
                        '30days': 'Past 30 days',
                        '90days': 'Past 90 days',
                        dormant: 'Dormant',
                        duplicates: 'Duplicates'
                      }
                      
                      return (
                        <Button
                          key={filter}
                          variant={activeFilter === filter ? "default" : "outline"}
                          onClick={() => {
                            setActiveFilter(filter)
                            setCurrentPage(1)
                          }}
                          className="flex items-center space-x-2"
                        >
                          <span>{filterLabels[filter]}</span>
                          <span className="bg-white bg-opacity-20 rounded-full px-2 py-0.5 text-xs">
                            {count}
                          </span>
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Breadcrumb Navigation */}
                {(currentFolder || folderPath.length > 0) && (
                  <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <button
                        onClick={goToRoot}
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                      >
                        <FolderOpen className="h-4 w-4" />
                        <span>My Documents</span>
                      </button>
                      {folderPath.map((folder, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <span className="text-gray-400">/</span>
                          <button
                            onClick={() => {
                              const newPath = folderPath.slice(0, index + 1)
                              setFolderPath(newPath)
                              setCurrentFolder(newPath[newPath.length - 1])
                              setCurrentPage(1)
                              setSearchQuery("")
                            }}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {folder}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Table Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                  {isLoading ? (
                    <div className="grid grid-cols-12 gap-4 animate-pulse">
                      <div className="col-span-5">
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-48"></div>
                      </div>
                      <div className="col-span-2">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                      <div className="col-span-2">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </div>
                      <div className="col-span-1">
                        <div className="h-4 bg-gray-200 rounded w-12"></div>
                      </div>
                      <div className="col-span-1">
                        <div className="h-4 bg-gray-200 rounded w-8"></div>
                      </div>
                      <div className="col-span-1">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-600">
                      <div className="col-span-5 flex items-center space-x-2">
                        <span>Name</span>
                        <div className="text-xs text-gray-400 font-normal">
                          (Folders first, then files - both A-Z)
                        </div>
                      </div>
                      <div className="col-span-2">Modified</div>
                      <div className="col-span-2">Size (Largest)</div>
                      <div className="col-span-1">Type</div>
                      <div className="col-span-1">Heat</div>
                      <div className="col-span-1">Action</div>
                    </div>
                  )}
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200">
                  {/* Skeleton Loading State */}
                  {isLoading && (
                    <>
                      {Array.from({ length: 10 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="px-6 py-3 animate-pulse">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-5 flex items-center space-x-3">
                              <div className="w-5 h-5 bg-gray-200 rounded"></div>
                              <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="h-4 bg-gray-200 rounded w-20"></div>
                            </div>
                            <div className="col-span-2">
                              <div className="h-4 bg-gray-200 rounded w-16"></div>
                            </div>
                            <div className="col-span-1">
                              <div className="h-4 bg-gray-200 rounded w-12"></div>
                            </div>
                            <div className="col-span-1">
                              <div className="h-4 bg-gray-200 rounded w-8"></div>
                            </div>
                            <div className="col-span-1">
                              <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  
                  {/* Actual Document List */}
                  {!isLoading && currentDocuments.map((doc) => {
                    const iconInfo = getFileIconComponent(doc.mimeType)
                    const IconComponent = iconInfo.component === 'FolderOpen' ? FolderOpen : 
                                         iconInfo.component === 'FileText' ? FileText : File
                    const isFolder = doc.mimeType?.includes('folder') || doc.type === "application/vnd.google-apps.folder"
                    
                    // Check if this is a duplicate file
                    const duplicateGroups = getDuplicateGroups()
                    const duplicateGroup = duplicateGroups.find(group => 
                      group.files.some(file => file.id === doc.id)
                    )
                    
                    // For duplicates filter, show the group count
                    const displayCount = activeFilter === 'duplicates' && duplicateGroup ? duplicateGroup.count : null
                    
                    return (
                      <div 
                        key={doc.id}
                        className={`px-6 py-3 transition-colors ${
                          isFolder 
                            ? 'hover:bg-blue-50 cursor-pointer' 
                            : 'hover:bg-gray-50 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (isFolder) {
                            enterFolder(doc.name)
                          }
                          // For files, you could add file preview or download functionality
                        }}
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-5 flex items-center space-x-3">
                            <IconComponent className={`h-5 w-5 ${iconInfo.color}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <span className={`hover:text-blue-600 truncate ${
                                  isFolder ? 'font-medium' : 'text-gray-900'
                                }`}>
                                  {doc.name}
                                </span>
                                {duplicateGroup && activeFilter === 'duplicates' && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    {displayCount} copies found
                                  </span>
                                )}
                              </div>
                              {/* Show folder info for documents */}
                              {!isFolder && doc.folder?.name && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <FolderOpen className="h-3 w-3 text-gray-400" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation() // Prevent parent row click
                                      // Only navigate if we're not already in this folder
                                      if (currentFolder !== doc.folder.name) {
                                        enterFolder(doc.folder.name)
                                      }
                                    }}
                                    className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors"
                                  >
                                    {doc.folder.name}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="col-span-2 text-sm text-gray-600">
                            {activeFilter === 'duplicates' ? (
                              formatRelativeTime(duplicateGroup?.latestModified || doc.modifiedTime)
                            ) : (
                              formatRelativeTime(doc.modifiedTime)
                            )}
                          </div>
                          <div className="col-span-2 text-sm text-gray-600">
                            {activeFilter === 'duplicates' ? (
                              formatFileSize(duplicateGroup?.largestSize || doc.size)
                            ) : (
                              getDisplaySize(doc)
                            )}
                          </div>
                          <div className="col-span-1 text-sm text-gray-600">
                            {getDisplayType(doc)}
                          </div>
                          <div className="col-span-1">
                            {!isFolder && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                getHeatLevel(activeFilter === 'duplicates' && duplicateGroup ? 
                                  { ...doc, modifiedTime: duplicateGroup.latestModified } : doc
                                ) === 'high' 
                                  ? 'bg-orange-100 text-orange-800' 
                                  : getHeatLevel(activeFilter === 'duplicates' && duplicateGroup ? 
                                      { ...doc, modifiedTime: duplicateGroup.latestModified } : doc
                                    ) === 'medium'
                                    ? 'bg-orange-50 text-orange-700'
                                    : 'bg-orange-25 text-orange-600'
                              }`}>
                                {getHeatLevel(activeFilter === 'duplicates' && duplicateGroup ? 
                                  { ...doc, modifiedTime: duplicateGroup.latestModified } : doc
                                ) === 'high' ? 'High' : 
                                 getHeatLevel(activeFilter === 'duplicates' && duplicateGroup ? 
                                   { ...doc, modifiedTime: duplicateGroup.latestModified } : doc
                                 ) === 'medium' ? 'Med' : 'Low'}
                               </span>
                             )}
                           </div>
                          <div className="col-span-1 flex justify-end">
                            <DocumentActionMenu
                              document={doc}
                              onOpenDocument={handleOpenDocument}
                              onDownloadDocument={() => handleDownload(doc)}
                              onShareDocument={handleShareDocument}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="border-t border-gray-200 px-6 py-4">
                    {isLoading ? (
                      <div className="flex items-center justify-between animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                        <div className="flex space-x-2">
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          <div className="w-8 h-8 bg-gray-200 rounded"></div>
                        </div>
                      </div>
                    ) : (
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
                    )}
                  </div>
                )}
              </div>


        {/* Open Document Modal */}
        {openModalOpen && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 modal-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Open Document</h3>
                <button
                  onClick={() => setOpenModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  This document will open in Google Docs for viewing and editing.
                </p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">{selectedDocument.name}</p>
                  <p className="text-xs text-gray-500">
                    {getDisplayType(selectedDocument)} • {formatFileSize(selectedDocument.size)}
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={() => {
                    // Generate fake Google Docs URL
                    const fakeDocId = Math.random().toString(36).substring(2, 15)
                    const googleDocsUrl = `https://docs.google.com/document/d/${fakeDocId}/edit`
                    window.open(googleDocsUrl, '_blank')
                    setOpenModalOpen(false)
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in Google Docs
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpenModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Share Document Modal */}
        {shareModalOpen && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 modal-content">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share Document</h3>
                <button
                  onClick={() => setShareModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-900">{selectedDocument.name}</p>
                  <p className="text-xs text-gray-500">
                    {getDisplayType(selectedDocument)} • {formatFileSize(selectedDocument.size)}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Share with people and groups
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="email"
                        placeholder="Enter email address"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="viewer">Can view</option>
                        <option value="commenter">Can comment</option>
                        <option value="editor">Can edit</option>
                      </select>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm">
                        Share
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Get link
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={`https://docs.google.com/document/d/${Math.random().toString(36).substring(2, 15)}/edit`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-600"
                      />
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`https://docs.google.com/document/d/${Math.random().toString(36).substring(2, 15)}/edit`)
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Anyone with the link can view this document
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShareModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
                    </>
      )}
    </div>
  </div>
</AppLayout>
  )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
      <AppLayout 
        showTopBar={true}
        topBarProps={{
          searchQuery: "",
          onSearchChange: () => {}
        }}
      >
        <div className="min-h-screen bg-white">
          <div className="px-6 py-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
                <div className="h-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    }>
      <DocumentsPageContent />
    </Suspense>
  )
}