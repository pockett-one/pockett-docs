import mockResponse from '@/data/google-drive-api-mock.json'
import { shouldLoadMockData } from './connection-utils'
import { logger } from '@/lib/logger'

// Helper function to get folder name by ID
function getFolderNameById(folders: GoogleDriveFile[], folderId: string): string {
  const folder = folders.find(f => f.id === folderId)
  return folder ? folder.name : 'Unknown Folder'
}

// Helper function to get folder path by ID
function getFolderPathById(folderId: string): string {
  if (!folderId) return '/'
  
  const path: string[] = []
  let currentId = folderId
  
  while (currentId) {
    const folder = mockResponse.files?.find(f => f.id === currentId)
    if (folder) {
      path.unshift(folder.name)
      currentId = folder.parents?.[0] || ''
    } else {
      break
    }
  }
  
  // If we have a path, replace the root folder name with "My Documents"
  if (path.length > 0) {
    path[0] = 'My Documents'
  }
  
  return '/' + path.join('/')
}

// Helper function to get document count in a folder
function getDocumentCountInFolder(documents: GoogleDriveDocument[], folderId: string): number {
  return documents.filter(doc => doc.parents && doc.parents.includes(folderId)).length
}

export interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  parents: string[]
  webViewLink?: string
  webContentLink?: string
  iconLink?: string
  thumbnailLink?: string
  createdTime: string
  modifiedTime: string
  viewedByMeTime?: string
  version?: string
  size?: string | number
  trashed?: boolean
  starred?: boolean
  explicitlyTrashed?: boolean
  permissions?: GoogleDrivePermission[]
  sharing?: GoogleDriveSharing
  capabilities?: GoogleDriveCapabilities
  contentHints?: GoogleDriveContentHints
  exportLinks?: { [key: string]: string | undefined } // Fixed to allow undefined values
  lastModifyingUser?: GoogleDriveUser
  ownedByMe?: boolean
  writersCanShare?: boolean
  copyRequiresWriterPermission?: boolean
  isAppAuthorized?: boolean
}

export interface GoogleDrivePermission {
  id: string
  type: string // Changed from union type to string for JSON compatibility
  emailAddress?: string
  displayName?: string
  photoLink?: string
  role: string // Changed from union type to string for JSON compatibility
  permissionDetails?: Array<{
    permissionType: string
    role: string
  }>
  deleted?: boolean
  expirationTime?: string
  allowFileDiscovery?: boolean
}

export interface GoogleDriveSharing {
  shared: boolean
  sharedWithMeTime?: string
}

export interface GoogleDriveCapabilities {
  canAddChildren?: boolean
  canChangeViewersCanCopyContent?: boolean
  canComment?: boolean
  canCopy?: boolean
  canDelete?: boolean
  canDownload?: boolean
  canEdit?: boolean
  canListChildren?: boolean
  canModifyContent?: boolean
  canMoveChildrenOutOfDrive?: boolean
  canMoveChildrenWithinDrive?: boolean
  canReadRevisions?: boolean
  canRename?: boolean
  canShare?: boolean
  canTrash?: boolean
  canUntrash?: boolean
}

export interface GoogleDriveContentHints {
  indexableText?: string
  thumbnail?: {
    image: string
    mimeType: string
  }
}

export interface GoogleDriveUser {
  displayName: string
  emailAddress: string
  photoLink: string
  me: boolean
}

export interface GoogleDriveDocument {
  id: string
  name: string
  type: string
  mimeType?: string
  size: number
  path: string
  modifiedTime: string
  createdTime: string
  lastAccessed: string
  lastAccessedTime?: string
  accessCount: number
  sharing: {
    shared: boolean
    sharedWith: string[]
    sharingStatus: string
    expiryDate: string | null
    createdDate: string
    permissions: Array<{
      type: string
      role: string
      email?: string
      name?: string
      expires?: string
    }>
  }
  engagement: {
    views: number
    downloads: number
    comments: number
    shares: number
  }
  isDuplicate: boolean
  contributors: Array<{
    displayName: string
    role: string
    edits: number
    comments: number
    lastActivity: string
    emailAddress: string
  }>
  parents: string[]
  owners?: Array<{
    displayName: string
    emailAddress: string
    photoLink: string
  }>
  folder?: {
    id: string
    name: string
    path: string
  }
  duplicateCount?: number
  tags?: string[]
  status?: string
  // Google Drive API specific properties
  webViewLink?: string
  webContentLink?: string
  iconLink?: string
  thumbnailLink?: string
  viewedByMeTime?: string
  version?: string
  trashed?: boolean
  starred?: boolean
  explicitlyTrashed?: boolean
  permissions?: GoogleDrivePermission[]
  capabilities?: GoogleDriveCapabilities
  contentHints?: GoogleDriveContentHints
  exportLinks?: { [key: string]: string | undefined }
  lastModifyingUser?: GoogleDriveUser
  ownedByMe?: boolean
  writersCanShare?: boolean
  copyRequiresWriterPermission?: boolean
  isAppAuthorized?: boolean
}

