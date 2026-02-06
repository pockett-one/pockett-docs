import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check - Manual
        const authHeader = request.headers.get('authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { createClient } = require('@supabase/supabase-js')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)
        if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // 2. Parse JSON
        let body
        try {
            body = await request.json()
        } catch (err: any) {
            return NextResponse.json({ error: 'Invalid JSON body', details: err.message }, { status: 400 })
        }

        const { name, mimeType, parentId, connectionId, fileId } = body

        if (!name || !mimeType) return NextResponse.json({ error: 'Missing name or mimeType' }, { status: 400 })
        if (!parentId && !fileId) return NextResponse.json({ error: 'No parent folder specified' }, { status: 400 })

        // 3. Find Connector
        let connector;
        if (connectionId) {
            connector = await prisma.connector.findUnique({ where: { id: connectionId } })
        } else {
            const membership = await prisma.organizationMember.findFirst({
                where: { userId: user.id },
                orderBy: { isDefault: 'desc' },
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
            connector = membership?.organization.connectors[0]
        }

        if (!connector) return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 })

        // 4. Get Resumable Upload URL
        const { googleDriveConnector } = await import('@/lib/google-drive-connector')
        const origin = request.headers.get('origin') || request.headers.get('referer') || ''

        const uploadUrl = await googleDriveConnector.getResumableUploadUrl(connector.accessToken, {
            name,
            mimeType,
            parents: [parentId]
        }, fileId, origin) // Pass fileId if present for overwrite, and origin for CORS

        return NextResponse.json({ uploadUrl })

    } catch (e: any) {
        console.error('Upload Init Error:', e)
        return NextResponse.json({ error: e.message || 'Upload initialization failed' }, { status: 500 })
    }
}
