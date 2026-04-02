import { IConnectorStorageAdapter, METADATA_FILE_NAME, METADATA_FOLDER_NAME } from '@/lib/connectors/types'
import { logger } from '@/lib/logger'
import { FOLDERS } from '@/lib/connectors/pockett-structure.service'
import { prisma } from '@/lib/prisma'

// Predefined consulting firm names for test data generation
const CONSULTING_FIRMS = [
  'McKinsey & Company',
  'Boston Consulting Group (BCG)',
  'Bain & Company',
  'Deloitte',
  'PwC',
  'EY (Ernst & Young)',
  'KPMG',
  'Accenture',
  'Goldman Sachs',
  'Morgan Stanley',
  'Booz Allen Hamilton',
  'A.T. Kearney',
  'Cornerstone Research',
  'Mercer',
  'Oliver Wyman',
]

const FAKE_CLIENT_NAMES = [
  'Global Finance Corp',
  'TechVision Industries',
  'Strategic Innovations Inc',
  'NextGen Solutions',
  'Digital Transformation Ltd',
  'Enterprise Solutions Group',
  'CloudFirst Technologies',
  'Innovation Partners',
  'Market Leaders Inc',
  'Future Ready Enterprises',
]

const PROJECT_TEMPLATES = [
  'Digital Transformation Initiative',
  'Organizational Restructuring',
  'Cost Optimization Program',
  'Market Expansion Strategy',
  'Technology Modernization',
  'Process Improvement Project',
  'Customer Experience Enhancement',
  'Supply Chain Optimization',
]

interface TestOrgStructure {
  orgName: string
  clientName: string
  orgFolderId: string
  clientFolderId: string
  projects: Array<{
    name: string
    folderId: string
    files: string[]
    phaseFolderIds: Record<string, string>
  }>
  totalFiles: number
}

/**
 * Generate a realistic test organization with sample Google Drive structure
 */
export async function createTestOrganization(
  adapter: IConnectorStorageAdapter,
  connectionId: string,
  parentFolderId: string
): Promise<TestOrgStructure> {
  try {
    // Select random names
    const firmName = CONSULTING_FIRMS[Math.floor(Math.random() * CONSULTING_FIRMS.length)]
    const orgName = `${firmName} (Testing only)`
    const clientName = FAKE_CLIENT_NAMES[Math.floor(Math.random() * FAKE_CLIENT_NAMES.length)]
    const projectTemplate = PROJECT_TEMPLATES[Math.floor(Math.random() * PROJECT_TEMPLATES.length)]

    logger.info('Creating test organization structure', { orgName, clientName, projectTemplate })

    // 1. Create main org folder
    const orgFolderId = await adapter.createFolder(connectionId, parentFolderId, orgName)
    logger.debug('Created org folder', { orgFolderId, orgName })

    // Helper for metadata (sandbox compatible with pockett-structure)
    const writePockettMeta = async (folderId: string, meta: any) => {
      const dotId = await adapter.findOrCreateFolder(connectionId, folderId, METADATA_FOLDER_NAME)
      await adapter.writeFile(connectionId, dotId, METADATA_FILE_NAME, JSON.stringify(meta, null, 2))
    }

    // 2. Create .pockett metadata in org folder
    await writePockettMeta(orgFolderId, {
      type: 'organization',
      slug: generateSlug(orgName),
      isDefault: true,
      sandboxOnly: true,
    })

    // 3. Create client folder
    const clientFolderId = await adapter.createFolder(connectionId, orgFolderId, clientName)
    await writePockettMeta(clientFolderId, {
      type: 'client',
      slug: generateSlug(clientName),
      sandboxOnly: true,
    })

    // 4. Create a single sample project folder with phases inside
    const projectFolderId = await adapter.createFolder(connectionId, clientFolderId, projectTemplate)
    const projectSlug = generateSlug(projectTemplate)

    await writePockettMeta(projectFolderId, {
      type: 'project',
      name: projectTemplate,
      slug: projectSlug,
      sandboxOnly: true,
    })

    // SYNC: Update the Organization column immediately so discovery works
    const orgRecord = await prisma.firm.findFirst({
      where: { name: orgName }
    })
    if (orgRecord) {
      await prisma.firm.update({
        where: { id: orgRecord.id },
        data: { firmFolderId: orgFolderId }
      })
    }

    const projects: TestOrgStructure['projects'] = []
    let totalFiles = 0

    // Define the 5 project phases (now as folders inside the project)
    const phases = [
      {
        name: FOLDERS.GENERAL.name,
        type: FOLDERS.GENERAL.type,
        files: [
          { name: 'Client_Onboarding.pdf', type: 'pdf' },
          { name: 'Initial_Assessment.docx', type: 'doc' },
          { name: 'Stakeholder_Meeting_Notes.docx', type: 'doc' },
          { name: 'Onboarding_Checklist.xlsx', type: 'sheet' },
        ],
      },
      {
        name: FOLDERS.CONFIDENTIAL.name,
        type: FOLDERS.CONFIDENTIAL.type,
        files: [
          { name: 'Statement_of_Work.pdf', type: 'pdf' },
          { name: 'Master_Service_Agreement.pdf', type: 'pdf' },
          { name: 'Pricing_and_Terms.xlsx', type: 'sheet' },
          { name: 'Signature_Page.pdf', type: 'pdf' },
        ],
      },
      {
        name: FOLDERS.STAGING.name,
        type: FOLDERS.STAGING.type,
        files: [
          { name: 'Project_Kickoff_Presentation.pptx', type: 'slide' },
          { name: 'Team_Structure.docx', type: 'doc' },
          { name: 'Timeline_and_Milestones.xlsx', type: 'sheet' },
          { name: 'Resource_Plan.pdf', type: 'pdf' },
        ],
      },
      {
        name: 'Project Planning',
        files: [
          { name: 'Project_Charter.docx', type: 'doc' },
          { name: 'Implementation_Plan.xlsx', type: 'sheet' },
          { name: 'Risk_Register.docx', type: 'doc' },
          { name: 'Communication_Plan.pdf', type: 'pdf' },
          { name: 'Weekly_Status_Report.docx', type: 'doc' },
        ],
      },
      {
        name: 'Knowledge Base',
        files: [
          { name: 'Process_Documentation.pdf', type: 'pdf' },
          { name: 'Best_Practices.docx', type: 'doc' },
          { name: 'Lessons_Learned.pdf', type: 'pdf' },
          { name: 'Templates_and_Tools.xlsx', type: 'sheet' },
          { name: 'FAQs.docx', type: 'doc' },
          { name: 'Reference_Materials.pdf', type: 'pdf' },
        ],
      },
    ]

    // Create folders for each phase inside the main project folder
    const phaseFolderIds: Record<string, string> = {}
    for (const phase of phases) {
      const phaseFolderId = await adapter.createFolder(connectionId, projectFolderId, phase.name)
      phaseFolderIds[phase.name] = phaseFolderId

      // Also add meta.json to phase folders so detect can find them? 
      // Actually, my unified naming uses nameLower, but meta is safer.
      await writePockettMeta(phaseFolderId, {
        type: 'document',
        folderType: (phase as any).type || phase.name.toLowerCase(),
        sandboxOnly: true
      })

      const fileIds: string[] = []
      // Create sample files in phase folder
      for (const file of phase.files) {
        const fileId = await createSampleFile(adapter, connectionId, phaseFolderId, file.name, file.type as 'pdf' | 'doc' | 'sheet' | 'slide')
        fileIds.push(fileId)
        totalFiles++
      }

      logger.debug(`Created project subfolder: ${phase.name}`, { fileCount: fileIds.length })
    }

    // Return the single project structure (to be registered in DB)
    projects.push({
      name: projectTemplate,
      folderId: projectFolderId,
      files: [], // Not tracking individual file IDs here for DB registration
      phaseFolderIds,
    })

    logger.info('Test organization created successfully', { orgName, totalFiles, projectCount: projects.length })

    return {
      orgName,
      clientName,
      orgFolderId,
      clientFolderId,
      projects,
      totalFiles,
    }
  } catch (error) {
    logger.error('Failed to create test organization', error as Error)
    throw error
  }
}

