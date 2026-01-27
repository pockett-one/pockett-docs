import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET: List linked files for a connector
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const connectionId = searchParams.get('connectionId')

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        // Fetch linked files (Unique constraint ensures one per file)
        // Filter for isGrantRevoked: false to return only active grants
        const linkedFilesDb = await prisma.linkedFile.findMany({
            where: {
                connectorId: connectionId,
                isGrantRevoked: false
            },
            orderBy: { linkedAt: 'desc' }
        })

        if (linkedFilesDb.length === 0) {
            return NextResponse.json({ files: [] })
        }

        // Fetch real-time metadata for fileIds
        const fileIds = linkedFilesDb.map(f => f.fileId)

        const { googleDriveConnector } = await import('@/lib/google-drive-connector')
        const driveFiles = await googleDriveConnector.getFilesMetadata(connectionId, fileIds)
        const driveFileMap = new Map(driveFiles.map(f => [f.id, f]))

        // Merge DB data with Drive data
        const mergedFiles = linkedFilesDb.map(dbFile => {
            const driveFile = driveFileMap.get(dbFile.fileId)

            return {
                id: dbFile.fileId, // Use fileId as key for frontend actions
                fileId: dbFile.fileId,
                name: driveFile?.name || 'Unknown File',
                mimeType: driveFile?.mimeType || 'unknown',
                size: driveFile?.size ? driveFile.size.toString() : '0',
                linkedAt: dbFile.linkedAt,
                isGrantRevoked: dbFile.isGrantRevoked, // Return boolean flag
                webViewLink: driveFile?.webViewLink
            }
        })

        return NextResponse.json({ files: mergedFiles })
    } catch (error) {
        console.error('Fetch Linked Files Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// DELETE: "Revoke" access (Mutable Soft Delete via Update)
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json()
        const { id, connectionId } = body // id here corresponds to fileId

        if (!id || !connectionId) {
            return NextResponse.json({ error: 'Missing file ID or connection ID' }, { status: 400 })
        }

        // Update existing record to REVOKED
        await prisma.linkedFile.update({
            where: {
                connectorId_fileId: {
                    connectorId: connectionId,
                    fileId: id
                }
            },
            data: {
                isGrantRevoked: true
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Revoke Linked File Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// POST: List files in a Google Drive folder (Proxy to Drive API)
export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check (Manual since no middleware on this route for POST body parsing context?)
        // Actually middleware runs, but we verify user here to get their Context
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
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. Parse Request
        const body = await request.json()
        const { action, folderId } = body

        console.log(`[API] linked-files POST action=${action} folderId=${folderId}`)

        if (action === 'list') {
            if (!folderId) {
                return NextResponse.json({ error: 'Missing folderId' }, { status: 400 })
            }

            // 3. Find Active Connector for User's Default Organization
            // Ideally we should pass orgSlug or ID, but for now we look for default org
            // similar to other routes
            const membership = await prisma.organizationMember.findFirst({
                where: { userId: user.id },
                orderBy: { isDefault: 'desc' }, // Prefer default
                include: {
                    organization: {
                        include: {
                            connectors: {
                                where: { type: 'GOOGLE_DRIVE', status: 'ACTIVE' }
                            }
                        }
                    }
                }
            })

            const connector = membership?.organization.connectors[0]

            if (!connector) {
                return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 })
            }

            // 4. List Files
            const { googleDriveConnector } = await import('@/lib/google-drive-connector')
            // Using the new listFiles method
            const files = await googleDriveConnector.listFiles(connector.id, folderId)

            // Map to frontend format if needed, but DriveFile interface in frontend likely matches
            // We return raw drive files, frontend handles mapping
            return NextResponse.json({ files })
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

    } catch (error) {
        console.error('List Files API Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
