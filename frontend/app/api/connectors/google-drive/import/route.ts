import { NextRequest, NextResponse } from 'next/server'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { connectionId, fileIds, mode, parentId, userToken } = body // Extract userToken

        if (!connectionId || !fileIds || !Array.isArray(fileIds) || !mode || !parentId) {
            return NextResponse.json(
                { error: 'Missing required params' },
                { status: 400 }
            )
        }

        // Fetch connector backup token just in case, or for shortcuts
        const connector = await prisma.connector.findUnique({ where: { id: connectionId } })
        if (!connector) throw new Error('Connector not found')

        const connectorToken = connector.accessToken
        // Prefer userToken for copy operations as the user owns the source file
        const accessToken = userToken || connectorToken

        if (!accessToken) throw new Error('No access token available')

        // Handle Import Modes
        const importedFiles = []
        console.log(`[Import] Mode: ${mode}, ParentId: ${parentId}, Files: ${fileIds.length}, UsingUserToken: ${!!userToken}`)

        if (mode === 'copy') {
            for (const fileId of fileIds) {
                try {
                    // 1. Get file metadata to check name/mime
                    // MUST include supportAllDrives=true for Shared Drives to work, otherwise 404.
                    const metaRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=name,mimeType&supportsAllDrives=true`, {
                        headers: { Authorization: `Bearer ${accessToken}` }
                    })

                    if (!metaRes.ok) {
                        const txt = await metaRes.text()
                        console.error(`[Import] Failed to fetch meta for ${fileId}: ${txt}`)
                        continue
                    }

                    const meta = await metaRes.json()

                    // 2. Copy
                    // For copy, we also usually need supportsAllDrives if source is in Shared Drive
                    const copyRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/copy?supportsAllDrives=true`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            parents: [parentId],
                            name: meta.name
                        })
                    })

                    if (copyRes.ok) {
                        const data = await copyRes.json()
                        importedFiles.push({ id: data.id, name: data.name, originalId: fileId })
                    } else {
                        const txt = await copyRes.text()
                        console.error(`[Import] Copy failed for ${fileId}: ${txt}`)
                        // Fallback? If we used userToken and it failed (maybe bad destination permission), 
                        // we could try connectorToken, but that usually fails bad source permission.
                    }
                } catch (e) {
                    console.error(`[Import] Exception processing ${fileId}:`, e)
                }
            }
        } else if (mode === 'shortcut') {
            // For shortcuts, we usually want the Connector to own them? 
            // Or the User? If User creates shortcut in Project Folder, User works.
            // But existing code used connectorToken. Let's stick to accessToken (User preferred) 
            // UNLESS explicit logic demands Connector.
            // Actually, if we want the shortcut to be owned by the org, maybe connectorToken is better?
            // But if connectorToken can't see the target file (fileId), it can't create a shortcut TO it.
            // So UserTokens is inherently safer for the "Target".
            const tokenToUse = userToken || connectorToken

            for (const fileId of fileIds) {
                try {
                    const res = await fetch('https://www.googleapis.com/drive/v3/files', {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${tokenToUse}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            mimeType: 'application/vnd.google-apps.shortcut',
                            parents: [parentId],
                            shortcutDetails: {
                                targetId: fileId
                            }
                        })
                    })
                    if (res.ok) {
                        const data = await res.json()
                        importedFiles.push({ id: data.id, name: data.name, targetId: fileId })
                    } else {
                        const txt = await res.text()
                        console.error('[Import] Shortcut failed', txt)
                    }
                } catch (e) {
                    console.error(`[Import] Exception shortcut ${fileId}:`, e)
                }
            }
        }

        return NextResponse.json({ success: true, count: importedFiles.length, files: importedFiles })

    } catch (error: any) {
        console.error('Import error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
