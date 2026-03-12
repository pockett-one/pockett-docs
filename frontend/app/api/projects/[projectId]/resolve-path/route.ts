import { NextRequest, NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma"
import { SearchService } from '@/lib/services/search-service'
import { logger } from '@/lib/logger'
import { requireProjectView } from '@/lib/api/project-auth'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params
        const { searchParams } = new URL(request.url)
        const fileId = searchParams.get('fileId')

        if (!fileId) {
            return NextResponse.json({ error: 'Missing fileId' }, { status: 400 })
        }

        const authResult = await requireProjectView(request, projectId)
        if (authResult instanceof NextResponse) return authResult

        const path = await SearchService.resolvePathToProjectRoot(authResult.ctx.orgId, fileId)

        return NextResponse.json({ path })

    } catch (error) {
        logger.error('Resolve Path API Error:', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
