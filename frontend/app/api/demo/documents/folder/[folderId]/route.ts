import { NextRequest, NextResponse } from 'next/server'
import { DocumentItem, FolderItem } from '@/lib/types'

// Mock data (same as main route for now)
const mockGoogleDriveResponse = {
  files: [
    {
      id: "0BwwA4oUTeiV1TGRPeTVjaWRDY1E",
      name: "My Drive",
      mimeType: "application/vnd.google-apps.folder",
      parents: [],
      webViewLink: "https://drive.google.com/drive/folders/0BwwA4oUTeiV1TGRPeTVjaWRDY1E",
      createdTime: "2020-01-01T00:00:00.000Z",
      modifiedTime: "2024-12-01T00:00:00.000Z"
    },
    {
      id: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      name: "Archive",
      mimeType: "application/vnd.google-apps.folder",
      parents: ["0BwwA4oUTeiV1TGRPeTVjaWRDY1E"],
      webViewLink: "https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      createdTime: "2020-01-01T00:00:00.000Z",
      modifiedTime: "2024-12-01T00:00:00.000Z"
    },
    {
      id: "2BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      name: "Finance",
      mimeType: "application/vnd.google-apps.folder",
      parents: ["0BwwA4oUTeiV1TGRPeTVjaWRDY1E"],
      webViewLink: "https://drive.google.com/drive/frive/folders/2BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      createdTime: "2020-01-01T00:00:00.000Z",
      modifiedTime: "2024-12-01T00:00:00.000Z"
    },
    {
      id: "3BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      name: "Executive",
      mimeType: "application/vnd.google-apps.folder",
      parents: ["0BwwA4oUTeiV1TGRPeTVjaWRDY1E"],
      webViewLink: "https://drive.google.com/drive/folders/3BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      createdTime: "2020-01-01T00:00:00.000Z",
      modifiedTime: "2024-12-01T00:00:00.000Z"
    },
    {
      id: "4BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      name: "Work",
      mimeType: "application/vnd.google-apps.folder",
      parents: ["0BwwA4oUTeiV1TGRPeTVjaWRDY1E"],
      webViewLink: "https://drive.google.com/drive/folders/4BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
      createdTime: "2020-01-01T00:00:00.000Z",
      modifiedTime: "2024-12-01T00:00:00.000Z"
    }
  ]
}