export interface GoogleDriveFolder {
  id: string
  name: string
  type: string // Add type property for folder identification
  path: string
  parents?: string[]
  documentCount: number
  createdTime: string
  modifiedTime: string
}

export interface TopContributor {
  displayName: string
  emailAddress: string
  documentsCount: number
  editsCount: number
  commentsCount: number
  totalActivity: number
}

export interface MockData {
  totalDocuments: number
  totalFolders: number
  lastSyncTime: string
  documents: GoogleDriveDocument[]
  folders: GoogleDriveFolder[]
  summary: {
    totalDocuments: number
    totalFolders: number
    fileTypes: {
      documents: number
      spreadsheets: number
      presentations: number
      pdfs: number
    }
    engagementSummary: {
      pastHour: number
      past7Days: number
      past30Days: number
      past90Days: number
      dormant: number
      duplicates: number
    }
    sharingStatus: {
      active: number
      expiring: number
      expired: number
      private: number
    }
    topContributors: TopContributor[]
  }
}

export function getMockData(): MockData {
  logger.debug('🔄 Loading new Google Drive API mock data...')
  
  // Convert Google Drive API structure to MockData interface
  const convertedDocuments: GoogleDriveDocument[] = (mockResponse.files || [])
    .filter((file: any) => file.mimeType !== 'application/vnd.google-apps.folder')
    .map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      type: doc.mimeType,
      mimeType: doc.mimeType, // Add mimeType property for icon detection
      size: typeof doc.size === 'string' ? parseInt(doc.size) : doc.size || 0,
      path: getFolderPathById(doc.parents?.[0] || ''),
      modifiedTime: doc.modifiedTime,
      createdTime: doc.createdTime,
      accessCount: Math.floor(Math.random() * 100) + 1,
      lastAccessed: doc.viewedByMeTime || doc.modifiedTime,
      sharing: {
        shared: doc.sharing?.shared || Math.random() > 0.7,
        sharedWith: doc.permissions?.filter((p: any) => p.type === 'user' && p.role !== 'owner').map((p: any) => p.emailAddress || p.displayName || 'Unknown User') || [],
        sharingStatus: doc.permissions?.some((p: any) => p.type === 'anyone') ? 'public' : 'private',
        expiryDate: doc.permissions?.find((p: any) => p.expirationTime)?.expirationTime || null,
        createdDate: doc.sharing?.sharedWithMeTime || doc.createdTime,
        permissions: doc.permissions?.map((p: any) => ({
          type: p.type,
          role: p.role,
          email: p.emailAddress,
          name: p.displayName,
          expires: p.expirationTime
        })) || []
      },
      engagement: {
        views: Math.floor(Math.random() * 500) + 10,
        downloads: Math.floor(Math.random() * 50) + 1,
        comments: Math.floor(Math.random() * 20),
        shares: Math.floor(Math.random() * 10)
      },
      isDuplicate: Math.random() > 0.9,
      contributors: [
        {
          displayName: doc.lastModifyingUser?.displayName || 'Unknown User',
          role: 'Editor',
          edits: Math.floor(Math.random() * 50) + 1,
          comments: Math.floor(Math.random() * 20),
          lastActivity: doc.modifiedTime,
          emailAddress: doc.lastModifyingUser?.emailAddress || 'unknown@company.com'
        }
      ],
      parents: doc.parents || [],
      // Preserve Google Drive API specific properties
      webViewLink: doc.webViewLink,
      webContentLink: doc.webContentLink,
      iconLink: doc.iconLink,
      thumbnailLink: doc.thumbnailLink,
      viewedByMeTime: doc.viewedByMeTime,
      version: doc.version,
      trashed: doc.trashed,
      starred: doc.starred,
      explicitlyTrashed: doc.explicitlyTrashed,
      permissions: doc.permissions,
      capabilities: doc.capabilities,
      contentHints: doc.contentHints,
      exportLinks: doc.exportLinks,
      ownedByMe: doc.ownedByMe,
      writersCanShare: doc.writersCanShare,
      copyRequiresWriterPermission: doc.copyRequiresWriterPermission,
      isAppAuthorized: doc.isAppAuthorized
    }))
  
  // Create the Google Drive connector folder that wraps all Google Drive content
  const googleDriveConnectorFolder: GoogleDriveFolder = {
    id: 'google-drive-connector',
    name: 'Google Drive',
    type: 'application/vnd.google-apps.folder',
    path: '/My Documents/Google Drive',
    parents: [], // This is a root-level connector folder
    documentCount: convertedDocuments.length + (mockResponse.files || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder').length,
    createdTime: new Date().toISOString(),
    modifiedTime: new Date().toISOString()
  }

  // Transform existing folders to be children of the Google Drive connector
  const convertedFolders: GoogleDriveFolder[] = (mockResponse.files || [])
    .filter(file => file.mimeType === 'application/vnd.google-apps.folder')
    .map(folder => {
      // If this is the "My Drive" root folder, make it a child of the Google Drive connector
      if (folder.name === 'My Drive' && (!folder.parents || folder.parents.length === 0)) {
        return {
          ...folder,
          id: folder.id,
          name: folder.name,
          type: 'application/vnd.google-apps.folder',
          path: '/My Documents/Google Drive/My Drive',
          parents: ['google-drive-connector'], // Make it a child of the connector
          documentCount: getDocumentCountInFolder(convertedDocuments, folder.id),
          createdTime: folder.createdTime,
          modifiedTime: folder.modifiedTime
        }
      }
      
      // For other folders, update their parents to include the connector if they were direct children of My Drive
      const isDirectChildOfMyDrive = folder.parents && folder.parents.includes('0BwwA4oUTeiV1TGRPeTVjaWRDY1E')
      if (isDirectChildOfMyDrive) {
        return {
          ...folder,
          id: folder.id,
          name: folder.name,
          type: 'application/vnd.google-apps.folder',
          path: `/My Documents/Google Drive/${folder.name}`,
          parents: ['google-drive-connector'], // Make them direct children of the connector
          documentCount: getDocumentCountInFolder(convertedDocuments, folder.id),
          createdTime: folder.createdTime,
          modifiedTime: folder.modifiedTime
        }
      }
      
      // For nested folders, keep their existing parent structure but update paths
      return {
        ...folder,
        id: folder.id,
        name: folder.name,
        type: 'application/vnd.google-apps.folder',
        path: getFolderPathById(folder.id).replace('/My Documents/', '/My Documents/Google Drive/'),
        parents: folder.parents,
        documentCount: getDocumentCountInFolder(convertedDocuments, folder.id),
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime
      }
    })
  
  // Add the Google Drive connector folder to the beginning of the folders array
  const allFolders = [googleDriveConnectorFolder, ...convertedFolders]
  
  // Update document paths to include the Google Drive connector level
  const updatedDocuments = convertedDocuments.map(doc => ({
    ...doc,
    path: doc.path.replace('/My Documents/', '/My Documents/Google Drive/'),
    // Update parents if the document was directly under My Drive
    parents: doc.parents && doc.parents.includes('0BwwA4oUTeiV1TGRPeTVjaWRDY1E') 
      ? ['google-drive-connector'] 
      : doc.parents
  }))
  
  const mockData: MockData = {
    totalDocuments: updatedDocuments.length,
    totalFolders: allFolders.length,
    lastSyncTime: new Date().toISOString(),
    documents: updatedDocuments,
    folders: allFolders,
    summary: {
      totalDocuments: updatedDocuments.length,
      totalFolders: allFolders.length,
      fileTypes: {
        documents: updatedDocuments.filter(d => d.type && d.type.includes('document')).length,
        spreadsheets: updatedDocuments.filter(d => d.type && d.type.includes('spreadsheet')).length,
        presentations: updatedDocuments.filter(d => d.type && d.type.includes('presentation')).length,
        pdfs: updatedDocuments.filter(d => d.type && d.type.includes('pdf')).length
      },
      engagementSummary: {
        pastHour: updatedDocuments.filter(d => d.engagement.views > 0).length,
        past7Days: updatedDocuments.filter(d => d.engagement.views > 0).length,
        past30Days: updatedDocuments.filter(d => d.engagement.views > 0).length,
        past90Days: updatedDocuments.filter(d => d.engagement.views > 0).length,
        dormant: updatedDocuments.filter(d => d.engagement.views === 0).length,
        duplicates: updatedDocuments.filter(d => d.isDuplicate).length
      },
      sharingStatus: {
        active: updatedDocuments.filter(d => d.sharing.shared && !d.sharing.expiryDate).length,
        expiring: updatedDocuments.filter(d => d.sharing.shared && d.sharing.expiryDate).length,
        expired: 0,
        private: updatedDocuments.filter(d => !d.sharing.shared).length
      },
      topContributors: [{
        displayName: 'Current User',
        emailAddress: 'user@example.com',
        documentsCount: updatedDocuments.length,
        editsCount: updatedDocuments.reduce((sum, d) => sum + d.engagement.views, 0),
        commentsCount: updatedDocuments.reduce((sum, d) => sum + d.engagement.comments, 0),
        totalActivity: updatedDocuments.reduce((sum, d) => sum + d.engagement.views + d.engagement.downloads + d.engagement.comments, 0)
      }]
    }
  }
  
  return mockData
}

