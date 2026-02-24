import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { SearchService } from '@/lib/services/search-service'
import { logger } from '@/lib/logger'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ projectId: string }> }
) {
    try {
        const { projectId } = await params

        // 1. Auth Check
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 2. Get Project and Connector
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                client: {
                    include: {
                        organization: {
                            include: {
                                connectors: {
                                    where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' }
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
        const orgId = project.client.organizationId
        const cliId = project.clientId

        // 3. Resolve Project Folders
        const settings = (connector.settings as any) || {}
        const ps = settings.projectFolderSettings?.[project.slug] || {}
        const parentFolderIds = [
            ps.generalFolderId,
            ps.confidentialFolderId,
            ps.stagingFolderId
        ].filter(Boolean) as string[]

        if (parentFolderIds.length === 0) {
            return NextResponse.json({ error: 'No project folders configured' }, { status: 400 })
        }

        // 4. List All Files (Deep scan could be expensive, but for now we list top-level of target folders)
        // In a real production app, we might want a recursive scan
        let allFiles: any[] = []
        for (const folderId of parentFolderIds) {
            const files = await googleDriveConnector.listFiles(connector.id, folderId, 1000)
            allFiles = [...allFiles, ...files]
        }

        // 5. Batch Index (Synchronous for now, but should ideally be a background job)
        // To avoid timing out, we limit the number of files indexed in one go or return immediately
        const limit = 50
        const filesToIndex = allFiles.slice(0, limit)

        // Process in small batches or sequence to avoid rate limits
        for (const file of filesToIndex) {
            await SearchService.indexFile({
                organizationId: orgId,
                clientId: cliId,
                projectId,
                externalId: file.id,
                fileName: file.name
            })
        }

        return NextResponse.json({
            success: true,
            indexedCount: filesToIndex.length,
            totalFound: allFiles.length,
            message: allFiles.length > limit ? `Indexed first ${limit} files. Repeat as needed.` : `Indexed all ${allFiles.length} files.`
        })

    } catch (error) {
        logger.error('Index Project API Error:', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
