import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { apiHandler, successResponse } from '@/lib/api-handler'
import { AuthError, ValidationError } from '@/lib/errors/api-error'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const authenticate = async (request: NextRequest) => {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    throw new AuthError('No authorization header')
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)

  if (authError || !user) {
    throw new AuthError('Invalid token')
  }
  return user
}

export const GET = apiHandler(async (request: NextRequest) => {
  await authenticate(request)

  // Get organization ID from query params
  const { searchParams } = new URL(request.url)
  const organizationId = searchParams.get('organizationId')

  if (!organizationId) {
    throw new ValidationError('Organization ID required')
  }

  // Get connections for this organization
  const connections = await googleDriveConnector.getConnections(organizationId)

  return successResponse(connections)
}, { context: 'GetConnectors' })

export const DELETE = apiHandler(async (request: NextRequest) => {
  await authenticate(request)

  const body = await request.json()
  const { connectionId, action = 'disconnect' } = body

  if (!connectionId) {
    throw new ValidationError('Connection ID required')
  }

  if (action === 'remove') {
    // Completely remove the connector
    await googleDriveConnector.removeConnection(connectionId)
  } else {
    // Disconnect the connector (mark as REVOKED)
    await googleDriveConnector.disconnectConnection(connectionId)
  }

  return successResponse({ success: true })
}, { context: 'DeleteConnector' })