// NEW: Function to get Google Drive API mock data directly
export function getGoogleDriveMockData(): { files: GoogleDriveFile[] } {
  logger.debug('🔄 Loading Google Drive API mock data directly...')
  const data = mockResponse
  logger.debug(`✅ Loaded ${data.files?.length || 0} files from Google Drive API`)
  return data
}

export function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  const diff = now.getTime() - time.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30))
  
  if (minutes < 60) {
    return `${minutes} min ago`
  } else if (hours < 24) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (days < 30) {
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else {
    return `${months} month${months !== 1 ? 's' : ''} ago`
  }
}



export function getFileIconComponent(mimeType: string): { component: string; color: string } {
  if (mimeType?.includes('folder')) {
    return { component: 'FolderOpen', color: 'text-blue-600' }
  } else if (mimeType?.includes('document')) {
    return { component: 'FileText', color: 'text-blue-600' }
  } else if (mimeType?.includes('spreadsheet')) {
    return { component: 'FileSpreadsheet', color: 'text-green-600' }
  } else if (mimeType?.includes('presentation')) {
    return { component: 'Presentation', color: 'text-orange-600' }
  } else if (mimeType?.includes('pdf')) {
    return { component: 'FilePdf', color: 'text-red-600' }
  } else if (mimeType?.includes('image')) {
    return { component: 'FileImage', color: 'text-purple-600' }
  } else if (mimeType?.includes('video')) {
    return { component: 'FileVideo', color: 'text-pink-600' }
  } else if (mimeType?.includes('audio')) {
    return { component: 'FileAudio', color: 'text-indigo-600' }
  } else if (mimeType?.includes('archive') || mimeType?.includes('zip') || mimeType?.includes('rar')) {
    return { component: 'FileArchive', color: 'text-yellow-600' }
  } else if (mimeType?.includes('code') || mimeType?.includes('text')) {
    return { component: 'FileCode', color: 'text-gray-600' }
  }
  return { component: 'File', color: 'text-gray-600' }
}

