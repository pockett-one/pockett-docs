import { NextRequest, NextResponse } from 'next/server'
import { config } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, email } = body

    if (action === 'initiate') {
      // Generate OAuth URL for Google Drive
      const clientId = config.googleDrive.clientId
      const redirectUri = config.googleDrive.redirectUri

      if (!clientId) {
        return NextResponse.json(
          { error: 'Google Drive client ID not configured' },
          { status: 500 }
        )
      }

      // Google Drive OAuth scopes
      const scopes = [
        'https://www.googleapis.com/auth/drive.readonly', // Read access to files and metadata
        'https://www.googleapis.com/auth/drive.metadata.readonly', // Explicit metadata access
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ].join(' ')

      // Use userId as state parameter to pass it to the callback
      const state = userId || Math.random().toString(36).substring(2, 15)

      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      authUrl.searchParams.set('client_id', clientId)
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('access_type', 'offline')
      // Always force consent to ensure we get a Refresh Token and new scopes
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

      // If email is provided, add login_hint for quick account selection
      if (email) {
        authUrl.searchParams.set('login_hint', email)
      }

      return NextResponse.json({
        authUrl: authUrl.toString(),
        state
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Google Drive connector error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


