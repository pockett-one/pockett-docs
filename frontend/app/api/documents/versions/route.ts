
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleDriveConnector } from "@/lib/google-drive-connector"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const fileId = searchParams.get('fileId')
        const connectorId = searchParams.get('connectorId')

        if (!fileId || !connectorId) {
            return NextResponse.json({ error: 'Missing fileId or connectorId' }, { status: 400 })
        }

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

        // 2. Fetch Revisions
        try {
            const revisions = await googleDriveConnector.getRevisions(connectorId, fileId)
            return NextResponse.json({ revisions })
        } catch (error) {
            console.error('[API] Failed to fetch revisions:', error)
            return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 })
        }

    } catch (error) {
        console.error('Versions API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