export function getContributorsByPeriod(period: string = '7days'): TopContributor[] {
  const mockData = getMockData()
  return mockData.summary.topContributors
}

// Additional helper functions for analytics
export function getEngagementData() {
  const mockData = getMockData()
  return {
    totalViews: mockData.documents.reduce((sum, doc) => sum + doc.engagement.views, 0),
    totalEdits: mockData.documents.reduce((sum, doc) => sum + doc.engagement.views, 0),
    totalComments: mockData.documents.reduce((sum, doc) => sum + doc.engagement.comments, 0),
    totalShares: mockData.documents.reduce((sum, doc) => sum + doc.engagement.shares, 0),
    totalDownloads: mockData.documents.reduce((sum, doc) => sum + doc.engagement.downloads, 0),
  }
}

export function getTopDocumentsByEngagement(limit: number = 10) {
  const mockData = getMockData()
  return mockData.documents
    .sort((a, b) => {
      const aTotal = a.engagement.views + a.engagement.downloads + a.engagement.comments
      const bTotal = b.engagement.views + b.engagement.downloads + b.engagement.comments
      return bTotal - aTotal
    })
    .slice(0, limit)
}

export function getSharedDocuments() {
  const mockData = getMockData()
  return mockData.documents.filter(doc => doc.sharing.shared)
}

export function getDuplicateDocuments() {
  const mockData = getMockData()
  return mockData.documents.filter(doc => doc.isDuplicate)
}

export function getDocumentsByStatus(status: string) {
  const mockData = getMockData()
  return mockData.documents.filter(doc => doc.status === status)
}

export function getDocumentsByPeriod(period: string = '7days') {
  const mockData = getMockData()
  
  // Handle special filters first
  if (period === 'dormant') {
    // For dormant, show documents with status 'dormant' or past90Days activity = 0
    return mockData.documents.filter(doc => 
      doc.status === 'dormant' || doc.engagement.views === 0
    )
  }
  
  if (period === 'duplicates') {
    // Documents that are duplicates
    return mockData.documents.filter(doc => doc.isDuplicate)
  }
  
  // For time-based filters, use the engagement activity periods from the mock data
  return mockData.documents.filter(doc => {
    switch (period) {
      case 'hour':
        return doc.engagement.views > 0
      case '7days':
        return doc.engagement.views > 0
      case '30days':
        return doc.engagement.views > 0
      case '90days':
        return doc.engagement.views > 0
      default:
        return doc.engagement.views > 0
    }
  })
}