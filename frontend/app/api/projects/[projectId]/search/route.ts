import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from "@/lib/prisma"
import { ConnectorType } from "@prisma/client"
import { googleDriveConnector } from "@/lib/google-drive-connector"
import { logger } from '@/lib/logger'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params
        const { searchParams } = new URL(request.url)
        const query = searchParams.get('q')

        if (!query) {
            return NextResponse.json({ files: [] })
        }

        // 1. Auth Check
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 2. Get Project and Folders
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    include: {
                        organization: {
                            include: {
                                connectors: {
                                    where: { type: ConnectorType.GOOGLE_DRIVE, status: 'ACTIVE' }
                                }
                            }
                        }
                    }
                }
            }
        })

        if (!project || !project.client?.organization?.connectors.length) {
            return NextResponse.json({ error: 'Project or active connector not found' }, { status: 404 })
        }

        const connector = project.client.organization.connectors[0]

        // 3. Resolve Project Folders from Connector Settings
        const settings = (connector.settings as any) || {}
        const ps = settings.projectFolderSettings?.[project.slug] || {}

        const parentFolderIds = [
            ps.generalFolderId,
            ps.confidentialFolderId,
            ps.stagingFolderId
        ].filter(Boolean) as string[]

        // 4. Perform Search (Parallel Keyword & Vector)
        const { SearchService } = await import('@/lib/services/search-service')

        const [driveFiles, vectorResults] = await Promise.all([
            googleDriveConnector.searchFiles(connector.id, query, {
                parentFolderIds,
                limit: 50
            }),
            SearchService.searchSimilarityHierarchy({
                organizationId: project.client!.organizationId,
                clientId: project.clientId,
                projectId,
                query,
                limit: 30
            })
        ])

        // 5. Merge results (Favor vector matches that aren't already in Drive results)
        // Deduplicate by ID
        const driveFileIdSet = new Set(driveFiles.map(f => f.id))
        const missingVectorResults = vectorResults.filter(r => !driveFileIdSet.has(r.externalId))

        let finalFiles = driveFiles.map(f => ({ ...f, matchType: 'keyword', score: 1.0 }))

        if (missingVectorResults.length > 0) {
            try {
                const missingIds = missingVectorResults.map(r => r.externalId)
                const vectorMeta = await googleDriveConnector.getFilesMetadata(connector.id, missingIds)

                const scoredVectorFiles = vectorMeta.map(f => {
                    const vRes = missingVectorResults.find(r => r.externalId === f.id)
                    return {
                        ...f,
                        matchType: 'semantic',
                        score: vRes?.score || 0,
                        updatedAt: vRes?.updatedAt, // Use the indexed updatedAt
                        metadata: {
                            ...(f.metadata || {}),
                            ...(vRes?.metadata || {})
                        }
                    }
                })
                finalFiles = [...finalFiles, ...scoredVectorFiles]
            } catch (e) {
                logger.warn('Failed to fetch metadata for semantic search results', { error: e })
            }
        }

        // 6. Recency-Weighted Sort
        // We boost scores based on how recent the file is
        const now = Date.now()
        const DAY_MS = 24 * 60 * 60 * 1000

        finalFiles.sort((a: any, b: any) => {
            const getRecencyBoost = (dateStr: string | Date | undefined) => {
                if (!dateStr) return 0
                const date = new Date(dateStr)
                const ageDays = (now - date.getTime()) / DAY_MS
                // Logarithmic decay: newer files get higher boost
                return Math.max(0, 1 / (1 + Math.log10(1 + ageDays)))
            }

            const scoreA = (a.score || 0) * 0.7 + getRecencyBoost(a.updatedAt || a.modifiedTime) * 0.3
            const scoreB = (b.score || 0) * 0.7 + getRecencyBoost(b.updatedAt || b.modifiedTime) * 0.3

            return scoreB - scoreA
        })

        return NextResponse.json({ files: finalFiles.slice(0, 50) })

    } catch (error) {
        logger.error('Project Search API Error:', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
