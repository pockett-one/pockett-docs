import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { IndexingInterceptor } from '@/lib/services/indexing-interceptor'
import { logger } from '@/lib/logger'
import { requireProjectManage } from '@/lib/api/project-auth'
import { createPlatformAuditEvent } from '@/lib/platform-audit'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params
        const body = await request.json()
        const { externalId, fileName, organizationId, clientId, files } = body

        if (!files && (!externalId || !fileName)) {
            return NextResponse.json({ error: 'Missing externalId/fileName or files array' }, { status: 400 })
        }

        const authResult = await requireProjectManage(request, projectId)
        if (authResult instanceof NextResponse) return authResult

        const orgId = organizationId || authResult.ctx.orgId
        const cliId = clientId || authResult.ctx.clientId

        if (!orgId) {
            return NextResponse.json({ error: 'Organization context not found' }, { status: 404 })
        }

        // 3. Index File(s) - Non-blocking (blocks only if waitUntil is missing)
        if (files && Array.isArray(files)) {
            // Batch Index
            await IndexingInterceptor.indexBatch(request, {
                organizationId: orgId,
                clientId: cliId,
                projectId,
                files
            })
            // Audit: one event per file added (e.g. upload or import)
            const userId = authResult.user?.id
            for (const f of files as { externalId: string; fileName: string }[]) {
                try {
                    await createPlatformAuditEvent({
                        organizationId: orgId,
                        clientId: cliId ?? undefined,
                        projectId,
                        eventType: 'PROJECT_DOCUMENT_ADDED',
                        actorUserId: userId ?? undefined,
                        metadata: { fileName: f.fileName, externalId: f.externalId },
                    })
                } catch (e) {
                    logger.warn('Index-file: failed to create audit event', e as Error)
                }
            }
        } else {
            // Single Index
            await IndexingInterceptor.indexSingle(request, {
                organizationId: orgId,
                clientId: cliId,
                projectId,
                externalId: externalId as string,
                fileName: fileName as string
            })
            // Audit: file added (upload or import)
            try {
                await createPlatformAuditEvent({
                    organizationId: orgId,
                    clientId: cliId ?? undefined,
                    projectId,
                    eventType: 'PROJECT_DOCUMENT_ADDED',
                    actorUserId: authResult.user?.id ?? undefined,
                    metadata: { fileName: fileName as string, externalId: externalId as string },
                })
            } catch (e) {
                logger.warn('Index-file: failed to create audit event', e as Error)
            }
        }

        return NextResponse.json({ success: true, message: 'Indexing triggered' })

    } catch (error) {
        logger.error('Index File API Error:', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
