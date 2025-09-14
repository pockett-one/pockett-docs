import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId } = body

    if (action === 'initiate') {
      // Generate OAuth URL for Google Drive
      const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/connectors/google-drive/callback`
      
      if (!clientId) {
        return NextResponse.json(
          { error: 'Google Drive client ID not configured' },
          { status: 500 }
        )
      }

      // Google Drive OAuth scopes
      const scopes = [
        'https://www.googleapis.com/auth/drive.metadata.readonly',
        'https://www.googleapis.com/auth/drive.file',
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
      authUrl.searchParams.set('prompt', 'consent')
      authUrl.searchParams.set('state', state)

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


