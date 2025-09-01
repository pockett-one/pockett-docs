"use client"

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  FolderOpen, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  FileImage, 
  FileArchive,
  FileVideo,
  FileAudio,
  FileCode,
  File,
  MoreVertical,
  Search,
  Filter,
  Calendar,
  Clock,
  Users,
  Download,
  Share2,
  Bookmark,
  Eye,
  Edit,
  Trash2,
  Copy,
  Move,
  History,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  ExternalLink,
  HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentActionMenu } from '@/components/ui/document-action-menu'
import { AppLayout } from '@/components/layouts/app-layout'
import { TopBar } from '@/components/ui/top-bar'
import SearchDropdown from '@/components/ui/search-dropdown'
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { formatRelativeTime } from "@/lib/mock-data"
import { formatFileSize } from "@/lib/utils"
import { DocumentIcon } from "@/components/ui/document-icon"
import { TourGuide, useTourGuide, TourStep } from "@/components/ui/tour-guide"
import { shouldLoadMockData } from "@/lib/connection-utils"
import { documentAPIClient, DocumentItem, FolderItem, DocumentsResponse } from "@/lib/api-client"
import { reminderStorage, formatReminderTime, getReminderPriority } from "@/lib/reminder-storage"

// Remove the local getGoogleDriveMockData function and import
// import mockDataFile from '@/data/google-drive-api-mock.json'

// Helper function to check if an item is a folder
const isFolder = (item: any): boolean => {
  console.log('🔍 isFolder check for:', item.name, 'type:', item.type, 'mimeType:', item.mimeType)
  
  // Check for new API structure where type is "folder"
  if (item.type === 'folder') {
    console.log('✅ Identified as folder by type "folder":', item.name)
    return true
  }
  
  // Check for Google Drive API structure (converted documents)
  if (item.type === 'application/vnd.google-apps.folder') {
    console.log('✅ Identified as folder by type:', item.name)
    return true
  }
  
  // Check for original mimeType from JSON file
  if (item.mimeType === 'application/vnd.google-apps.folder') {
    console.log('✅ Identified as folder by mimeType:', item.name)
    return true
  }
  
  // Check for old structure compatibility
  if (item.type === 'folder' || item.mimeType?.includes('folder')) {
    console.log('✅ Identified as folder by legacy check:', item.name)
    return true
  }
  
  // Check if it's a GoogleDriveFolder (has no mimeType but is a folder)
  if (!('mimeType' in item) && 'parents' in item && item.type === 'application/vnd.google-apps.folder') {
    console.log('✅ Identified as folder by structure check:', item.name)
    return true
  }
  
  console.log('❌ Not identified as folder:', item.name)
  return false
}

// Helper function to get folder children by parent ID
const getFolderChildren = (files: any[], parentId: string): any[] => {
  return files.filter(file => file.parents && file.parents.includes(parentId))
}

// Helper function to build folder tree
const buildFolderTree = (files: any[], parentId: string | null = null): any[] => {
  const children = files.filter(file => {
    if (parentId === null) {
      // Root level - items with no parents or empty parents array
      return !file.parents || file.parents.length === 0
    } else {
      // Items that have this parent ID
      return file.parents && file.parents.includes(parentId)
    }
  })

  return children.map(item => ({
    ...item,
    children: isFolder(item) ? buildFolderTree(files, item.id) : []
  }))
}

// Helper function to get all items in a folder (including subfolders)
const getAllItemsInFolder = (files: any[], folderId: string): any[] => {
  const result: any[] = []
  
  const addItems = (currentFolderId: string) => {
    const directItems = files.filter(file => 
      file.parents && file.parents.includes(currentFolderId)
    )
    
    directItems.forEach(item => {
      result.push(item)
      if (isFolder(item)) {
        addItems(item.id)
      }
    })
  }
  
  addItems(folderId)
  return result
}

// Helper function to get direct items in a folder (no subfolders)
const getDirectItemsInFolder = (files: any[], folderId: string): any[] => {
  return files.filter(file => 
    file.parents && file.parents.includes(folderId)
  )
}

// Helper function to get folder path by ID
const getFolderPath = (files: any[], folderId: string): string[] => {
  const path: string[] = []
  
  const buildPath = (currentId: string) => {
    const currentItem = files.find(f => f.id === currentId)
    if (currentItem && currentItem.parents && currentItem.parents.length > 0) {
      const parentId = currentItem.parents[0]
      buildPath(parentId)
      path.push(currentItem.name)
    } else if (currentItem) {
      path.push(currentItem.name)
    }
  }
  
  buildPath(folderId)
  return path
}

