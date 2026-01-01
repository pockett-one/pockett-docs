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

        // 2. Get user's default organization
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
                stale: 0,
                large: 0,
                sensitive: 0,
                risky: 0
            })
        }

        const driveConnectors = membership.organization.connectors

        if (driveConnectors.length === 0) {
            return NextResponse.json({
                stale: 0,
                large: 0,
                sensitive: 0,
                risky: 0
            })
        }

        // 3. Fetch comprehensive file samples from all connectors
        const allFilesPromises = driveConnectors.map(async (connector) => {
            try {
                // Fetch multiple types of files to get a comprehensive sample
                // Increased limits to ensure better coverage (aiming for > 500 total)
                const [recent, trending, shared, sharedByMe, stale, large1, large2] = await Promise.all([
                    googleDriveConnector.getMostRecentFiles(connector.id, 150, '1y', undefined, connector.email),
                    googleDriveConnector.getMostActiveFiles(connector.id, 100, '1y'),
                    googleDriveConnector.getSharedFiles(connector.id, 100),
                    googleDriveConnector.getSharedByMeFiles(connector.id, 100),
                    // Explicitly fetch stale files to ensure they are counted
                    googleDriveConnector.getStaleFiles(connector.id, 100),
                    // Fetch large files from different size ranges
                    googleDriveConnector.getStorageFiles(connector.id, 60, '5-10', 'all'),
                    googleDriveConnector.getStorageFiles(connector.id, 60, '10+', 'all')
                ])

                return [...recent, ...trending, ...shared, ...sharedByMe, ...stale, ...large1, ...large2]
            } catch (err) {
                console.error(`Failed to fetch files for connector ${connector.id}:`, err)
                return []
            }
        })

        const allFilesArrays = await Promise.all(allFilesPromises)
        const allFiles = allFilesArrays.flat()

        // Deduplicate by ID
        const uniqueFilesMap = new Map()
        allFiles.forEach(file => {
            if (file.id && !uniqueFilesMap.has(file.id)) {
                uniqueFilesMap.set(file.id, file)
            }
        })

        const uniqueFiles = Array.from(uniqueFilesMap.values())

        // Calculate metrics
        const sixMonthsAgo = new Date()
        sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

        const staleCount = uniqueFiles.filter(f => {
            // Exclude folders from Stale Documents view/counts
            if (f.mimeType === 'application/vnd.google-apps.folder') return false
            const lastAccessed = f.viewedByMeTime || f.modifiedTime
            return lastAccessed && new Date(lastAccessed) < sixMonthsAgo
        }).length

        const largeFileThreshold = 500 * 1024 * 1024 // 500MB
        const largeFilesCount = uniqueFiles.filter(f => {
            if (!f.size) return false
            // Google Drive API returns size as a string, so we need to parse it
            const sizeNum = typeof f.size === 'string' ? parseInt(f.size, 10) : f.size
            return !isNaN(sizeNum) && sizeNum > largeFileThreshold
        }).length

        // Debug logging
        const filesWithSize = uniqueFiles.filter(f => f.size && (typeof f.size === 'number' || typeof f.size === 'string'))
        const folders = uniqueFiles.filter(f => f.mimeType === 'application/vnd.google-apps.folder')
        const filesOnly = uniqueFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder')

        console.log(`[Summary Metrics] Total unique files: ${uniqueFiles.length}`)
        console.log(`[Summary Metrics] Folders: ${folders.length}`)
        console.log(`[Summary Metrics] Files (non-folders): ${filesOnly.length}`)
        console.log(`[Summary Metrics] Files with size data: ${filesWithSize.length}`)
        console.log(`[Summary Metrics] Large files (>500MB): ${largeFilesCount}`)

        if (filesWithSize.length > 0) {
            const sizes = filesWithSize.map(f => {
                const sizeNum = typeof f.size === 'string' ? parseInt(f.size, 10) : f.size
                return {
                    name: f.name,
                    size: f.size,
                    sizeNum,
                    sizeMB: Math.round(sizeNum / (1024 * 1024))
                }
            }).sort((a, b) => b.sizeNum - a.sizeNum).slice(0, 10)
            console.log(`[Summary Metrics] Top 10 largest files:`, sizes)
        }

        // Sample a few files to see their structure
        if (uniqueFiles.length > 0) {
            console.log(`[Summary Metrics] Sample file structure:`, uniqueFiles.slice(0, 3).map(f => ({
                name: f.name,
                mimeType: f.mimeType,
                size: f.size,
                hasSize: !!f.size
            })))
        }

        // Count files with SENSITIVE badges as sensitive content
        const sensitiveCount = uniqueFiles.filter(f =>
            f.badges?.some((b: any) => b.type === 'sensitive')
        ).length

        // Count files with RISK badges as risky shares
        const riskySharesCount = uniqueFiles.filter(f =>
            f.badges?.some((b: any) => b.type === 'risk')
        ).length

        return NextResponse.json({
            stale: staleCount,
            large: largeFilesCount,
            sensitive: sensitiveCount,
            risky: riskySharesCount,
            totalSampled: uniqueFiles.length
        })

    } catch (error) {
        console.error('Error fetching summary metrics:', error)
        return NextResponse.json({ error: 'Failed to fetch summary metrics' }, { status: 500 })
    }
}