/**
 * Create a sample file in Google Drive with appropriate content
 */
async function createSampleFile(
  adapter: IConnectorStorageAdapter,
  connectionId: string,
  parentFolderId: string,
  fileName: string,
  fileType: 'pdf' | 'doc' | 'sheet' | 'slide'
): Promise<string> {
  try {
    const mimeType = getMimeType(fileType)
    const sampleContent = generateSampleContent(fileName, fileType)

    // Create file using Google Drive API
    // Note: This is a simplified version - actual implementation would use Google Docs/Sheets/Slides API
    // For now, we'll create a text file that the adapter can handle
    await adapter.writeFile(connectionId, parentFolderId, fileName, sampleContent)

    return fileName // In real implementation, return the file ID from Drive API
  } catch (error) {
    logger.error(`Failed to create sample file: ${fileName}`, error as Error)
    throw error
  }
}

/**
 * Get MIME type for file extension
 */
function getMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    sheet: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    slide: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  }
  return mimeTypes[fileType] || 'application/octet-stream'
}

/**
 * Generate sample content for different file types
 */
function generateSampleContent(fileName: string, fileType: string): string {
  const baseContent = `# ${fileName}\n\nThis is a sample file created for testing and demonstration purposes.\n\nGenerated: ${new Date().toISOString()}`

  switch (fileType) {
    case 'pdf':
      return `${baseContent}\n\n[PDF Content - Placeholder]`
    case 'doc':
      return baseContent
    case 'sheet':
      return `Header1,Header2,Header3\nValue1,Value2,Value3\nValue4,Value5,Value6`
    case 'slide':
      return `${baseContent}\n\n[Slide 1: Title]\n[Slide 2: Content]`
    default:
      return baseContent
  }
}

/**
 * Generate a URL-safe slug from a name
 */
function generateSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      // Add random suffix for uniqueness
      .concat('-', Math.random().toString(36).substring(2, 6))
  )
}
