
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { prisma } from "@/lib/prisma"
import { ConnectorType } from "@prisma/client"
import { googleDriveConnector } from "@/lib/google-drive-connector"

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
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

        // 2. Fetch Organization and Connectors (ALL active Google Drive connectors)
        const organization = await prisma.organization.findUnique({
            where: { userId: user.id },
            include: {
                connectors: {
                    where: { type: ConnectorType.GOOGLE_DRIVE, status: 'ACTIVE' }
                }
            }
        })

        if (!organization) {
            return NextResponse.json({ error: 'Organization not found' }, { status: 404 })
        }

        const driveConnectors = organization.connectors

        if (driveConnectors.length === 0) {
            return NextResponse.json({
                isConnected: false,
                data: []
            })
        }

        // 3. Fetch from ALL Google Drive connections
        const results = await Promise.allSettled(
            driveConnectors.map(connector => googleDriveConnector.getMostRecentFiles(connector.id, 10))
        )

        const allFiles: any[] = []
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                allFiles.push(...result.value)
            } else {
                console.error(`[Insights] Failed to fetch for connector ${driveConnectors[index].email}:`, result.reason)
            }
        })

        // Sort combined list by modifiedTime desc and take top 10
        const sortedFiles = allFiles
            .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
            .slice(0, 10)

        // distinct emails
        const emails = driveConnectors.map(c => c.email).join(', ')

        return NextResponse.json({
            isConnected: true,
            data: sortedFiles,
            connectorEmail: emails
        })

    } catch (error) {
        console.error('Drive insights API error:', error)
        return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }
}
