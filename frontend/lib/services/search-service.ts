import { prisma } from '../prisma'
import { generateEmbedding, prepareTextForEmbedding } from '../embeddings'
import { generateSummary } from '../summarization'
import { logger } from '../logger'

export interface VectorSearchResult {
    externalId: string
    fileName: string
    score: number
    updatedAt: Date
    metadata?: any
    isFolder?: boolean
}

export class SearchService {
    /**
     * Index or update a file's embedding and sync metadata to Google Drive (V2)
     */
    static async indexFile(params: {
        organizationId: string
        clientId?: string
        projectId?: string
        externalId: string
        fileName: string
        parentId?: string
    }) {
        const name = params.fileName.toLowerCase()
        const isJunk = [
            '.ds_store', 'desktop.ini', 'thumbs.db', '.trash', '.spotlight-v100', '.fseventsd'
        ].some(junk => name === junk || name.endsWith('/' + junk))

        if (isJunk) {
            logger.debug(`Skipping indexing for junk file: ${params.fileName}`)
            return
        }

        try {
            const { googleDriveConnector } = await import('../google-drive-connector')
            const org = await (prisma as any).organization.findUnique({
                where: { id: params.organizationId },
                select: { id: true, connectorId: true }
            })
            const connectorId = org?.connectorId

            let driveMetadata: any = {}
            let driveParentId = params.parentId || null
            let isFolder = false

            const meta = connectorId ? await googleDriveConnector.getFileMetadata(connectorId, params.externalId) : null
            let summary: string | null = null

            if (meta) {
                isFolder = meta.mimeType === 'application/vnd.google-apps.folder'
                driveMetadata = {
                    thumbnailLink: meta.thumbnailLink,
                    iconLink: meta.iconLink,
                    mimeType: meta.mimeType,
                    size: meta.size,
                    modifiedTime: meta.modifiedTime,
                    webViewLink: meta.webViewLink
                }
                if (!driveParentId && meta.parents && meta.parents.length > 0) {
                    driveParentId = meta.parents[0]
                }

                const isSummarizable = [
                    'application/vnd.google-apps.document',
                    'text/plain', 'text/markdown', 'application/json'
                ].includes(meta.mimeType)

                if (isSummarizable && connectorId) {
                    const text = await googleDriveConnector.getFileText(connectorId, params.externalId)
                    if (text) {
                        summary = await generateSummary(text)
                        if (summary) {
                            driveMetadata.summary = summary
                        }
                    }
                }
            }

            const embeddingText = prepareTextForEmbedding(params.fileName, summary)
            const embedding = await generateEmbedding(embeddingText)
            const embeddingSql = `[${embedding.join(',')}]`

            // Store in platform schema
            await prisma.$executeRawUnsafe(`
    INSERT INTO platform.project_document_search_index (
      "organizationId", 
      "clientId", 
      "projectId", 
      "connectorId",
      "externalId", 
      "parentId",
      "fileName",
      "isFolder",
      "mimeType",
      "fileSize",
      "content",
      "embedding",
      "metadata",
      "updatedAt"
    )
    VALUES (
      $1::uuid, 
      $2::uuid, 
      $3::uuid, 
      $4::uuid, 
      $5, 
      $6, 
      $7, 
      $8::boolean,
      $9,
      $10::bigint,
      $11,
      $12::vector,
      $13::jsonb,
      NOW()
    )
    ON CONFLICT ("organizationId", "externalId") 
    DO UPDATE SET 
      "fileName" = EXCLUDED."fileName",
      "isFolder" = EXCLUDED."isFolder",
      "mimeType" = EXCLUDED."mimeType",
      "fileSize" = EXCLUDED."fileSize",
      "content" = EXCLUDED."content",
      "embedding" = EXCLUDED."embedding",
      "clientId" = EXCLUDED."clientId",
      "projectId" = EXCLUDED."projectId",
      "connectorId" = EXCLUDED."connectorId",
      "parentId" = EXCLUDED."parentId",
      "metadata" = EXCLUDED."metadata",
      "updatedAt" = NOW()
  `,
                params.organizationId,
                params.clientId || null,
                params.projectId || null,
                connectorId || null,
                params.externalId,
                driveParentId,
                params.fileName,
                isFolder,
                meta?.mimeType || null,
                meta?.size ? BigInt(meta.size) : null,
                null,
                embeddingSql,
                JSON.stringify(driveMetadata)
            )

            // Sync to GDrive
            if (connectorId) {
                const properties: Record<string, string> = { organizationId: params.organizationId }
                if (params.clientId) properties.clientId = params.clientId
                if (params.projectId) properties.projectId = params.projectId
                await googleDriveConnector.updateAppProperties(connectorId, params.externalId, properties)
            }

        } catch (error) {
            logger.error('Failed to index file in SearchService (V2):', error as Error)
        }
    }

    static async indexBatch(params: {
        organizationId: string
        clientId?: string
        projectId?: string
        files: { externalId: string; fileName: string }[]
    }) {
        for (const file of params.files) {
            await this.indexFile({
                organizationId: params.organizationId,
                clientId: params.clientId,
                projectId: params.projectId,
                externalId: file.externalId,
                fileName: file.fileName
            })
            if (params.files.length > 5) await new Promise(r => setTimeout(r, 50))
        }
    }

