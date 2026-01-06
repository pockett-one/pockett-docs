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
