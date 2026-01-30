import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from "@/lib/prisma"
import { ConnectorType } from "@prisma/client"
import { googleDriveConnector } from "@/lib/google-drive-connector"
import { logger } from '@/lib/logger'

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check
        const authHeader = request.headers.get('authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
        }

        // 2. Parse Request Body
        const body = await request.json()
        const { action, fileId, limit, permissionId, expirationTime } = body
        // Optional: specific connectorId. If not provided, use default.
        let { connectorId } = body

        if (!action) {
            return NextResponse.json({ error: 'Action is required' }, { status: 400 })
        }

        // 3. Get Active Connectors
        const membership = await prisma.organizationMember.findFirst({
            where: {
                userId: user.id,
                isDefault: true
            },
            include: {
                organization: {
                    include: {
                        connectors: {
                            where: { type: ConnectorType.GOOGLE_DRIVE, status: 'ACTIVE' }
                        }
                    }
                }
            }
        })

        if (!membership || !membership.organization || membership.organization.connectors.length === 0) {
            return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 })
        }

        const connectors = membership.organization.connectors

        // 4. Perform Action
        let result

        switch (action) {
            case 'trash':
                if (!fileId) {
                    return NextResponse.json({ error: 'fileId is required for trash action' }, { status: 400 })
                }
                // Try to find the file in ANY connector if connectorId not provided
                //Ideally frontend should pass connectorId, but for now we try the first or look up?
                // For safety/simplicity in this fix, we use specific connector if passed, or default to first (legacy behavior) 
                // BUT we loop to find where it works? No, "trash" is dangerous to "try".
                // We fallback to first connector for now to maintain existing behavior for Actions, 
                // but we FIX the Search actions below.
                const targetConnectorId = connectorId || connectors[0].id

                const success = await googleDriveConnector.trashFile(targetConnectorId, fileId)
                if (!success) {
                    // Start basic multi-connector fallback for trash if default failed? 
                    // No, simpler to rely on just the default for now until frontend sends connectorId.
                    return NextResponse.json({ error: 'Failed to trash file (File not found or permission denied)' }, { status: 500 })
                }
                result = { success: true }
                break

            case 'duplicate_search':
                // Search ALL connectors and aggregate
                const searchLimit = Math.min(limit || 50, 100)
                const duplicatePromises = connectors.map(async c => {
                    const groups = await googleDriveConnector.getDuplicateFiles(c.id, searchLimit)
                    // Inject source info? Duplicate groups structure is complex [[file, file], [file, file]]
                    // We might need to flatten or tag? 
                    // getDuplicateFiles returns File[][].
                    return groups
                })

                const duplicateResults = await Promise.all(duplicatePromises)
                // Flatten: File[][] -> File[] (groups)
                const duplicates = duplicateResults.flat()
                result = { duplicates }
                break

            case 'stale_search':
                // Search ALL connectors and aggregate
                const staleLimit = Math.min(limit || 50, 100)
                const stalePromises = connectors.map(async c => {
                    try {
                        logger.debug(`[Stale Action] Fetching for ${c.email}...`)
                        const files = await googleDriveConnector.getStaleFiles(c.id, staleLimit)
                        logger.debug(`[Stale Action] ${c.email} returned ${files.length} files`)
                        // Inject connector info so frontend has context
                        return files.map(f => ({
                            ...f,
                            connectorId: c.id,
                            source: c.email
                        }))
                    } catch (e) {
                        logger.error(`[Stale Action] Failed to search stale files for ${c.email}`, e as Error)
                        return []
                    }
                })

                const staleArrays = await Promise.all(stalePromises)
                const staleFiles = staleArrays.flat()
                result = { files: staleFiles }
                break

            case 'revoke':
                if (!fileId || !permissionId) {
                    return NextResponse.json({ error: 'fileId and permissionId are required' }, { status: 400 })
                }
                const revokeConnectorId = connectorId || connectors[0].id
                const revoked = await googleDriveConnector.revokePermission(revokeConnectorId, fileId, permissionId)
                if (!revoked) {
                    return NextResponse.json({ error: 'Failed to revoke permission' }, { status: 500 })
                }
                result = { success: true }
                break

            case 'set_expiry':
                if (!fileId || !permissionId || !expirationTime) {
                    return NextResponse.json({ error: 'fileId, permissionId and expirationTime are required' }, { status: 400 })
                }
                const expiryConnectorId = connectorId || connectors[0].id
                const updated = await googleDriveConnector.updatePermissionExpiry(expiryConnectorId, fileId, permissionId, expirationTime)
                if (!updated) {
                    return NextResponse.json({ error: 'Failed to update permission' }, { status: 500 })
                }
                result = { success: true }
                break

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

        return NextResponse.json(result)

    } catch (error) {
        logger.error('Action API Error:', error as Error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
