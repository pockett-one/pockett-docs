import { NextRequest } from 'next/server'
import { safeInngestSend } from '../inngest/client'
import { logger } from '../logger'

export class IndexingInterceptor {
    /**
     * Intercepts a single file operation for indexing by sending an Inngest event.
     */
    static async indexSingle(_request: NextRequest, params: {
        organizationId: string
        clientId?: string
        projectId?: string
        externalId: string
        fileName: string
        parentId?: string
    }) {
        await safeInngestSend('file.index.requested', params)
    }

    /**
     * Intercepts a batch of file operations for indexing by sending an Inngest event.
     */
    static async indexBatch(_request: NextRequest, params: {
        organizationId: string
        clientId?: string
        projectId?: string
        files: { externalId: string; fileName: string; parentId?: string }[]
    }) {
        if (!params.files.length) return

        await safeInngestSend('file.index.batch.requested', params)
    }
}
