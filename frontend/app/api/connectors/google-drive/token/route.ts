import { NextRequest, NextResponse } from 'next/server'
import { googleDriveConnector } from '@/lib/google-drive-connector'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const connectionId = searchParams.get('connectionId')

        if (!connectionId) {
            return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }

        // Security: In production, validate that the current user owns this connection.
        // For now we assume the caller context is secure or connectionId is sufficient proof (it is not).
        // TODO: Add proper AUTH check here (e.g. check session user against connector.organization.members)

        console.log(`[token/route] Fetching token for connectionId: ${connectionId}`)
        const accessToken = await googleDriveConnector.getAccessToken(connectionId)
        const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID

        if (!accessToken) {
            console.error(`[token/route] Failed to get accessToken for connectionId: ${connectionId}`)
            return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: 500 })
        }

        console.log(`[token/route] Successfully retrieved token for connectionId: ${connectionId}`)
        return NextResponse.json({ accessToken, clientId })
    } catch (error) {
        console.error('Token fetch error:', error)
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}
