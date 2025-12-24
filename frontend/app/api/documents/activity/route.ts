import { NextRequest, NextResponse } from 'next/server'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')
    const connectorId = searchParams.get('connectorId')

    if (!fileId || !connectorId) {
        return NextResponse.json({ error: 'Missing fileId or connectorId' }, { status: 400 })
    }

    try {
        const activities = await googleDriveConnector.getActivity(connectorId, fileId)
        return NextResponse.json({ activities })
    } catch (error: any) {
        console.error('Failed to fetch activity:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch activity' },
            { status: 500 }
        )
    }
}
