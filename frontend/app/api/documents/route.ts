import { NextRequest, NextResponse } from 'next/server'
import { DocumentItem, FolderItem, DocumentsResponse } from '@/lib/types'
import mockGoogleDriveResponse from '@/data/google-drive-api-mock.json'

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

// GET handler for fetching documents and folders
export async function GET() {
  try {
    console.log('🔄 API: Fetching documents from Google Drive mock data')
    
    // Read the mock data from the JSON file
    const googleDriveData = mockGoogleDriveResponse
    
    console.log(`📁 Raw data: ${googleDriveData.files?.length || 0} files from JSON`)
    
    // Create the Google Drive connector folder that wraps all Google Drive content
    const googleDriveConnectorFolder: FolderItem = {
      id: 'google-drive-connector',
      name: 'Google Drive',
      type: 'folder',
      path: '/My Documents/Google Drive',
      parents: [], // This is a root-level connector folder
      documentCount: 0, // Will be calculated below
      createdTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString()
    }

    // Transform existing folders to be children of the Google Drive connector
    // Keep all folders but restructure the hierarchy
    const convertedFolders: FolderItem[] = googleDriveData.files
      .filter(file => file.mimeType === 'application/vnd.google-apps.folder')
      .filter(folder => folder.name !== 'My Drive') // Remove My Drive folder
      .map(folder => {
        // For folders that were direct children of My Drive, make them direct children of the connector
        const isDirectChildOfMyDrive = folder.parents && folder.parents.includes('0BwwA4oUTeiV1TGRPeTVjaWRDY1E')
        if (isDirectChildOfMyDrive) {
          return {
            id: folder.id,
            name: folder.name,
            type: 'folder', // Use 'folder' for better icon recognition
            path: `/My Documents/Google Drive/${folder.name}`,
            parents: ['google-drive-connector'], // Make them direct children of the connector
            documentCount: 0, // Will be calculated below
            createdTime: folder.createdTime,
            modifiedTime: folder.modifiedTime
          }
        }
        
        // For nested folders, we need to update their parent IDs to work with the new structure
        // Find the new parent ID by looking up the parent folder's new structure
        let newParentId = folder.parents?.[0]
        if (newParentId === '0BwwA4oUTeiV1TGRPeTVjaWRDY1E') {
          // This was under "My Drive", so it should be under "Google Drive" connector
          newParentId = 'google-drive-connector'
        }
        
        return {
          id: folder.id,
          name: folder.name,
          type: 'folder', // Use 'folder' for better icon recognition
          path: `/My Documents/Google Drive${getFolderPathById(googleDriveData.files, folder.id).replace('/My Documents', '')}`,
          parents: newParentId ? [newParentId] : [],
          documentCount: 0, // Will be calculated below
          createdTime: folder.createdTime,
          modifiedTime: folder.modifiedTime
        }
      })

    // Add the Google Drive connector folder to the beginning of the folders array
    const allFolders = [googleDriveConnectorFolder, ...convertedFolders]
    
    // Create documents dynamically for ALL folders (including nested ones)
    // Since the JSON only contains folders, we'll create realistic documents
    console.log('🔍 Debug: Creating documents dynamically for all folders')
    
    const allDocuments: DocumentItem[] = []
    
    // Create documents for each folder based on its specific context and depth
    convertedFolders.forEach(folder => {
      // Determine how many documents to create based on folder type and depth
      let docCount = 0
      let folderType = 'general'
      let folderContext = folder.name
      let parentContext = ''
      
      // Get parent folder context for better document naming
      if (folder.parents?.[0]) {
        const parentFolder = convertedFolders.find(f => f.id === folder.parents![0])
        if (parentFolder) {
          parentContext = parentFolder.name
        }
      }
      
      // Debug logging
      console.log(`🔍 Folder: ${folder.name}, Parent: ${parentContext}, Path: ${folder.path}`)
      
      // Analyze folder path to determine type and document count
      if (folder.path.includes('/Finance/')) {
        folderType = 'finance'
        docCount = Math.floor(Math.random() * 8) + 5 // 5-12 documents
      } else if (folder.path.includes('/Executive/')) {
        folderType = 'executive'
        docCount = Math.floor(Math.random() * 6) + 4 // 4-9 documents
      } else if (folder.path.includes('/Archive/')) {
        folderType = 'archive'
        docCount = Math.floor(Math.random() * 10) + 8 // 8-17 documents
      } else if (folder.path.includes('/Work/')) {
        folderType = 'work'
        docCount = Math.floor(Math.random() * 8) + 6 // 6-13 documents
      } else {
        // For other folders (like Reports, Budgets, Invoices, etc.)
        folderType = 'general'
        docCount = Math.floor(Math.random() * 5) + 3 // 3-7 documents
      }
      
      // Create documents for this folder
      for (let i = 0; i < docCount; i++) {
        const docId = `doc_${folder.id}_${i}`
        const fileTypes = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png']
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)]
        
        // Generate realistic document names based on folder type, name, and context
        let fileName = ''
        
        // First check for specific folder names that need special handling (like year folders)
        if (folderContext === '2022') {
          const year2022Names = ['2022 Annual Report', '2022 Strategic Plan', '2022 Financial Summary', '2022 Budget Review', '2022 Performance Metrics', '2022 Q4 Report', '2022 Year-End Summary', '2022 Market Analysis', '2022 Customer Survey', '2022 Project Portfolio']
          fileName = `${year2022Names[i % year2022Names.length]}.${fileType}`
        } else if (folderContext === '2023') {
          const year2023Names = ['2023 Annual Report', '2023 Strategic Plan', '2023 Financial Summary', '2023 Budget Review', '2023 Performance Metrics', '2023 Q3 Report', '2023 Year-End Summary', '2023 Market Analysis', '2023 Customer Survey', '2023 Project Portfolio']
          fileName = `${year2023Names[i % year2023Names.length]}.${fileType}`
        } else if (folderContext === '2024') {
          const year2024Names = ['2024 Q1 Report', '2024 Q2 Report', '2024 Q3 Report', '2024 Strategic Update', '2024 Performance Review', '2024 Budget Analysis', '2024 Market Trends', '2024 Customer Insights', '2024 Project Status', '2024 Mid-Year Review']
          fileName = `${year2024Names[i % year2024Names.length]}.${fileType}`
        } else {
          // Then handle by folder type
          switch (folderType) {
          case 'finance':
            if (parentContext === 'Finance') {
              // Top-level Finance folder
              const financeNames = ['Q4 Financial Report', 'Budget 2024', 'Revenue Analysis', 'Expense Report', 'Cash Flow Statement', 'Profit & Loss', 'Balance Sheet', 'Tax Documents', 'Audit Report', 'Investment Portfolio', 'Financial Summary', 'Cost Analysis', 'Budget Review', 'Financial Planning', 'Revenue Forecast']
              fileName = `${financeNames[i % financeNames.length]}.${fileType}`
            } else if (folderContext === 'Reports') {
              const reportNames = ['Monthly Financial Report', 'Quarterly Analysis', 'Annual Summary', 'Performance Review', 'Trend Analysis', 'Market Research', 'Competitor Analysis', 'Industry Report', 'Financial Metrics', 'KPI Dashboard']
              fileName = `${reportNames[i % reportNames.length]}.${fileType}`
            } else if (folderContext === 'Budgets') {
              const budgetNames = ['2024 Operating Budget', 'Capital Expenditure Plan', 'Department Budgets', 'Budget Variance Report', 'Forecast Update', 'Cost Control Analysis', 'Resource Allocation', 'Budget Performance', 'Financial Planning', 'Expense Tracking']
              fileName = `${budgetNames[i % budgetNames.length]}.${fileType}`
            } else if (folderContext === 'Invoices') {
              const invoiceNames = ['Invoice #2024-001', 'Payment Receipt', 'Vendor Invoice', 'Client Invoice', 'Expense Invoice', 'Service Invoice', 'Product Invoice', 'Credit Note', 'Payment Summary', 'Invoice Register']
              fileName = `${invoiceNames[i % invoiceNames.length]}.${fileType}`
            } else if (folderContext === 'Audits') {
              const auditNames = ['Internal Audit Report', 'External Audit Findings', 'Compliance Review', 'Risk Assessment', 'Control Testing', 'Audit Plan', 'Follow-up Report', 'Audit Committee Report', 'Regulatory Review', 'Process Audit']
              fileName = `${auditNames[i % auditNames.length]}.${fileType}`
            } else {
              fileName = `Finance - ${folderContext} Document ${i + 1}.${fileType}`
            }
            break
          case 'executive':
            if (parentContext === 'Executive') {
              // Top-level Executive folder
              const execNames = ['Board Meeting Minutes', 'Executive Summary', 'Strategic Plan', 'Quarterly Review', 'Leadership Report', 'Company Vision', 'Performance Metrics', 'Stakeholder Update', 'Risk Assessment', 'Growth Strategy', 'Executive Briefing', 'Strategic Review', 'Leadership Update', 'Company Overview', 'Executive Dashboard']
              fileName = `${execNames[i % execNames.length]}.${fileType}`
            } else if (folderContext === 'Board Materials') {
              const boardNames = ['Board Meeting Agenda', 'Board Resolution', 'Committee Report', 'Governance Policy', 'Board Calendar', 'Director Information', 'Board Minutes', 'Strategic Discussion', 'Board Evaluation', 'Compliance Report']
              fileName = `${boardNames[i % boardNames.length]}.${fileType}`
            } else if (folderContext === 'Leadership Team') {
              const leadershipNames = ['Leadership Meeting Notes', 'Team Performance Review', 'Leadership Development', 'Succession Planning', 'Team Building', 'Leadership Assessment', 'Team Strategy', 'Leadership Update', 'Team Goals', 'Performance Metrics']
              fileName = `${leadershipNames[i % leadershipNames.length]}.${fileType}`
            } else if (folderContext === 'Strategic Planning') {
              const strategyNames = ['Strategic Plan 2024', 'Long-term Vision', 'Strategic Initiatives', 'Market Analysis', 'Competitive Strategy', 'Growth Plan', 'Strategic Goals', 'Implementation Plan', 'Strategic Review', 'Future Roadmap']
              fileName = `${strategyNames[i % strategyNames.length]}.${fileType}`
            } else {
              fileName = `Executive - ${folderContext} Document ${i + 1}.${fileType}`
            }
            break
          case 'archive':
            if (parentContext === 'Archive') {
              // Top-level Archive folder
              const archiveNames = ['Historical Data', 'Legacy Documents', 'Retired Policies', 'Historical Analysis', 'Archived Report', 'Legacy Analysis', 'Historical Review', 'Past Performance', 'Archived Strategy', 'Historical Summary']
              fileName = `${archiveNames[i % archiveNames.length]}.${fileType}`
            } else if (folderContext === '2022') {
              const year2022Names = ['2022 Annual Report', '2022 Strategic Plan', '2022 Financial Summary', '2022 Budget Review', '2022 Performance Metrics', '2022 Q4 Report', '2022 Year-End Summary', '2022 Market Analysis', '2022 Customer Survey', '2022 Project Portfolio']
              fileName = `${year2022Names[i % year2022Names.length]}.${fileType}`
            } else if (folderContext === '2023') {
              const year2023Names = ['2023 Annual Report', '2023 Strategic Plan', '2023 Financial Summary', '2023 Budget Review', '2023 Performance Metrics', '2023 Q4 Report', '2023 Year-End Summary', '2023 Market Analysis', '2023 Customer Survey', '2023 Project Portfolio']
              fileName = `${year2023Names[i % year2023Names.length]}.${fileType}`
            } else if (folderContext === '2024') {
              const year2024Names = ['2024 Q1 Report', '2024 Q2 Report', '2024 Q3 Report', '2024 Strategic Update', '2024 Performance Review', '2024 Budget Analysis', '2024 Market Trends', '2024 Customer Insights', '2024 Project Status', '2024 Mid-Year Review']
              fileName = `${year2024Names[i % year2024Names.length]}.${fileType}`
            } else if (folderContext === 'Archive') {
              const generalNames = ['Document', 'Report', 'Analysis', 'Summary', 'Review', 'Update', 'Plan', 'Notes', 'Guidelines', 'Process', 'Procedure', 'Template', 'Checklist', 'Overview', 'Assessment']
              fileName = `Archive - ${generalNames[i % generalNames.length]}.${fileType}`
            } else {
              fileName = `Archive - ${folderContext} Document ${i + 1}.${fileType}`
            }
            break
          case 'work':
            if (parentContext === 'Work') {
              // Top-level Work folder
              const workNames = ['Project Timeline', 'Team Meeting Notes', 'Workflow Process', 'Task List', 'Progress Report', 'Collaboration Notes', 'Process Documentation', 'Team Guidelines', 'Project Plan', 'Work Summary', 'Project Update', 'Team Status', 'Work Progress', 'Process Review', 'Project Review']
              fileName = `${workNames[i % workNames.length]}.${fileType}`
            } else {
              fileName = `Work - ${folderContext} Document ${i + 1}.${fileType}`
            }
            break
          default:
            // For other folders, create contextually appropriate names
            if (folderContext === 'Marketing') {
              const marketingNames = ['Marketing Strategy', 'Campaign Plan', 'Brand Guidelines', 'Market Research', 'Customer Analysis', 'Marketing Budget', 'Performance Metrics', 'Content Calendar', 'Social Media Plan', 'Marketing ROI']
              fileName = `${marketingNames[i % marketingNames.length]}.${fileType}`
            } else if (folderContext === 'Operations') {
              const operationsNames = ['Operations Manual', 'Process Documentation', 'Standard Procedures', 'Quality Control', 'Efficiency Report', 'Operations Plan', 'Performance Metrics', 'Process Improvement', 'Operations Review', 'Best Practices']
              fileName = `${operationsNames[i % operationsNames.length]}.${fileType}`
            } else if (folderContext === 'Human Resources') {
              const hrNames = ['HR Policy Manual', 'Employee Handbook', 'Recruitment Plan', 'Training Program', 'Performance Review', 'Benefits Guide', 'Employee Survey', 'HR Metrics', 'Compliance Report', 'Talent Strategy']
              fileName = `${hrNames[i % hrNames.length]}.${fileType}`
            } else if (parentContext && folderContext !== parentContext) {
              // For nested folders, combine parent and folder context
              fileName = `${parentContext} - ${folderContext} Document ${i + 1}.${fileType}`
            } else {
              // For general folders, use the folder name to generate relevant document names
              const generalNames = ['Document', 'Report', 'Analysis', 'Summary', 'Review', 'Update', 'Plan', 'Notes', 'Guidelines', 'Process', 'Procedure', 'Template', 'Checklist', 'Overview', 'Assessment']
              fileName = `${folderContext} - ${generalNames[i % generalNames.length]}.${fileType}`
            }
          }
        }
        
        // Determine file type and size
        let mimeType = 'application/octet-stream'
        let fileSize = 1024000 // Default 1MB
        
        switch (fileType) {
          case 'pdf':
            mimeType = 'application/pdf'
            fileSize = Math.floor(Math.random() * 5000000) + 1000000 // 1-6MB
            break
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            fileSize = Math.floor(Math.random() * 2000000) + 100000 // 100KB-2MB
            break
          case 'xlsx':
            mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            fileSize = Math.floor(Math.random() * 3000000) + 200000 // 200KB-3MB
            break
          case 'pptx':
            mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
            fileSize = Math.floor(Math.random() * 10000000) + 1000000 // 1-10MB
            break
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg'
            fileSize = Math.floor(Math.random() * 5000000) + 100000 // 100KB-5MB
            break
          case 'png':
            mimeType = 'image/png'
            fileSize = Math.floor(Math.random() * 3000000) + 100000 // 100KB-3MB
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
          parents: [folder.id], // Document belongs to this folder
          status: 'active'
        }
        
        allDocuments.push(document)
      }
    })
    
    console.log(`🔍 Debug: Created ${allDocuments.length} documents for ${convertedFolders.length} folders`)

    // Update document paths to include the Google Drive connector level
    const updatedDocuments = allDocuments.map(doc => ({
      ...doc,
      path: doc.path.replace('/My Documents/', '/My Documents/Google Drive/'),
      // Update parents if the document was directly under My Drive
      parents: doc.parents && doc.parents.includes('0BwwA4oUTeiV1TGRPeTVjaWRDY1E') 
        ? ['google-drive-connector'] 
        : doc.parents
    }))

    // Calculate document counts for folders
    const foldersWithCounts = allFolders.map(folder => ({
      ...folder,
      documentCount: getDocumentCountInFolder(updatedDocuments, folder.id)
    }))

    const response: DocumentsResponse = {
      totalDocuments: updatedDocuments.length,
      totalFolders: foldersWithCounts.length,
      lastSyncTime: new Date().toISOString(),
      documents: updatedDocuments,
      folders: foldersWithCounts,
      summary: {
        totalDocuments: updatedDocuments.length,
        totalFolders: foldersWithCounts.length,
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
          displayName: 'Finance Team',
          emailAddress: 'finance@company.com',
          documentsCount: updatedDocuments.length,
          editsCount: updatedDocuments.reduce((sum, d) => sum + d.engagement.views, 0),
          commentsCount: updatedDocuments.reduce((sum, d) => sum + d.engagement.comments, 0),
          totalActivity: updatedDocuments.reduce((sum, d) => sum + d.engagement.views + d.engagement.downloads + d.engagement.comments, 0)
        }]
      }
    }

    console.log('✅ API: Successfully fetched documents')
    console.log(`📁 Total folders: ${response.totalFolders}`)
    console.log(`📄 Total documents: ${response.totalDocuments}`)

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, documentData } = body

    console.log(`🔄 API: Processing ${action} operation for document`)

    switch (action) {
      case 'create':
        // TODO: Implement document creation via Google Drive API
        console.log('📝 Creating document:', documentData)
        break
      
      case 'update':
        // TODO: Implement document update via Google Drive API
        console.log('✏️ Updating document:', documentData)
        break
      
      case 'delete':
        // TODO: Implement document deletion via Google Drive API
        console.log('🗑️ Deleting document:', documentData)
        break
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: `${action} operation completed` })

  } catch (error) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process document operation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
