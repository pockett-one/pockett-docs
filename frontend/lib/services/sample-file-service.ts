import sandboxHierarchyJson from './sandbox-hierarchy.json'

export interface SampleFile {
    name: string
    type: 'pdf' | 'doc' | 'sheet' | 'slide' | 'md' | 'docx' | 'xlsx' | 'pptx' | 'jpg' | 'jpeg' | 'png' | 'gif' | 'webp' | 'zip'
}

export interface SampleFolder {
    name: string
    files?: SampleFile[]
    subfolders?: SampleFolder[]
}

/** Sandbox client entry: client name + engagements (folder trees keyed by engagement name). */
export interface SandboxClientEntry {
    clientName: string
    engagements: Array<{
        name: string
        structure: Record<string, SampleFolder>
    }>
}

/** Sandbox config: default firm label + clients. Matches sandbox-hierarchy.json shape. */
export interface SandboxConfig {
    firmName: string
    clients: SandboxClientEntry[]
}

const sandboxConfig = sandboxHierarchyJson as SandboxConfig

/** Default sandbox firm name when first name is unknown. From sandbox-hierarchy.json `firmName`. */
export const SANDBOX_FIRM_NAME_FALLBACK: string = sandboxConfig.firmName

/**
 * Sandbox firm tree. Loaded from sandbox-hierarchy.json for easier maintenance.
 * Edit the JSON to change firm name, clients, engagements, and sample files without touching code.
 */
export const SANDBOX_HIERARCHY: SandboxClientEntry[] = sandboxConfig.clients

/** Folder structure by engagement display name (for sample file population). */
export const SANDBOX_ENGAGEMENT_FOLDER_DATA: Record<string, Record<string, SampleFolder>> =
    SANDBOX_HIERARCHY.reduce((acc: Record<string, Record<string, SampleFolder>>, client) => {
        client.engagements.forEach((engagement) => {
            acc[engagement.name] = engagement.structure
        })
        return acc
    }, {})

export const DEFAULT_SAMPLE_FILES: Record<string, SampleFile[]> = {
    'General': [
        { name: 'Client_Onboarding.pdf', type: 'pdf' },
        { name: 'Initial_Assessment.docx', type: 'doc' },
        { name: 'Stakeholder_Meeting_Notes.docx', type: 'doc' },
        { name: 'Onboarding_Checklist.xlsx', type: 'sheet' },
    ],
    'Confidential': [
        { name: 'Statement_of_Work.pdf', type: 'pdf' },
        { name: 'Master_Service_Agreement.pdf', type: 'pdf' },
        { name: 'Pricing_and_Terms.xlsx', type: 'sheet' },
        { name: 'Signature_Page.pdf', type: 'pdf' },
    ],
    'Staging': [
        { name: 'Project_Kickoff_Presentation.pptx', type: 'slide' },
        { name: 'Team_Structure.docx', type: 'doc' },
        { name: 'Timeline_and_Milestones.xlsx', type: 'sheet' },
        { name: 'Resource_Plan.pdf', type: 'pdf' },
    ]
}

export const MIME_BY_TYPE: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'md': 'text/markdown',
    'sheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'slide': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'zip': 'application/zip',
}

/**
 * Generate sample content for different file types. Used by server when asset is missing.
 */
export function generateSampleContent(fileName: string, fileType: string): string {
    const baseContent = `# ${fileName}\n\nThis is a sample file created for testing and demonstration purposes.\n\nGenerated: ${new Date().toISOString()}`

    switch (fileType) {
        case 'pdf':
            return `${baseContent}\n\n[PDF Content - Placeholder]`
        case 'doc':
        case 'docx':
        case 'md':
            return baseContent
        case 'sheet':
        case 'xlsx':
            return `Header1,Header2,Header3\nValue1,Value2,Value3\nValue4,Value5,Value6`
        case 'slide':
        case 'pptx':
            return `${baseContent}\n\n[Slide 1: Title]\n[Slide 2: Content]`
        default:
            return baseContent
    }
}
