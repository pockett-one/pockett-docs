import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { detectAllOrganizations } from '@/lib/services/auto-import'
import { createGoogleDriveAdapter } from '@/lib/connectors/adapters/google-drive-adapter'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        // Get user from authorization header
        const authHeader = request.headers.get('authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.replace('Bearer ', '')
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321',
            process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'dummy'
        )
        const { data: { user } } = await supabase.auth.getUser(token)
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const userId = user.id

        const body = await request.json()
        const { connectionId, parentFolderId } = body

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        logger.info('Detecting organizations in Google Drive', { userId, connectionId })

        // Create adapter for Google Drive
        const adapter = createGoogleDriveAdapter(async () => {
            const token = await googleDriveConnector.getAccessToken(connectionId)
            if (!token) throw new Error('Could not get access token')
            return token
        })

        // Detect all organizations
        const detectedOrgs = await detectAllOrganizations(
            connectionId,
            parentFolderId || 'root', // parent folder is dynamic based on user picker choice
            adapter
        )

        logger.info('Organizations detected', {
            count: detectedOrgs.length,
            newOrgs: detectedOrgs.filter(o => !o.alreadyImported).length
        })

        return NextResponse.json({
            success: true,
            organizations: detectedOrgs.map(org => ({
                folderId: org.folderId,
                name: org.name,
                slug: org.slug,
                hasMetaFile: org.hasMetaFile,
                alreadyImported: org.alreadyImported,
                metadata: org.metadata,
                clients: org.clients.map(client => ({
                    folderId: client.folderId,
                    name: client.name,
                    slug: client.slug,
                    alreadyImported: client.alreadyImported,
                    projects: client.projects.map(project => ({
                        folderId: project.folderId,
                        name: project.name,
                        slug: project.slug,
                        alreadyImported: project.alreadyImported
                    }))
                }))
            }))
        })
    } catch (error) {
        logger.error('Error detecting organizations', error as Error)
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to detect organizations' },
            { status: 500 }
        )
    }
}
