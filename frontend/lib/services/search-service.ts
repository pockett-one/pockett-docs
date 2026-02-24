import { prisma } from '../prisma'
import { generateEmbedding } from '../embeddings'
import { logger } from '../logger'

export interface VectorSearchResult {
    externalId: string
    fileName: string
    score: number
    updatedAt: Date
}

export class SearchService {
    /**
     * Index or update a file's embedding and sync metadata to Google Drive.
     */
    static async indexFile(params: {
        organizationId: string
        clientId?: string
        projectId?: string
        externalId: string
        fileName: string
        parentId?: string
    }) {
        try {
            // Junk file exclusion
            const name = params.fileName.toLowerCase()
            const isJunk = [
                '.ds_store',
                'desktop.ini',
                'thumbs.db',
                '.trash',
                '.spotlight-v100',
                '.fseventsd'
            ].some(junk => name === junk || name.endsWith('/' + junk))

            if (isJunk) {
                logger.debug(`Skipping indexing for junk file: ${params.fileName}`)
                return
            }

            // Resolve active connector for the organization
            const { googleDriveConnector } = await import('../google-drive-connector')
            const connector = await prisma.connector.findFirst({
                where: {
                    organizationId: params.organizationId,
                    type: 'GOOGLE_DRIVE',
                    status: 'ACTIVE'
                },
                select: { id: true }
            })

            let driveMetadata: any = {}
            let driveParentId = params.parentId || null

            // 1. Fetch Metadata (Parallel with Embedding)
            const metaPromise = connector ? googleDriveConnector.getFileMetadata(connector.id, params.externalId) : Promise.resolve(null)
            const embeddingPromise = generateEmbedding(params.fileName)

            const [meta, embedding] = await Promise.all([metaPromise, embeddingPromise])
            const embeddingSql = `[${embedding.join(',')}]`

            if (meta) {
                driveMetadata = {
                    thumbnailLink: meta.thumbnailLink,
                    iconLink: meta.iconLink,
                    mimeType: meta.mimeType,
                    size: meta.size,
                    modifiedTime: meta.modifiedTime
                }
                if (!driveParentId && meta.parents && meta.parents.length > 0) {
                    driveParentId = meta.parents[0]
                }
            }

            // 2. Store in Database
            await prisma.$executeRawUnsafe(`
        INSERT INTO portal.file_search_index (
          "organizationId", 
          "clientId", 
          "projectId", 
          "externalId", 
          "parentId",
          "fileName", 
          "embedding",
          "metadata",
          "updatedAt"
        )
        VALUES (
          $1::uuid, 
          $2::uuid, 
          $3::uuid, 
          $4, 
          $5, 
          $6, 
          $7::vector,
          $8::jsonb,
          NOW()
        )
        ON CONFLICT ("organizationId", "externalId") 
        DO UPDATE SET 
          "fileName" = EXCLUDED."fileName",
          "embedding" = EXCLUDED."embedding",
          "clientId" = EXCLUDED."clientId",
          "projectId" = EXCLUDED."projectId",
          "parentId" = EXCLUDED."parentId",
          "metadata" = EXCLUDED."metadata",
          "updatedAt" = NOW()
      `, params.organizationId, params.clientId || null, params.projectId || null, params.externalId, driveParentId, params.fileName, embeddingSql, JSON.stringify(driveMetadata))

            logger.debug(`Indexed file in DB: ${params.fileName} (${params.externalId})`)

            // 3. Sync to GDrive appProperties as well
            if (connector) {
                const properties: Record<string, string> = {
                    organizationId: params.organizationId
                }
                if (params.clientId) properties.clientId = params.clientId
                if (params.projectId) properties.projectId = params.projectId

                await googleDriveConnector.updateAppProperties(connector.id, params.externalId, properties)
                logger.debug(`Synced metadata to GDrive for: ${params.externalId}`)
            }

        } catch (error) {
            logger.error('Failed to index file or sync metadata:', error as Error)
        }
    }

