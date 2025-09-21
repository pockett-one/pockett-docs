import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleDriveConnector } from '@/lib/google-drive-connector'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Get the current user from the session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get organization ID from query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Get connections for this organization
    const connections = await googleDriveConnector.getConnections(organizationId)

    return NextResponse.json(connections)
  } catch (error) {
    console.error('Connectors API error:', error)
    return NextResponse.json(
      { error: 'Failed to load connectors' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the current user from the session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const { connectionId, action = 'disconnect' } = body

    if (!connectionId) {
      return NextResponse.json({ error: 'Connection ID required' }, { status: 400 })
    }

    if (action === 'remove') {
      // Completely remove the connector
      await googleDriveConnector.removeConnection(connectionId)
    } else {
      // Disconnect the connector (mark as REVOKED)
      await googleDriveConnector.disconnectConnection(connectionId)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect API error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect connector' },
      { status: 500 }
    )
  }
}