// Mock documents (same as main route)
const mockDocuments: DocumentItem[] = [
  // Documents in Finance folder
  {
    id: 'doc1',
    name: 'Q4 Financial Report.pdf',
    type: 'application/pdf',
    mimeType: 'application/pdf',
    size: 2048576,
    path: '/My Documents/Google Drive/Finance/Q4 Financial Report.pdf',
    modifiedTime: '2024-12-15T10:30:00.000Z',
    createdTime: '2024-12-01T09:00:00.000Z',
    lastAccessed: '2024-12-20T14:15:00.000Z',
    accessCount: 25,
    sharing: {
      shared: true,
      sharedWith: ['finance@company.com', 'executive@company.com'],
      sharingStatus: 'active',
      expiryDate: null,
      createdDate: '2024-12-01T09:00:00.000Z',
      permissions: [
        { type: 'user', role: 'reader', email: 'finance@company.com' },
        { type: 'user', role: 'commenter', email: 'executive@company.com' }
      ]
    },
    engagement: {
      views: 45,
      downloads: 12,
      comments: 8,
      shares: 3
    },
    isDuplicate: false,
    contributors: [
      {
        displayName: 'Finance Team',
        role: 'Editor',
        edits: 15,
        comments: 5,
        lastActivity: '2024-12-20T14:15:00.000Z',
        emailAddress: 'finance@company.com'
      }
    ],
    parents: ['2BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'], // Finance folder ID
    status: 'active'
  },
  {
    id: 'doc2',
    name: 'Budget 2024.xlsx',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 1536000,
    path: '/My Documents/Google Drive/Finance/Budget 2024.xlsx',
    modifiedTime: '2024-12-10T14:20:00.000Z',
    createdTime: '2024-12-01T08:30:00.000Z',
    lastAccessed: '2024-12-19T16:45:00.000Z',
    accessCount: 18,
    sharing: {
      shared: false,
      sharedWith: [],
      sharingStatus: 'private',
      expiryDate: null,
      createdDate: '2024-12-01T08:30:00.000Z',
      permissions: []
    },
    engagement: {
      views: 32,
      downloads: 8,
      comments: 3,
      shares: 0
    },
    isDuplicate: false,
    contributors: [
      {
        displayName: 'Finance Team',
        role: 'Editor',
        edits: 22,
        comments: 3,
        lastActivity: '2024-12-19T16:45:00.000Z',
        emailAddress: 'finance@company.com'
      }
    ],
    parents: ['2BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'], // Finance folder ID
    status: 'active'
  },
        // Documents in Archive folder
      {
        id: 'doc3',
        name: '2023 Annual Report.pdf',
        type: 'application/pdf',
        mimeType: 'application/pdf',
        size: 5120000,
        path: '/My Documents/Google Drive/Archive/2023 Annual Report.pdf',
        modifiedTime: '2023-12-31T23:59:00.000Z',
        createdTime: '2023-12-15T10:00:00.000Z',
        lastAccessed: '2024-01-15T09:30:00.000Z',
        accessCount: 12,
        sharing: {
          shared: true,
          sharedWith: ['archive@company.com'],
          sharingStatus: 'active',
          expiryDate: null,
          createdDate: '2023-12-15T10:00:00.000Z',
          permissions: [
            { type: 'user', role: 'reader', email: 'archive@company.com' }
          ]
        },
        engagement: {
          views: 12,
          downloads: 5,
          comments: 1,
          shares: 2
        },
        isDuplicate: false,
        contributors: [
          {
            displayName: 'Archive Team',
            role: 'Viewer',
            edits: 0,
            comments: 1,
            lastActivity: '2024-01-15T09:30:00.000Z',
            emailAddress: 'archive@company.com'
          }
        ],
        parents: ['1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'], // Archive folder ID
        status: 'archived'
      },
  // Documents in Executive folder
  {
    id: 'doc4',
    name: 'Board Meeting Minutes.docx',
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 256000,
    path: '/My Documents/Google Drive/Executive/Board Meeting Minutes.docx',
    modifiedTime: '2024-12-18T11:00:00.000Z',
    createdTime: '2024-12-18T10:30:00.000Z',
    lastAccessed: '2024-12-20T15:20:00.000Z',
    accessCount: 8,
    sharing: {
      shared: true,
      sharedWith: ['board@company.com', 'ceo@company.com'],
      sharingStatus: 'active',
      expiryDate: null,
      createdDate: '2024-12-18T10:30:00.000Z',
      permissions: [
        { type: 'user', role: 'commenter', email: 'board@company.com' },
        { type: 'user', role: 'editor', email: 'ceo@company.com' }
      ]
    },
    engagement: {
      views: 8,
      downloads: 3,
      comments: 6,
      shares: 1
    },
    isDuplicate: false,
    contributors: [
      {
        displayName: 'CEO',
        role: 'Editor',
        edits: 4,
        comments: 6,
        lastActivity: '2024-12-20T15:20:00.000Z',
        emailAddress: 'ceo@company.com'
      }
    ],
    parents: ['3BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'], // Executive folder ID
    status: 'active'
  }
]