    /**
     * Index multiple files in batch.
     */
    static async indexBatch(params: {
        organizationId: string
        clientId?: string
        projectId?: string
        files: { externalId: string; fileName: string }[]
    }) {
        // Process sequentially to avoid OpenAI rate limits for embeddings
        for (const file of params.files) {
            await this.indexFile({
                organizationId: params.organizationId,
                clientId: params.clientId,
                projectId: params.projectId,
                externalId: file.externalId,
                fileName: file.fileName
            })
            // Small Sleep to be extra safe with rate limits if batch is huge
            if (params.files.length > 5) {
                await new Promise(r => setTimeout(r, 50))
            }
        }
    }

    /**
     * Delete a file or folder (recursively) from the index.
     */
    static async removeFile(organizationId: string, externalId: string) {
        try {
            // Recursive deletion using a CTE to find all descendants
            await prisma.$executeRawUnsafe(`
        WITH RECURSIVE descendants AS (
            SELECT "externalId" 
            FROM portal.file_search_index 
            WHERE "organizationId" = $1::uuid AND "externalId" = $2
            UNION
            SELECT child."externalId"
            FROM portal.file_search_index child
            JOIN descendants d ON child."parentId" = d."externalId"
            WHERE child."organizationId" = $1::uuid
        )
        DELETE FROM portal.file_search_index 
        WHERE "organizationId" = $1::uuid 
        AND "externalId" IN (SELECT "externalId" FROM descendants);
      `, organizationId, externalId)

            logger.debug(`Recursively removed ${externalId} and all children from search index`)
        } catch (error) {
            logger.error('Failed to remove file/folder from vector index:', error as Error)
        }
    }

    /**
     * Perform a similarity search at different hierarchy levels.
     */
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

            // Dynamically build filtering based on level
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

            // Use double quotes for camelCase columns
            const results = await prisma.$queryRawUnsafe<any[]>(`
        SELECT 
          "externalId",
          "fileName",
          "updatedAt",
          "metadata",
          1 - (embedding <=> $1::vector) as score
        FROM portal.file_search_index
        WHERE ${scopeFilter} AND (1 - (embedding <=> $1::vector)) >= 0.75
        ORDER BY embedding <=> $1::vector
        LIMIT $${queryParams.length}
      `, ...queryParams)

            return results.map(r => ({
                externalId: r.externalId,
                fileName: r.fileName,
                updatedAt: new Date(r.updatedAt),
                score: Number(r.score),
                metadata: r.metadata
            }))
        } catch (error) {
            logger.error('Vector similarity search failed:', error as Error)
            return []
        }
    }

    /**
     * Resolves the path from a file up to the project root folders using the indexed hierarchy.
     */
    static async resolvePathToProjectRoot(organizationId: string, externalId: string): Promise<{ id: string; name: string }[]> {
        try {
            const results = await prisma.$queryRawUnsafe<any[]>(`
        WITH RECURSIVE path_resolution AS (
            -- Start with the parent of the requested item
            SELECT "parentId", 0 as level
            FROM portal.file_search_index
            WHERE "organizationId" = $1::uuid AND "externalId" = $2
            
            UNION ALL
            
            -- Recursively find the parent's parent
            SELECT f."parentId", pr.level + 1
            FROM portal.file_search_index f
            JOIN path_resolution pr ON f."externalId" = pr."parentId"
            WHERE f."organizationId" = $1::uuid AND f."parentId" IS NOT NULL
        )
        SELECT p."externalId" as id, p."fileName" as name
        FROM portal.file_search_index p
        JOIN path_resolution pr ON p."externalId" = pr."parentId"
        WHERE p."organizationId" = $1::uuid
        ORDER BY pr.level DESC;
      `, organizationId, externalId)

            return results.map(r => ({
                id: r.id,
                name: r.name
            }))
        } catch (error) {
            logger.error('Failed to resolve path to project root:', error as Error)
            return []
        }
    }
}
