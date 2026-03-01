import { IConnectorStorageAdapter } from '@/lib/connectors/types'
import { logger } from '@/lib/logger'

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

    // 2. Create .pockett metadata in org folder
    await adapter.writeFile(
      connectionId,
      orgFolderId,
      'meta.json',
      JSON.stringify(
        {
          type: 'organization',
          slug: generateSlug(orgName),
          isDefault: true,
          sandboxOnly: true,
        },
        null,
        2
      )
    )

    // 3. Create client folder
    const clientFolderId = await adapter.createFolder(connectionId, orgFolderId, clientName)
    await adapter.writeFile(
      connectionId,
      clientFolderId,
      'meta.json',
      JSON.stringify(
        {
          type: 'client',
          slug: generateSlug(clientName),
          sandboxOnly: true,
        },
        null,
        2
      )
    )

    // 4. Create project folders with sample files
    const projects: TestOrgStructure['projects'] = []
    let totalFiles = 0

    // Define the 5 project phases
    const phases = [
      {
        name: 'Onboarding',
        files: [
          { name: 'Client_Onboarding.pdf', type: 'pdf' },
          { name: 'Initial_Assessment.docx', type: 'doc' },
          { name: 'Stakeholder_Meeting_Notes.docx', type: 'doc' },
          { name: 'Onboarding_Checklist.xlsx', type: 'sheet' },
        ],
      },
      {
        name: 'SoW_MSA',
        files: [
          { name: 'Statement_of_Work.pdf', type: 'pdf' },
          { name: 'Master_Service_Agreement.pdf', type: 'pdf' },
          { name: 'Pricing_and_Terms.xlsx', type: 'sheet' },
          { name: 'Signature_Page.pdf', type: 'pdf' },
        ],
      },
      {
        name: 'Kickoff',
        files: [
          { name: 'Project_Kickoff_Presentation.pptx', type: 'slide' },
          { name: 'Team_Structure.docx', type: 'doc' },
          { name: 'Timeline_and_Milestones.xlsx', type: 'sheet' },
          { name: 'Resource_Plan.pdf', type: 'pdf' },
        ],
      },
      {
        name: 'Project_Planning',
        files: [
          { name: 'Project_Charter.docx', type: 'doc' },
          { name: 'Implementation_Plan.xlsx', type: 'sheet' },
          { name: 'Risk_Register.docx', type: 'doc' },
          { name: 'Communication_Plan.pdf', type: 'pdf' },
          { name: 'Weekly_Status_Report.docx', type: 'doc' },
        ],
      },
      {
        name: 'Knowledge_Base',
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

    // Create each phase folder with files
    for (const phase of phases) {
      const phaseFolderId = await adapter.createFolder(connectionId, clientFolderId, phase.name)

      // Create .pockett metadata in phase folder
      await adapter.writeFile(
        connectionId,
        phaseFolderId,
        'meta.json',
        JSON.stringify(
          {
            type: 'project',
            slug: generateSlug(phase.name),
            sandboxOnly: true,
          },
          null,
          2
        )
      )

      const fileIds: string[] = []

      // Create sample files in phase folder
      for (const file of phase.files) {
        const fileId = await createSampleFile(adapter, connectionId, phaseFolderId, file.name, file.type as 'pdf' | 'doc' | 'sheet' | 'slide')
        fileIds.push(fileId)
        totalFiles++
      }

      projects.push({
        name: phase.name,
        folderId: phaseFolderId,
        files: fileIds,
      })

      logger.debug(`Created project phase: ${phase.name}`, { fileCount: fileIds.length })
    }

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
