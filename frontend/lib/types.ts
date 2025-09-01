// Types for our API responses
export interface DocumentItem {
  id: string
  name: string
  type: string
  mimeType?: string
  size: number
  path: string
  modifiedTime: string
  createdTime: string
  lastAccessed: string
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
  permissions?: any[]
  capabilities?: any
  contentHints?: any
  exportLinks?: { [key: string]: string | undefined }
  lastModifyingUser?: any
  ownedByMe?: boolean
  writersCanShare?: boolean
  copyRequiresWriterPermission?: boolean
  isAppAuthorized?: boolean
  dueDate?: string | null
}

export interface FolderItem {
  id: string
  name: string
  type: string
  mimeType?: string
  path: string
  parents?: string[]
  documentCount: number
  createdTime: string
  modifiedTime: string
  lastAccessed?: string
  accessCount?: number
  sharing?: {
    shared: boolean
    sharedWithMeTime?: string
  }
  capabilities?: {
    canAddChildren: boolean
    canDelete: boolean
    canEdit: boolean
    canShare: boolean
  }
}

export interface DocumentsResponse {
  totalDocuments: number
  totalFolders: number
  lastSyncTime: string
  documents: DocumentItem[]
  folders: FolderItem[]
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
    topContributors: Array<{
      displayName: string
      emailAddress: string
      documentsCount: number
      editsCount: number
      commentsCount: number
      totalActivity: number
    }>
  }
}

// Reminder and Due Date related types
export interface Reminder {
  id: string
  documentId: string
  documentName: string
  dueDate: string
  createdAt: string
  isCompleted: boolean
  reminderType: 'due_date' | 'custom'
  message?: string
}

export interface DueDateInfo {
  dueDate: string
  isOverdue: boolean
  daysUntilDue: number
  formattedDate: string
}
