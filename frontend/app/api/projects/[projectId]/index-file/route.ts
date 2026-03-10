import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { SearchService } from '@/lib/services/search-service'
import { IndexingInterceptor } from '@/lib/services/indexing-interceptor'
import { logger } from '@/lib/logger'

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

        // 1. Auth Check (Server-side)
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
            (process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 2. Resolve Organization and Client ID if not provided
        let orgId = organizationId
        let cliId = clientId
        if (!orgId || !cliId) {
            const project = await (prisma as any).project.findUnique({
                where: { id: projectId },
                select: { organizationId: true, clientId: true }
            })
            if (project) {
                orgId = orgId || project.organizationId
                cliId = cliId || project.clientId
            }
        }

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
        } else {
            // Single Index
            await IndexingInterceptor.indexSingle(request, {
                organizationId: orgId,
                clientId: cliId,
                projectId,
                externalId: externalId as string,
                fileName: fileName as string
            })
        }

        return NextResponse.json({ success: true, message: 'Indexing triggered' })

    } catch (error) {
        logger.error('Index File API Error:', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
