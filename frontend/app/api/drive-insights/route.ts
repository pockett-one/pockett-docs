
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
        const { searchParams } = new URL(request.url)
        const limitParam = searchParams.get('limit')
        const limit = limitParam ? parseInt(limitParam) : 10
        const safeLimit = Math.min(Math.max(limit, 1), 50)

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

        // 2. Get user's default organization via OrganizationMember
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

        if (!membership || !membership.organization) {
            return NextResponse.json({
                isConnected: false,
                data: []
            })
        }

        const organization = membership.organization
        const driveConnectors = organization.connectors

        if (driveConnectors.length === 0) {
            return NextResponse.json({
                isConnected: false,
                data: []
            })
        }

        // 3. Fetch from ALL Google Drive connections
        const fetchPromises = driveConnectors.map(async (connector) => {
            try {
                const files = await googleDriveConnector.getMostRecentFiles(connector.id, safeLimit)
                // Inject connector info into each file
                return files.map((f: any) => ({
                    ...f,
                    source: connector.email, // Use email as source identifier
                    connectorId: connector.id
                }))
            } catch (error) {
                console.error(`[Insights] Failed to fetch for connector ${connector.email}:`, error)
                return []
            }
        })

        const results = await Promise.allSettled(fetchPromises)

        const allFiles: any[] = []
        results.forEach((result) => {
            if (result.status === 'fulfilled') {
                allFiles.push(...result.value)
            }
        })

        // Sort combined list by modifiedTime desc and take top N
        const sortedFiles = allFiles
            .sort((a, b) => new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime())
            .slice(0, safeLimit)

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
