import { IConnectorStorageAdapter, POCKETT_DOT_FOLDER, POCKETT_META_FILE } from '@/lib/connectors/types'
import { logger } from '@/lib/logger'

export interface SampleFile {
    name: string
    type: 'pdf' | 'doc' | 'sheet' | 'slide' | 'md' | 'docx' | 'xlsx' | 'pptx'
}

export interface SampleFolder {
    name: string
    files?: SampleFile[]
    subfolders?: SampleFolder[]
}

export const SANDBOX_HIERARCHY = [
    {
        clientName: "Acme Robotics",
        projects: [
            {
                name: "Marketing Strategy Engagement",
                structure: {
                    'Staging': {
                        name: 'Staging',
                        files: [
                            { name: 'Draft Market Analysis Notes.md', type: 'md' },
                            { name: 'Messaging Framework Draft.docx', type: 'docx' },
                            { name: 'Growth Strategy Brainstorm.xlsx', type: 'xlsx' }
                        ]
                    },
                    'Confidential': {
                        name: 'Confidential',
                        files: [
                            { name: 'Internal Revenue Projections.xlsx', type: 'xlsx' },
                            { name: 'Board Strategy Memo.pdf', type: 'pdf' },
                            { name: 'Investor Deck - Confidential.pptx', type: 'pptx' }
                        ]
                    },
                    'General': {
                        name: 'General',
                        subfolders: [
                            {
                                name: '01_Discovery',
                                files: [
                                    { name: 'Discovery Workshop Notes.md', type: 'md' },
                                    { name: 'Client Goals & KPIs.xlsx', type: 'xlsx' },
                                    { name: 'Stakeholder Interview Notes.md', type: 'md' }
                                ]
                            },
                            {
                                name: '02_Market & Competitor Research',
                                files: [
                                    { name: 'Competitor Landscape Analysis.xlsx', type: 'xlsx' },
                                    { name: 'Industry Trends Report.pdf', type: 'pdf' },
                                    { name: 'SWOT Analysis.md', type: 'md' }
                                ]
                            },
                            {
                                name: '03_Customer & ICP Definition',
                                files: [
                                    { name: 'Ideal Customer Profile.xlsx', type: 'xlsx' },
                                    { name: 'Target Audience Segments.pdf', type: 'pdf' },
                                    { name: 'Persona Deep Dive.md', type: 'md' }
                                ]
                            },
                            {
                                name: '04_Internal Operations & Budgeting',
                                files: [
                                    { name: 'Project Budget Tracker.xlsx', type: 'xlsx' },
                                    { name: 'Resource Allocation Plan.pdf', type: 'pdf' },
                                    { name: 'Vendor Contacts.xlsx', type: 'xlsx' }
                                ]
                            },
                            {
                                name: '05_Final Strategy & Execution',
                                files: [
                                    { name: 'Marketing Strategy Final Presentation.pptx', type: 'pptx' },
                                    { name: 'Campaign Launch Timeline.xlsx', type: 'xlsx' },
                                    { name: 'Measurement & Optimization Framework.pdf', type: 'pdf' }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                name: "Product Development Engagement",
                structure: {
                    'General': {
                        name: 'General',
                        subfolders: [
                            {
                                name: '01_Requirements',
                                files: [
                                    { name: 'Product Requirements Document.md', type: 'md' },
                                    { name: 'Feature Prioritization Matrix.xlsx', type: 'xlsx' },
                                    { name: 'User Story Map.xlsx', type: 'xlsx' }
                                ]
                            },
                            {
                                name: '02_Design & Prototyping',
                                files: [
                                    { name: 'UX Research Summary.md', type: 'md' },
                                    { name: 'Wireframe Review Notes.docx', type: 'docx' },
                                    { name: 'Design System Guidelines.pdf', type: 'pdf' }
                                ]
                            },
                            {
                                name: '03_Engineering',
                                files: [
                                    { name: 'Technical Architecture Overview.md', type: 'md' },
                                    { name: 'Sprint Planning Tracker.xlsx', type: 'xlsx' },
                                    { name: 'API Integration Spec.docx', type: 'docx' }
                                ]
                            }
                        ]
                    },
                    'Staging': {
                        name: 'Staging',
                        files: [
                            { name: 'Sprint Demo Deck.pptx', type: 'pptx' },
                            { name: 'QA Test Plan Draft.md', type: 'md' },
                            { name: 'Release Checklist.xlsx', type: 'xlsx' }
                        ]
                    },
                    'Confidential': {
                        name: 'Confidential',
                        files: [
                            { name: 'Product Roadmap - Internal.xlsx', type: 'xlsx' },
                            { name: 'IP & Patent Notes.pdf', type: 'pdf' },
                            { name: 'Engineering Budget.xlsx', type: 'xlsx' }
                        ]
                    }
                }
            }
        ]
    },
    {
        clientName: "Zenith Solutions",
        projects: [
            {
                name: "Cloud Infrastructure Migration",
                structure: {
                    'General': {
                        name: 'General',
                        subfolders: [
                            {
                                name: '01_Discovery & Assessment',
                                files: [
                                    { name: 'Current Infrastructure Inventory.xlsx', type: 'xlsx' },
                                    { name: 'Migration Readiness Assessment.md', type: 'md' },
                                    { name: 'Dependency Mapping.xlsx', type: 'xlsx' }
                                ]
                            },
                            {
                                name: '02_Migration Plan',
                                files: [
                                    { name: 'Cloud Migration Strategy.pdf', type: 'pdf' },
                                    { name: 'Phased Migration Timeline.xlsx', type: 'xlsx' },
                                    { name: 'Risk Register.xlsx', type: 'xlsx' }
                                ]
                            },
                            {
                                name: '03_Runbooks & Handover',
                                files: [
                                    { name: 'Migration Runbook.md', type: 'md' },
                                    { name: 'Rollback Procedures.docx', type: 'docx' },
                                    { name: 'Post-Migration Checklist.xlsx', type: 'xlsx' }
                                ]
                            }
                        ]
                    },
                    'Staging': {
                        name: 'Staging',
                        files: [
                            { name: 'Test Environment Config.md', type: 'md' },
                            { name: 'Load Testing Results.xlsx', type: 'xlsx' },
                            { name: 'UAT Sign-off Tracker.xlsx', type: 'xlsx' }
                        ]
                    },
                    'Confidential': {
                        name: 'Confidential',
                        files: [
                            { name: 'Cloud Provider Pricing Comparison.xlsx', type: 'xlsx' },
                            { name: 'SLA Agreement Draft.pdf', type: 'pdf' },
                            { name: 'Security Credentials Handover.pdf', type: 'pdf' }
                        ]
                    }
                }
            },
            {
                name: "Security Audit 2024",
                structure: {
                    'General': {
                        name: 'General',
                        subfolders: [
                            {
                                name: '01_Scope & Planning',
                                files: [
                                    { name: 'Audit Scope Statement.md', type: 'md' },
                                    { name: 'Asset Register.xlsx', type: 'xlsx' },
                                    { name: 'Audit Timeline & Resources.xlsx', type: 'xlsx' }
                                ]
                            },
                            {
                                name: '02_Findings',
                                files: [
                                    { name: 'Vulnerability Assessment Report.pdf', type: 'pdf' },
                                    { name: 'Findings Tracker.xlsx', type: 'xlsx' },
                                    { name: 'Penetration Test Summary.md', type: 'md' }
                                ]
                            },
                            {
                                name: '03_Remediation',
                                files: [
                                    { name: 'Remediation Roadmap.xlsx', type: 'xlsx' },
                                    { name: 'Risk Acceptance Sign-off.pdf', type: 'pdf' },
                                    { name: 'Re-test Results.md', type: 'md' }
                                ]
                            }
                        ]
                    },
                    'Staging': {
                        name: 'Staging',
                        files: [
                            { name: 'Draft Audit Report v1.docx', type: 'docx' },
                            { name: 'Evidence Collection Log.xlsx', type: 'xlsx' },
                            { name: 'Stakeholder Review Notes.md', type: 'md' }
                        ]
                    },
                    'Confidential': {
                        name: 'Confidential',
                        files: [
                            { name: 'Executive Summary - Confidential.pdf', type: 'pdf' },
                            { name: 'Critical Vulnerabilities Detail.xlsx', type: 'xlsx' },
                            { name: 'Compliance Gap Analysis.pdf', type: 'pdf' }
                        ]
                    }
                }
            }
        ]
    }
]

export const SANDBOX_PROJECT_DATA: Record<string, Record<string, SampleFolder>> = SANDBOX_HIERARCHY.reduce((acc: any, client) => {
    client.projects.forEach(project => {
        acc[project.name] = project.structure
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

const MIME_BY_TYPE: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'md': 'text/markdown',
    'sheet': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'slide': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

export class SampleFileService {
    /**
     * Create sample files in a specific Drive folder
     */
    static async createSampleFiles(
        adapter: IConnectorStorageAdapter,
        connectionId: string,
        folderId: string,
        files: SampleFile[]
    ): Promise<void> {
        await Promise.all(
            files.map(async (file) => {
                try {
                    const content = this.generateSampleContent(file.name, file.type)
                    const mimeType = MIME_BY_TYPE[file.type] || 'text/plain'
                    await adapter.writeFile(connectionId, folderId, file.name, content, mimeType)
                    logger.debug(`Created sample file: ${file.name} in folder: ${folderId}`)
                } catch (error) {
                    logger.error(`Failed to create sample file: ${file.name}`, error as Error)
                }
            })
        )
    }

    /**
     * Create a recursive folder and file structure
     */
    static async createFolderStructure(
        adapter: IConnectorStorageAdapter,
        connectionId: string,
        parentFolderId: string,
        structure: SampleFolder
    ): Promise<void> {
        // 1. Create files in current folder
        if (structure.files && structure.files.length > 0) {
            await this.createSampleFiles(adapter, connectionId, parentFolderId, structure.files)
        }

        // 2. Create subfolders recursively — top-level subfolders in parallel
        if (structure.subfolders && structure.subfolders.length > 0) {
            await Promise.all(
                structure.subfolders.map(async (sub) => {
                    try {
                        const subFolderId = await adapter.findOrCreateFolder(connectionId, parentFolderId, sub.name)
                        const dotPockettId = await adapter.findOrCreateFolder(connectionId, subFolderId, POCKETT_DOT_FOLDER)
                        await adapter.writeFile(connectionId, dotPockettId, POCKETT_META_FILE, JSON.stringify({ type: 'document', folderType: 'general', sandboxOnly: true }))
                        await this.createFolderStructure(adapter, connectionId, subFolderId, sub)
                    } catch (error) {
                        logger.error(`Failed to create subfolder structure: ${sub.name}`, error as Error)
                    }
                })
            )
        }
    }

    /**
     * Generate sample content for different file types
     */
    private static generateSampleContent(fileName: string, fileType: string): string {
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
}
