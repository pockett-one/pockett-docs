import { NextRequest, NextResponse } from 'next/server'
import { DocumentItem, FolderItem } from '@/lib/types'
import mockGoogleDriveResponse from '@/data/google-drive-api-mock.json'

// Search and filter options interface
interface SearchOptions {
  query?: string
  type?: 'all' | 'documents' | 'folders'
  fileType?: string
  dateFrom?: string
  dateTo?: string
  sizeMin?: number
  sizeMax?: number
  parentFolder?: string
  limit?: number
  offset?: number
}

// Helper function to search within text
function searchInText(text: string, query: string): boolean {
  if (!query) return true
  return text.toLowerCase().includes(query.toLowerCase())
}

// Helper function to check if date is within range
function isDateInRange(dateStr: string, from?: string, to?: string): boolean {
  if (!from && !to) return true
  
  const date = new Date(dateStr)
  if (from && date < new Date(from)) return false
  if (to && date > new Date(to)) return false
  return true
}

// Helper function to check if size is within range
function isSizeInRange(size: number, min?: number, max?: number): boolean {
  if (min !== undefined && size < min) return false
  if (max !== undefined && size > max) return false
  return true
}

// Helper function to get folder path by ID
function getFolderPathById(files: any[], folderId: string): string {
  if (!folderId) return '/'
  
  const path: string[] = []
  let currentId = folderId
  
  while (currentId) {
    const folder = files.find(f => f.id === currentId)
    if (folder) {
      path.unshift(folder.name)
      currentId = folder.parents?.[0] || ''
    } else {
      break
    }
  }
  
  if (path.length > 0) {
    path[0] = 'My Documents'
  }
  
  return '/' + path.join('/')
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Search API: Processing search request')
    
    // Parse search parameters
    const { searchParams } = new URL(request.url)
    const options: SearchOptions = {
      query: searchParams.get('q') || undefined,
      type: (searchParams.get('type') as any) || 'all',
      fileType: searchParams.get('fileType') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sizeMin: searchParams.get('sizeMin') ? parseInt(searchParams.get('sizeMin')!) : undefined,
      sizeMax: searchParams.get('sizeMax') ? parseInt(searchParams.get('sizeMax')!) : undefined,
      parentFolder: searchParams.get('parentFolder') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    }
    
    console.log('🔍 Search options:', options)
    
    // Get the base data (same logic as main documents API)
    const googleDriveData = mockGoogleDriveResponse
    
    // Create Google Drive connector folder
    const googleDriveConnectorFolder: FolderItem = {
      id: 'google-drive-connector',
      name: 'Google Drive',
      type: 'folder',
      path: '/My Documents/Google Drive',
      parents: [],
      documentCount: 0,
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString()
    }
    
    // Transform existing folders
    const convertedFolders: FolderItem[] = googleDriveData.files
      .filter(file => file.mimeType === 'application/vnd.google-apps.folder')
      .filter(folder => folder.name !== 'My Drive')
      .map(folder => {
        const isDirectChildOfMyDrive = folder.parents && folder.parents.includes('0BwwA4oUTeiV1TGRPeTVjaWRDY1E')
        if (isDirectChildOfMyDrive) {
          return {
            id: folder.id,
            name: folder.name,
            type: 'folder',
            path: `/My Documents/Google Drive/${folder.name}`,
            parents: ['google-drive-connector'],
            documentCount: 0,
            createdTime: folder.createdTime,
            modifiedTime: folder.modifiedTime
          }
        }
        
        let newParentId = folder.parents?.[0]
        if (newParentId === '0BwwA4oUTeiV1TGRPeTVjaWRDY1E') {
          newParentId = 'google-drive-connector'
        }
        
        return {
          id: folder.id,
          name: folder.name,
          type: 'folder',
          path: `/My Documents/Google Drive${getFolderPathById(googleDriveData.files, folder.id).replace('/My Documents', '')}`,
          parents: newParentId ? [newParentId] : [],
          documentCount: 0,
          createdTime: folder.createdTime,
          modifiedTime: folder.modifiedTime
        }
      })
    
    // Create documents dynamically (same logic as main API)
    const allDocuments: DocumentItem[] = []
    convertedFolders.forEach(folder => {
      let docCount = Math.floor(Math.random() * 8) + 5
      let folderType = 'general'
      
      if (folder.path.includes('/Finance/')) {
        folderType = 'finance'
        docCount = Math.floor(Math.random() * 8) + 5
      } else if (folder.path.includes('/Executive/')) {
        folderType = 'executive'
        docCount = Math.floor(Math.random() * 6) + 4
      } else if (folder.path.includes('/Archive/')) {
        folderType = 'archive'
        docCount = Math.floor(Math.random() * 10) + 8
      } else if (folder.path.includes('/Work/')) {
        folderType = 'work'
        docCount = Math.floor(Math.random() * 8) + 6
      }
      
      for (let i = 0; i < docCount; i++) {
        const docId = `doc_${folder.id}_${i}`
        const fileTypes = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png']
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)]
        
        // Generate document names based on folder context
        let fileName = ''
        if (folder.name === '2022') {
          const year2022Names = ['2022 Annual Report', '2022 Strategic Plan', '2022 Financial Summary', '2022 Budget Review', '2022 Performance Metrics']
          fileName = `${year2022Names[i % year2022Names.length]}.${fileType}`
        } else if (folder.name === '2023') {
          const year2023Names = ['2023 Annual Report', '2023 Strategic Plan', '2023 Financial Summary', '2023 Budget Review', '2023 Performance Metrics']
          fileName = `${year2023Names[i % year2023Names.length]}.${fileType}`
        } else if (folder.name === '2024') {
          const year2024Names = ['2024 Q1 Report', '2024 Q2 Report', '2024 Q3 Report', '2024 Strategic Update', '2024 Performance Review']
          fileName = `${year2024Names[i % year2024Names.length]}.${fileType}`
        } else {
          fileName = `${folder.name} Document ${i + 1}.${fileType}`
        }
        
        let mimeType = 'application/octet-stream'
        let fileSize = 1024000
        
        switch (fileType) {
          case 'pdf':
            mimeType = 'application/pdf'
            fileSize = Math.floor(Math.random() * 5000000) + 1000000
            break
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            fileSize = Math.floor(Math.random() * 2000000) + 100000
            break
          case 'xlsx':
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            fileSize = Math.floor(Math.random() * 3000000) + 200000
            break
          case 'pptx':
            mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            fileSize = Math.floor(Math.random() * 10000000) + 1000000
            break
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg'
            fileSize = Math.floor(Math.random() * 5000000) + 100000
            break
          case 'png':
            mimeType = 'image/png'
            fileSize = Math.floor(Math.random() * 3000000) + 100000
            break
        }
        
        const document: DocumentItem = {
          id: docId,
          name: fileName,
          type: mimeType,
          mimeType: mimeType,
          size: fileSize,
          path: `${folder.path}/${fileName}`,
          modifiedTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          createdTime: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          lastAccessed: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
          accessCount: Math.floor(Math.random() * 50) + 1,
          sharing: {
            shared: Math.random() > 0.5,
            sharedWith: Math.random() > 0.5 ? ['team@company.com'] : [],
            sharingStatus: Math.random() > 0.5 ? 'active' : 'private',
            expiryDate: null,
            createdDate: new Date().toISOString(),
            permissions: []
          },
          engagement: {
            views: Math.floor(Math.random() * 100) + 10,
            downloads: Math.floor(Math.random() * 30) + 1,
            comments: Math.floor(Math.random() * 20) + 1,
            shares: Math.floor(Math.random() * 10) + 1
          },
          isDuplicate: false,
          contributors: [
            {
              displayName: 'Team Member',
              role: 'Editor',
              edits: Math.floor(Math.random() * 20) + 1,
              comments: Math.floor(Math.random() * 10) + 1,
              lastActivity: new Date().toISOString(),
              emailAddress: 'team@company.com'
            }
          ],
          parents: [folder.id],
          status: 'active'
        }
        
        allDocuments.push(document)
      }
    })
    
    // Apply search filters
    let searchResults: (DocumentItem | FolderItem)[] = []
    
    // Combine documents and folders based on type filter
    if (options.type === 'documents') {
      searchResults = allDocuments
    } else if (options.type === 'folders') {
      searchResults = [googleDriveConnectorFolder, ...convertedFolders]
    } else {
      searchResults = [googleDriveConnectorFolder, ...convertedFolders, ...allDocuments]
    }
    
    // Apply text search
    if (options.query) {
      searchResults = searchResults.filter(item => {
        if ('mimeType' in item) {
          // Document
          return searchInText(item.name, options.query!) ||
                 searchInText(item.path, options.query!)
        } else {
          // Folder
          return searchInText(item.name, options.query!) ||
                 searchInText(item.path, options.query!)
        }
      })
    }
    
    // Apply file type filter
    if (options.fileType && options.type !== 'folders') {
      searchResults = searchResults.filter(item => {
        if ('mimeType' in item && item.mimeType) {
          return item.mimeType.includes(options.fileType!)
        }
        return true
      })
    }
    
    // Apply date filters
    if (options.dateFrom || options.dateTo) {
      searchResults = searchResults.filter(item => {
        if ('mimeType' in item) {
          return isDateInRange(item.modifiedTime, options.dateFrom, options.dateTo)
        } else {
          return isDateInRange(item.modifiedTime, options.dateFrom, options.dateTo)
        }
      })
    }
    
    // Apply size filters (only for documents)
    if ((options.sizeMin !== undefined || options.sizeMax !== undefined) && options.type !== 'folders') {
      searchResults = searchResults.filter(item => {
        if ('mimeType' in item) {
          const documentItem = item as DocumentItem
          return documentItem.size !== undefined && isSizeInRange(documentItem.size, options.sizeMin, options.sizeMax)
        }
        return true
      })
    }
    
    // Apply parent folder filter
    if (options.parentFolder) {
      searchResults = searchResults.filter(item => {
        if ('mimeType' in item) {
          // Document - check if it's in the specified parent folder
          return item.parents && item.parents.includes(options.parentFolder!)
        } else {
          // Folder - check if it's a child of the specified parent
          return item.parents && item.parents.includes(options.parentFolder!)
        }
      })
    }
    
    // Apply pagination
    const totalResults = searchResults.length
    const offset = options.offset || 0
    const limit = options.limit || 50
    const paginatedResults = searchResults.slice(offset, offset + limit)
    
    // Separate results by type
    const documents = paginatedResults.filter(item => 'mimeType' in item) as DocumentItem[]
    const folders = paginatedResults.filter(item => !('mimeType' in item)) as FolderItem[]
    
    const response = {
      query: options.query || '',
      totalResults,
      totalDocuments: documents.length,
      totalFolders: folders.length,
      results: {
        documents,
        folders
      },
      pagination: {
        limit: limit,
        offset: offset,
        hasMore: offset + limit < totalResults
      },
      filters: {
        type: options.type,
        fileType: options.fileType,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
        sizeMin: options.sizeMin,
        sizeMax: options.sizeMax,
        parentFolder: options.parentFolder
      },
      searchTime: new Date().toISOString()
    }
    
    console.log(`✅ Search completed: ${totalResults} results found`)
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    console.error('❌ Search API Error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