    static async removeFile(organizationId: string, externalId: string) {
        try {
            await prisma.$executeRawUnsafe(`
        WITH RECURSIVE descendants AS (
            SELECT "externalId" 
            FROM platform.project_document_search_index 
            WHERE "organizationId" = $1::uuid AND "externalId" = $2
            UNION
            SELECT child."externalId"
            FROM platform.project_document_search_index child
            JOIN descendants d ON child."parentId" = d."externalId"
            WHERE child."organizationId" = $1::uuid
        )
        DELETE FROM platform.project_document_search_index 
        WHERE "organizationId" = $1::uuid 
        AND "externalId" IN (SELECT "externalId" FROM descendants);
      `, organizationId, externalId)
        } catch (error) {
            logger.error('Failed to remove file from platform search index:', error as Error)
        }
    }

    static async searchSimilarityHierarchy(params: {
        organizationId: string
        clientId?: string
        projectId?: string
        query: string
        limit?: number
    }): Promise<VectorSearchResult[]> {
        try {
            const embedding = await generateEmbedding(params.query)
            const embeddingSql = `[${embedding.join(',')}]`
            const limit = params.limit || 20

            let scopeFilter = `"organizationId" = $2::uuid`
            const queryParams: any[] = [embeddingSql, params.organizationId]

            if (params.projectId) {
                scopeFilter += ` AND "projectId" = $3::uuid`
                queryParams.push(params.projectId)
            } else if (params.clientId) {
                scopeFilter += ` AND "clientId" = $3::uuid`
                queryParams.push(params.clientId)
            }
            queryParams.push(limit)

            const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          "externalId",
          "fileName",
          "updatedAt",
          "metadata",
          "isFolder",
          1 - (embedding <=> $1::vector) as score
        FROM platform.project_document_search_index
        WHERE ${scopeFilter}
        ORDER BY embedding <=> $1::vector
        LIMIT $${queryParams.length}
      `, ...queryParams)

            return results.map(r => ({
                externalId: r.externalId,
                fileName: r.fileName,
                updatedAt: new Date(r.updatedAt),
                score: Number(r.score),
                metadata: r.metadata,
                isFolder: Boolean(r.isFolder)
            }))
        } catch (error) {
            logger.error('Vector search failed in platform schema:', error as Error)
            return []
        }
    }

    static async getAllProjectFolderIds(params: {
        organizationId: string
        projectId: string
    }): Promise<string[]> {
        try {
            const results = await prisma.$queryRawUnsafe<{ externalId: string }[]>(`
        SELECT "externalId"
        FROM platform.project_document_search_index
        WHERE "organizationId" = $1::uuid
          AND "projectId" = $2::uuid
          AND "isFolder" = true
      `, params.organizationId, params.projectId)
            return results.map(r => r.externalId)
        } catch (error) {
            logger.error('getAllProjectFolderIds failed:', error as Error)
            return []
        }
    }

    static async searchByFileName(params: {
        organizationId: string
        clientId?: string
        projectId?: string
        query: string
        limit?: number
    }): Promise<VectorSearchResult[]> {
        try {
            const limit = params.limit || 20
            let scopeFilter = `"organizationId" = $1::uuid`
            const queryParams: any[] = [params.organizationId, `%${params.query}%`]

            if (params.projectId) {
                scopeFilter += ` AND "projectId" = $3::uuid`
                queryParams.push(params.projectId)
            } else if (params.clientId) {
                scopeFilter += ` AND "clientId" = $3::uuid`
                queryParams.push(params.clientId)
            }
            queryParams.push(limit)

            const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT
          "externalId",
          "fileName",
          "updatedAt",
          "metadata",
          "isFolder"
        FROM platform.project_document_search_index
        WHERE ${scopeFilter}
          AND "fileName" ILIKE $2
        ORDER BY "updatedAt" DESC
        LIMIT $${queryParams.length}
      `, ...queryParams)

            return results.map(r => ({
                externalId: r.externalId,
                fileName: r.fileName,
                updatedAt: new Date(r.updatedAt),
                score: 0.92,
                metadata: r.metadata,
                isFolder: Boolean(r.isFolder)
            }))
        } catch (error) {
            logger.error('Filename search failed in platform schema:', error as Error)
            return []
        }
    }

    static async resolvePathToProjectRoot(organizationId: string, externalId: string): Promise<{ id: string; name: string }[]> {
        try {
            const results = await prisma.$queryRawUnsafe<any[]>(`
        WITH RECURSIVE path_resolution AS (
            SELECT "parentId", 0 as level
            FROM platform.project_document_search_index
            WHERE "organizationId" = $1::uuid AND "externalId" = $2
            UNION ALL
            SELECT f."parentId", pr.level + 1
            FROM platform.project_document_search_index f
            JOIN path_resolution pr ON f."externalId" = pr."parentId"
            WHERE f."organizationId" = $1::uuid AND f."parentId" IS NOT NULL
        )
        SELECT p."externalId" as id, p."fileName" as name
        FROM platform.project_document_search_index p
        JOIN path_resolution pr ON p."externalId" = pr."parentId"
        WHERE p."organizationId" = $1::uuid
        ORDER BY pr.level DESC;
      `, organizationId, externalId)
            return results.map(r => ({ id: r.id, name: r.name }))
        } catch (error) {
            logger.error('resolvePathToProjectRoot failed:', error as Error)
            return []
        }
    }
}