function DocumentsPageContent() {
  console.log('🚀 DocumentsPageContent component is rendering!')
  
  const searchParams = useSearchParams()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState<'all' | 'hour' | '7days' | '30days' | '90days' | 'dormant' | 'duplicates'>('all')
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [folderPath, setFolderPath] = useState<string[]>([])
  const [selectedDocument, setSelectedDocument] = useState<any>(null)
  const [openModalOpen, setOpenModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasConnections, setHasConnections] = useState(true)
  const [isClient, setIsClient] = useState(false)

  // Add useEffect to ensure component is mounting
  useEffect(() => {
    console.log('🚀 DocumentsPageContent useEffect - component mounted!')
    console.log('📁 Component state initialized')
  }, [])

  // Ensure client-side rendering for dynamic content
  useEffect(() => {
    console.log('🔍 Setting isClient to true')
    setIsClient(true)
  }, [])

  // Add loading delay for skeleton effect
  useEffect(() => {
    if (hasConnections && isClient) { // hasConnections and isClient are not defined in the new_code.
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 300)
      
      return () => clearTimeout(timer)
    }
  }, [hasConnections, isClient]) // hasConnections and isClient are not defined.

  // Check connection status on mount and when connections change
  useEffect(() => {
    const checkConnections = () => {
      const shouldLoad = shouldLoadMockData()
      console.log('🔍 Connection check:', shouldLoad)
      setHasConnections(shouldLoad)
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

  // Tour guide functionality
  const { shouldShowTour, isTourOpen, startTour, closeTour, forceStartTour } = useTourGuide('Documents')





  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Documents',
      content: 'This is your central hub for managing all your documents and folders. Let me show you around!',
      target: '.documents-header',
      position: 'bottom',
      action: 'none'
    },
    {
      id: 'search',
      title: 'Search & Filter',
      content: 'Use the search bar to quickly find documents, or click the filter button to narrow down by file type, date, or size.',
      target: '.search-section',
      position: 'bottom',
      action: 'hover',
      actionText: 'Try hovering over the search bar'
    },
    {
      id: 'view-modes',
      title: 'View Modes',
      content: 'Switch between grid and list views. Grid view shows thumbnails, while list view provides more details.',
      target: '.view-controls',
      position: 'bottom',
      action: 'click',
      actionText: 'Try switching view modes'
    },
    {
      id: 'sorting',
      title: 'Sorting Options',
      content: 'Organize your documents by name, modification date, size, or type. Click the column headers to sort.',
      target: '.sort-controls',
      position: 'bottom',
      action: 'hover',
      actionText: 'Hover over sorting options'
    },
    {
      id: 'document-actions',
      title: 'Document Actions',
      content: 'Each document has a menu with actions like download, share, move, or delete. Click the three dots to see options.',
      target: '.document-item:first-child',
      position: 'right',
      action: 'hover',
      actionText: 'Hover over a document to see actions'
    },
    {
      id: 'folder-navigation',
      title: 'Folder Navigation',
      content: 'Click on folders to navigate inside them. Use the breadcrumb trail to go back to previous levels.',
      target: '.breadcrumb-section',
      position: 'bottom',
      action: 'hover',
      actionText: 'Hover over breadcrumb items'
    },
    {
      id: 'bulk-actions',
      title: 'Bulk Operations',
      content: 'Select multiple documents to perform bulk actions like moving, sharing, or deleting multiple files at once.',
      target: '.bulk-actions',
      position: 'top',
      action: 'none'
    }
  ]

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

  // State for API data
  const [apiData, setApiData] = useState<DocumentsResponse | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(false)
  
  // Load data from API
  useEffect(() => {
    console.log('🔍 Data loading useEffect triggered:', { hasConnections, isClient })
    if (hasConnections && isClient) {
      console.log('🔄 Loading data from new API...')
      setIsLoadingData(true)
      
      const loadData = async () => {
        try {
          console.log('🔄 Starting API call...')
          const data = await documentAPIClient.fetchDocuments()
          console.log('📁 API data loaded:', data.documents.length, 'documents,', data.folders.length, 'folders')
          setApiData(data)
          console.log('✅ API data set in state')
        } catch (error) {
          console.error('❌ Failed to load data from API:', error)
          // You can add fallback logic here if needed
        } finally {
          console.log('🔄 Setting isLoadingData to false')
          setIsLoadingData(false)
        }
      }
      
      loadData()
    } else {
      console.log('❌ Not loading data:', { hasConnections, isClient })
    }
  }, [hasConnections, isClient])
  
  const allDocuments = useMemo(() => {
    if (!apiData) return []
    
    console.log('🔄 Processing API data...')
    console.log('📁 Raw API data:', apiData)
    console.log('📁 Documents count:', apiData.documents?.length || 0)
    console.log('📁 Folders count:', apiData.folders?.length || 0)
    
    // Convert the API data format to the format expected by the page
    const documents = apiData.documents || []
    const folders = apiData.folders || []
    
    // Combine documents and folders for processing
    const allItems = [...documents, ...folders]
    
    console.log('📁 Final allDocuments:', allItems.length)
    console.log('📁 Sample items:', allItems.slice(0, 3).map(item => ({ 
      name: item.name, 
      type: 'type' in item ? item.type : 'folder', 
      parents: item.parents 
    })))
    
    // Debug: Check a few items in detail
    console.log('🔍 Detailed item analysis:')
    allItems.slice(0, 5).forEach((item, index) => {
      console.log(`Item ${index}:`, {
        name: item.name,
        type: item.type,
        hasType: 'type' in item,
        isFolder: isFolder(item),
        parents: item.parents
      })
    })
    
    return allItems
  }, [apiData])

  // Get documents in the current folder
  const getDocumentsInCurrentFolder = useCallback(() => {
    if (!apiData) return []
    
    console.log('🔍 Getting documents in current folder:', currentFolder)
    console.log('📁 Available documents:', apiData.documents?.length || 0)
    console.log('📁 Available folders:', apiData.folders?.length || 0)
    console.log('📁 All folders:', apiData.folders?.map((f: FolderItem) => ({ name: f.name, parents: f.parents })) || [])
    
    if (!currentFolder) {
      // Root level - show top-level folders and files
      // For Google Drive, "Google Drive" is the connector folder, so we show its direct children
      const googleDriveFolder = apiData.folders?.find((folder: FolderItem) => 
        folder.name === 'Google Drive' && (!folder.parents || folder.parents.length === 0)
      )
      
      if (googleDriveFolder) {
        console.log('🏠 Found Google Drive connector folder:', googleDriveFolder)
        
        // Show only the Google Drive folder at root level
        // Users must click into it to see its contents
        return [googleDriveFolder]
      } else {
        // Fallback: show folders with no parents
        const rootFolders = apiData.folders?.filter((folder: FolderItem) => 
          !folder.parents || folder.parents.length === 0
        ) || []
        
        const rootDocuments = apiData.documents?.filter((doc: DocumentItem) => 
          !doc.parents || doc.parents.length === 0
        ) || []
        
        console.log('📁 Root folders found:', rootFolders.length)
        console.log('📁 Root documents found:', rootDocuments.length)
        
        return [...rootFolders, ...rootDocuments]
      }
    }
    
    // Find the current folder by name
    const currentFolderItem = apiData.folders?.find((item: FolderItem) => 
      item.name === currentFolder && isFolder(item)
    )
    
    if (!currentFolderItem) {
      console.log('❌ Current folder not found:', currentFolder)
      return []
    }
    
    console.log('✅ Current folder found:', currentFolderItem)
    
    // Get direct children of this folder
    const directChildren = getDirectItemsInFolder([...apiData.documents || [], ...apiData.folders || []], currentFolderItem.id)
    
    console.log('🔍 Direct children found:', directChildren.length)
    return directChildren
  }, [currentFolder, apiData])

  // Handle folder navigation
  const enterFolder = (folderName: string) => {
    if (!apiData) return
    
    console.log(`📁 Entering folder: ${folderName}`)
    console.log('📁 Available folders:', apiData.folders?.length || 0)
    
    // Find the folder by name in the current context
    const folderToEnter = apiData.folders?.find((item: FolderItem) => 
      item.name === folderName && isFolder(item)
    )
    
    if (!folderToEnter) {
      console.log('❌ Folder not found:', folderName)
      console.log('📁 Available folder names:', apiData.folders?.map((f: FolderItem) => f.name) || [])
      return
    }
    
    console.log(`✅ Found folder: ${folderName} with ID: ${folderToEnter.id}`)
    
    // Update state
    setCurrentFolder(folderName)
    setFolderPath([...folderPath, folderName])
    setCurrentPage(1)
    setSearchQuery("")
    setActiveFilter('all')
    
    console.log(`📁 Navigated to folder: ${folderName}`)
    console.log(`📁 Current folder path:`, [...folderPath, folderName])
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

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (index: number) => {
    if (index === 0) {
      // Go to root
      setCurrentFolder(null)
      setFolderPath([])
      setCurrentPage(1)
      setSearchQuery("")
      setActiveFilter('all')
      console.log('🏠 Navigated to root')
    } else {
      // Navigate to specific folder in path
      const targetFolder = folderPath[index - 1]
      const targetPath = folderPath.slice(0, index)
      
      setCurrentFolder(targetFolder)
      setFolderPath(targetPath)
      setCurrentPage(1)
      setSearchQuery("")
      setActiveFilter('all')
      
      console.log(`📁 Navigated to breadcrumb: ${targetFolder}`)
      console.log(`📁 New folder path:`, targetPath)
    }
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
      if (isFolder(doc)) return // Skip folders for timeline filters
      
      const period = getDocumentAccessPeriod(doc)
      if (period in counts) {
        counts[period as keyof typeof counts]++
      }
    })

    // Count duplicates (files with same name)
    const nameCounts: { [key: string]: number } = {}
    docsInCurrentFolder.forEach(doc => {
      if (isFolder(doc)) return
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
      if (isFolder(doc)) return
      if (!nameCounts[doc.name]) {
        nameCounts[doc.name] = 0
      }
      nameCounts[doc.name]++
    })
    
    // Create groups for duplicates
    Object.entries(nameCounts).forEach(([name, count]) => {
      if (count > 1) {
        const files = docsInCurrentFolder.filter(doc => 
          doc.name === name && !isFolder(doc)
        )
        
        // Find latest modification time and largest size
        const latestModified = files.reduce((latest, file) => {
          const fileTime = new Date(file.modifiedTime).getTime()
          const latestTime = new Date(latest).getTime()
          return fileTime > latestTime ? file.modifiedTime : latest
        }, files[0].modifiedTime)
        
        const largestSize = files.reduce((largest, file) => {
          const fileSize = typeof file.size === 'string' ? parseInt(file.size) || 0 : (file.size || 0)
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
      if (isFolder(doc)) return false
      const period = getDocumentAccessPeriod(doc)
      return period === activeFilter
    })
  }

  const filteredDocuments = getFilteredDocuments().filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Sort documents: Folders first, then files, both alphabetically
  const sortedDocuments = filteredDocuments.sort((a, b) => {
    // Use the isFolder function for proper folder detection
    const aIsFolder = isFolder(a)
    const bIsFolder = isFolder(b)
    
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
    if (isFolder(doc)) return "-"
    return formatFileSize(doc.size)
  }

  const getDisplayType = (doc: any) => {
    console.log('🔍 getDisplayType called for:', doc.name, 'with type:', doc.type, 'isFolder:', isFolder(doc))
    
    if (isFolder(doc)) return "Folder"
    
    // Check the type property (which contains the MIME type from our mock data)
    if (doc.type?.includes('document')) return "Document"
    if (doc.type?.includes('spreadsheet')) return "Spreadsheet"
    if (doc.type?.includes('presentation')) return "Presentation"
    if (doc.type?.includes('pdf')) return "PDF"
    
    // Fallback to checking mimeType if it exists
    if (doc.mimeType?.includes('document')) return "Document"
    if (doc.mimeType?.includes('spreadsheet')) return "Spreadsheet"
    if (doc.mimeType?.includes('presentation')) return "Presentation"
    if (doc.mimeType?.includes('pdf')) return "PDF"
    
    // If we can't determine the type, show "File"
    console.log('⚠️ Could not determine type for:', doc.name, 'falling back to "File"')
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
    if (isFolder(doc)) return

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
        searchQuery: "",
        onSearchChange: () => {},
        onStartTour: forceStartTour,
        showTourButton: true,
        tourButtonText: "Take Tour"
      }}
    >
      <div className="min-h-screen bg-white">

      
      {/* Main Content */}
      <div className="px-6 py-6">

        
        {!hasConnections ? (
          <EmptyState type="documents" />
        ) : (
          <>
            {/* Header with Tour Button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <span className="text-lg font-medium text-gray-900">
                  {currentFolder ? `📁 ${currentFolder}` : 'My Documents'}
                </span>
                {!currentFolder && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {allDocuments.length} items
                  </span>
                )}
              </div>
              

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
                          setActiveFilter(filter as 'all' | 'hour' | '7days' | '30days' | '90days' | 'dormant' | 'duplicates')
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
                      onClick={() => handleBreadcrumbClick(0)}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
                    >
                      <FolderOpen className="h-4 w-4" />
                      <span>My Documents</span>
                    </button>
                    {folderPath.map((folder, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <span className="text-gray-400">/</span>
                        <button
                          onClick={() => handleBreadcrumbClick(index + 1)}
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
                
                {/* Loading State */}
                {isLoadingData && (
                  <div className="px-6 py-8 text-center">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-gray-600">Loading documents...</span>
                    </div>
                  </div>
                )}
                
                {/* Actual Document List */}
                {!isLoading && !isLoadingData && apiData && currentDocuments.map((doc) => {
                  const isFolderItem = isFolder(doc)
                 
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
                        isFolderItem 
                          ? 'hover:bg-blue-50 cursor-pointer' 
                          : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                      onClick={() => {
                        if (isFolderItem) {
                          enterFolder(doc.name)
                        }
                        // For files, you could add file preview or download functionality
                      }}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-5 flex items-center space-x-3">
                          <DocumentIcon mimeType={doc.mimeType} size={20} name={doc.name} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className={`hover:text-blue-600 truncate ${
                                isFolderItem ? 'font-medium' : 'text-gray-900'
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
                            {!isFolderItem && doc.folder?.name && (
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
                            {/* Show due date for documents */}
                            {!isFolderItem && doc.dueDate && (
                              <div className="flex items-center space-x-1 mt-1">
                                <Calendar className="h-3 w-3 text-orange-500" />
                                <span className={`text-xs font-medium ${
                                  getReminderPriority(doc.dueDate) === 'urgent' 
                                    ? 'text-red-600' 
                                    : getReminderPriority(doc.dueDate) === 'high'
                                    ? 'text-orange-600'
                                    : 'text-gray-600'
                                }`}>
                                  {formatReminderTime(doc.dueDate)}
                                </span>
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
                          {!isFolderItem && (
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

             {/* Modals */}
             {openModalOpen && selectedDocument && (
               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                 <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-medium">Open Document</h3>
                     <button
                       onClick={() => setOpenModalOpen(false)}
                       className="text-gray-400 hover:text-gray-600"
                     >
                       <XCircle className="h-6 w-6" />
                     </button>
                   </div>
                   <div className="space-y-4">
                     <div className="flex items-center space-x-3">
                       <FileText className="h-8 w-8 text-blue-600" />
                       <div>
                         <p className="text-sm font-medium text-gray-900">{selectedDocument.name}</p>
                         <p className="text-xs text-gray-500">
                           {getDisplayType(selectedDocument)} • {formatFileSize(selectedDocument.size)}
                         </p>
                       </div>
                     </div>
                     <div className="flex space-x-3">
                       <Button className="flex-1" onClick={() => handleDownload(selectedDocument)}>
                         <Download className="h-4 w-4 mr-2" />
                         Download
                       </Button>
                       <Button variant="outline" className="flex-1" onClick={() => handleShareDocument(selectedDocument)}>
                         <Share2 className="h-4 w-4 mr-2" />
                         Share
                       </Button>
                     </div>
                   </div>
                 </div>
               </div>
             )}

             {shareModalOpen && selectedDocument && (
               <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                 <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-medium">Share Document</h3>
                     <button
                       onClick={() => setShareModalOpen(false)}
                       className="text-gray-400 hover:text-gray-600"
                     >
                       <XCircle className="h-6 w-6" />
                     </button>
                   </div>
                   
                   <div className="space-y-4">
                     <div className="flex items-center space-x-3">
                       <FileText className="h-8 w-8 text-blue-600" />
                       <div>
                         <p className="text-sm font-medium text-gray-900">{selectedDocument.name}</p>
                         <p className="text-xs text-gray-500">
                           {getDisplayType(selectedDocument)} • {formatFileSize(selectedDocument.size)}
                         </p>
                       </div>
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
     
     {/* Tour Guide */}
     <TourGuide
       isOpen={isTourOpen}
       onClose={closeTour}
       steps={tourSteps}
       pageName="Documents"
       onComplete={() => console.log('🎯 Documents tour completed!')}
     />
     

   </AppLayout>
   )
}

export default function DocumentsPage() {
  return (
    <Suspense fallback={
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
    }>
      <DocumentsPageContent />
    </Suspense>
  )
}