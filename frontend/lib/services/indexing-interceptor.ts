import { NextRequest } from 'next/server'
import { SearchService } from './search-service'
import { logger } from '../logger'

export class IndexingInterceptor {
    /**
     * Intercepts a single file operation for indexing.
     * Uses request.waitUntil to make it non-blocking if possible.
     */
    static async indexSingle(request: NextRequest, params: {
        organizationId: string
        clientId?: string
        projectId?: string
        externalId: string
        fileName: string
        parentId?: string
    }) {
        const task = SearchService.indexFile(params)

        if ((request as any).waitUntil) {
            (request as any).waitUntil(task.catch(err => {
                logger.error('Background Indexing Error (Single):', err)
            }))
        } else {
            // Fallback for environments where waitUntil is not available (e.g. local dev)
            // We await it here and don't catch, so the route handler gets the error
            await task
        }
    }

    /**
     * Intercepts a batch of file operations for indexing.
     */
    static async indexBatch(request: NextRequest, params: {
        organizationId: string
        clientId?: string
        projectId?: string
        files: { externalId: string; fileName: string; parentId?: string }[]
    }) {
        if (!params.files.length) return

        const task = SearchService.indexBatch(params)

        if ((request as any).waitUntil) {
            (request as any).waitUntil(task.catch(err => {
                logger.error('Background Indexing Error (Batch):', err)
            }))
        } else {
            await task
        }
    }
}
