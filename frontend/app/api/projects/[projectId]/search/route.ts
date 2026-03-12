import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { googleDriveConnector } from "@/lib/google-drive-connector"
import { logger } from '@/lib/logger'
import { requireProjectView } from '@/lib/api/project-auth'

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

        const authResult = await requireProjectView(request, projectId)
        if (authResult instanceof NextResponse) return authResult

        const project = await (prisma as any).project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    include: {
                        organization: {
                            include: {
                                connector: true
                            }
                        }
                    }
                }
            }
        })

        if (!project || !project.client?.organization?.connector) {
            return NextResponse.json({ error: 'Project or active connector not found' }, { status: 404 })
        }

        const connector = project.client.organization.connector

        // 3. Resolve Project Folders from Connector Settings
        const settings = (connector.settings as any) || {}
        const ps = settings.projectFolderSettings?.[project.slug] || {}

        const parentFolderIds = [
            ps.generalFolderId,
            ps.confidentialFolderId,
            ps.stagingFolderId
        ].filter(Boolean) as string[]

        // 4. Perform Search (Parallel: Drive keyword + Vector similarity + DB filename)
        //
        // Three complementary strategies:
        //  - Drive keyword: fast, but only searches direct children of parentFolderIds (non-recursive)
        //  - Vector (no threshold): returns top-N closest embeddings. We enrich the query with
        //    domain synonyms before embedding so that concept queries like "legal" produce a vector
        //    close enough to filename-only embeddings like "NDA between ...". This is a bridge
        //    until document content is indexed (which would make this unnecessary).
        //  - ILIKE filename: catches any indexed file at any subfolder depth whose name contains
        //    the query string — the recursive fallback for the Drive API's depth limitation.
        const { SearchService } = await import('@/lib/services/search-service')

        // Expand Drive search scope to all indexed subfolders so keyword search is recursive.
        // Drive's `in parents` only finds direct children — by adding every indexed folder ID
        // as a parent, Drive will search one level inside each of them, effectively covering
        // the full indexed folder tree. Capped at 50 IDs to stay within Drive API URL limits.
        const indexedFolderIds = await SearchService.getAllProjectFolderIds({
            organizationId: project.client!.organizationId,
            projectId
        })
        const allParentFolderIds = Array.from(new Set([...parentFolderIds, ...indexedFolderIds])).slice(0, 50)

        // Enrich the query for vector embedding only — this does NOT drive multiple ILIKE searches.
        // The expanded string produces a richer embedding that bridges concept gaps (e.g. "legal"
        // → closer to "NDA" in vector space) without adding round-trips or complexity.
        const QUERY_ENRICHMENTS: Record<string, string> = {
            legal: 'legal NDA contract agreement terms compliance confidential',
            finance: 'finance budget revenue invoice payment accounting expense',
            marketing: 'marketing campaign brand advertising launch creative',
            hr: 'HR recruitment hiring onboarding payroll personnel',
            security: 'security confidential NDA privacy GDPR access',
            technical: 'technical spec architecture API schema design roadmap',
            operations: 'operations process workflow SOP policy procedure',
        }
        const lowerQuery = query.toLowerCase()
        const vectorQuery = QUERY_ENRICHMENTS[lowerQuery]
            ?? Object.entries(QUERY_ENRICHMENTS).find(([k]) => lowerQuery.includes(k))?.[1]
            ?? query

        const [driveFiles, vectorResults, dbNameResults] = await Promise.all([
            googleDriveConnector.searchFiles(connector.id, query, {
                parentFolderIds: allParentFolderIds,
                limit: 50
            }),
            SearchService.searchSimilarityHierarchy({
                organizationId: project.client!.organizationId,
                clientId: project.clientId,
                projectId,
                query: vectorQuery,   // enriched for better semantic coverage
                limit: 30
            }),
            SearchService.searchByFileName({
                organizationId: project.client!.organizationId,
                clientId: project.clientId,
                projectId,
                query,
                limit: 30
            })
        ])

        // 5. Merge results — Drive keyword results take priority, then fill in from
        //    vector + DB name matches that aren't already covered.
        const driveFileIdSet = new Set(driveFiles.map(f => f.id))

        // Combine vector and DB name results, dedup against each other
        const allIndexedResults = [...vectorResults]
        const vectorIdSet = new Set(vectorResults.map(r => r.externalId))
        for (const r of dbNameResults) {
            if (!vectorIdSet.has(r.externalId)) {
                allIndexedResults.push(r)
            }
        }

        const missingIndexedResults = allIndexedResults.filter(r => !driveFileIdSet.has(r.externalId))

        let finalFiles = driveFiles.map(f => ({ ...f, matchType: 'keyword', score: 1.0 }))

        if (missingIndexedResults.length > 0) {
            try {
                const missingIds = missingIndexedResults.map(r => r.externalId)
                const indexedMeta = await googleDriveConnector.getFilesMetadata(connector.id, missingIds)

                const scoredIndexedFiles = indexedMeta.map(f => {
                    const iRes = missingIndexedResults.find(r => r.externalId === f.id)
                    // Prefer 'name' matchType for DB name hits; 'semantic' for pure vector hits
                    const isNameMatch = dbNameResults.some(r => r.externalId === f.id)
                    return {
                        ...f,
                        matchType: isNameMatch ? 'name' : 'semantic',
                        score: iRes?.score || 0,
                        updatedAt: iRes?.updatedAt,
                        metadata: {
                            ...(f.metadata || {}),
                            ...(iRes?.metadata || {})
                        }
                    }
                })
                finalFiles = [...finalFiles, ...scoredIndexedFiles]
            } catch (e) {
                logger.warn('Failed to fetch metadata for indexed search results', { error: e })
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
