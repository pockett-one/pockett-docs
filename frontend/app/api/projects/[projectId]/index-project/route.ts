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
            (process.env.NEXT_PUBLIC_SUPABASE_PROXY_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321"),
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 2. Get Project and Connector
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

        // 4. Recursive Scan All Files
        let allFiles: { id: string, name: string }[] = []
        const MAX_FILES = 200 // Safety limit for a single request

        const scanRecursive = async (folderId: string) => {
            if (allFiles.length >= MAX_FILES) return
            const files = await googleDriveConnector.listFiles(connector.id, folderId, 1000)
            for (const file of files) {
                if (allFiles.length >= MAX_FILES) break
                allFiles.push({ id: file.id, name: file.name })
                if (file.mimeType === 'application/vnd.google-apps.folder') {
                    await scanRecursive(file.id)
                }
            }
        }

        for (const folderId of parentFolderIds) {
            await scanRecursive(folderId)
        }

        // 5. Batch Index
        const filesToIndex = allFiles
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
            message: allFiles.length >= MAX_FILES ? `Indexed first ${MAX_FILES} files found recursively.` : `Indexed all ${allFiles.length} files found recursively.`
        })

    } catch (error) {
        logger.error('Index Project API Error:', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
