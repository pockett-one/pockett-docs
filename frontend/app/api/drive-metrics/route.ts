
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

        const sortParam = searchParams.get('sort')
        const rangeParam = searchParams.get('range') || '7d' // Default to 7d
        const validRange = ['24h', '7d', '30d', '1y'].includes(rangeParam) ? rangeParam : '7d'
        const isAccessedSort = sortParam === 'accessed'

        // 3. Fetch from ALL Google Drive connections
        const fetchPromises = driveConnectors.map(async (connector) => {
            try {
                // If sort=accessed, fetch most ACTIVE files (based on Activity API)
                // Otherwise fetch most recent files
                const files = isAccessedSort
                    ? await googleDriveConnector.getMostActiveFiles(connector.id, safeLimit, validRange as any)
                    : await googleDriveConnector.getMostRecentFiles(connector.id, safeLimit, validRange as any)

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

        // Sort combined list
        // If sort=accessed, sort by viewedByMeTime
        // Otherwise sort by modifiedTime
        const sortedFiles = allFiles
            .sort((a, b) => {
                if (isAccessedSort) {
                    const countA = a.activityCount || 0
                    const countB = b.activityCount || 0
                    if (countA !== countB) return countB - countA // Higher activity first

                    const timeA = a.viewedByMeTime ? new Date(a.viewedByMeTime).getTime() : 0
                    const timeB = b.viewedByMeTime ? new Date(b.viewedByMeTime).getTime() : 0
                    return timeB - timeA
                }
                return new Date(b.modifiedTime).getTime() - new Date(a.modifiedTime).getTime()
            })
            .slice(0, safeLimit)

        // 4. Fetch Storage Quota from ALL Google Drive connections
        const quotaPromises = driveConnectors.map(async (connector) => {
            try {
                return await googleDriveConnector.getStorageQuota(connector.id)
            } catch (error) {
                console.error(`[Insights] Failed to fetch quota for connector ${connector.email}:`, error)
                return null
            }
        })

        const quotaResults = await Promise.allSettled(quotaPromises)
        let totalLimit = 0
        let totalUsed = 0

        const accounts: { id: string, email: string, limit: number, used: number }[] = []

        quotaResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                const q = result.value
                const connector = driveConnectors[index] // Map back to connector using index

                const accLimit = q.limit ? parseInt(q.limit) : 0
                const accUsed = q.usage ? parseInt(q.usage) : 0

                if (q.limit) totalLimit += accLimit
                if (q.usage) totalUsed += accUsed

                accounts.push({
                    id: connector.id,
                    email: connector.email,
                    limit: accLimit,
                    used: accUsed
                })
            }
        })

        // distinct emails
        const emails = driveConnectors.map(c => c.email).join(', ')

        return NextResponse.json({
            isConnected: true,
            data: sortedFiles,
            connectorEmail: emails,
            storageUsage: {
                limit: totalLimit,
                used: totalUsed,
                accounts: accounts
            }
        })

    } catch (error) {
        console.error('Drive insights API error:', error)
        return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 })
    }
}