// Helper function to get folder path by ID
function getFolderPathById(folders: any[], folderId: string): string {
  if (!folderId) return '/'
  
  const path: string[] = []
  let currentId = folderId
  
  while (currentId) {
    const folder = folders.find(f => f.id === currentId)
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
function getDocumentCountInFolder(documents: DocumentItem[], folderId: string): number {
  return documents.filter(doc => doc.parents && doc.parents.includes(folderId)).length
}

// GET handler for fetching folder contents
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ folderId: string }> }
) {
  const { folderId } = await params
  try {
    console.log(`🔄 API: Fetching contents for folder: ${folderId}`)
    
    // TODO: Replace with real Google Drive API call
    // const folderContents = await fetchGoogleDriveFolderContents(folderId)
    
    // For now, use mock data
    const googleDriveData = mockGoogleDriveResponse
    
    // Handle special case for google-drive-connector folder
    if (folderId === 'google-drive-connector') {
      // This is our virtual connector folder - return the direct children of "My Drive"
      const myDriveFolder = googleDriveData.files.find(f => f.name === 'My Drive')
      
      if (!myDriveFolder) {
        return NextResponse.json(
          { error: 'My Drive folder not found' },
          { status: 404 }
        )
      }
      
      // Get direct children of My Drive (which become children of Google Drive connector)
      const childFolders: FolderItem[] = googleDriveData.files
        .filter(file => 
          file.mimeType === 'application/vnd.google-apps.folder' && 
          file.parents && 
          file.parents.includes(myDriveFolder.id)
        )
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          type: 'application/vnd.google-apps.folder',
          path: `/My Documents/Google Drive/${folder.name}`,
          parents: ['google-drive-connector'], // Make them children of the connector
          documentCount: getDocumentCountInFolder(mockDocuments, folder.id),
          createdTime: folder.createdTime,
          modifiedTime: folder.modifiedTime
        }))
      
      const childDocuments: DocumentItem[] = mockDocuments.filter(doc => 
        doc.parents && doc.parents.includes(myDriveFolder.id)
      )
      
      // Create the connector folder info
      const folderInfo: FolderItem = {
        id: 'google-drive-connector',
        name: 'Google Drive',
        type: 'application/vnd.google-apps.folder',
        path: '/My Documents/Google Drive',
        parents: [],
        documentCount: childDocuments.length + childFolders.length,
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString()
      }
      
      const response = {
        folder: folderInfo,
        contents: {
          folders: childFolders,
          documents: childDocuments
        },
        totalItems: childFolders.length + childDocuments.length,
        lastSyncTime: new Date().toISOString()
      }
      
      console.log(`✅ API: Successfully fetched Google Drive connector contents`)
      console.log(`📁 Folder: ${folderInfo.name}`)
      console.log(`📁 Subfolders: ${childFolders.length}`)
      console.log(`📄 Documents: ${childDocuments.length}`)
      
      return NextResponse.json(response, { status: 200 })
    }
    
    // Handle regular Google Drive folders
    const requestedFolder = googleDriveData.files.find(f => f.id === folderId)
    
    if (!requestedFolder) {
      return NextResponse.json(
        { error: 'Folder not found' },
        { status: 404 }
      )
    }
    
    // Get direct children (folders and documents) of this folder
    const childFolders: FolderItem[] = googleDriveData.files
      .filter(file => 
        file.mimeType === 'application/vnd.google-apps.folder' && 
        file.parents && 
        file.parents.includes(folderId)
      )
      .map(folder => ({
        id: folder.id,
        name: folder.name,
        type: 'application/vnd.google-apps.folder',
        path: getFolderPathById(googleDriveData.files, folder.id).replace('/My Documents/', '/My Documents/Google Drive/'),
        parents: folder.parents,
        documentCount: getDocumentCountInFolder(mockDocuments, folder.id),
        createdTime: folder.createdTime,
        modifiedTime: folder.modifiedTime
      }))
    
    const childDocuments: DocumentItem[] = mockDocuments.filter(doc => 
      doc.parents && doc.parents.includes(folderId)
    )
    
    // Get the folder's own information
    const folderInfo: FolderItem = {
      id: requestedFolder.id,
      name: requestedFolder.name,
      type: 'application/vnd.google-apps.folder',
      path: getFolderPathById(googleDriveData.files, folderId).replace('/My Documents/', '/My Documents/Google Drive/'),
      parents: requestedFolder.parents,
      documentCount: childDocuments.length + childFolders.length,
      createdTime: requestedFolder.createdTime,
      modifiedTime: requestedFolder.modifiedTime
    }
    
    const response = {
      folder: folderInfo,
      contents: {
        folders: childFolders,
        documents: childDocuments
      },
      totalItems: childFolders.length + childDocuments.length,
      lastSyncTime: new Date().toISOString()
    }
    
    console.log(`✅ API: Successfully fetched folder contents`)
    console.log(`📁 Folder: ${folderInfo.name}`)
    console.log(`📁 Subfolders: ${childFolders.length}`)
    console.log(`📄 Documents: ${childDocuments.length}`)
    
    return NextResponse.json(response, { status: 200 })
    
  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch folder contents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
