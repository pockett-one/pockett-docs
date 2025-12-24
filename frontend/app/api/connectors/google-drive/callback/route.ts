import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { googleDriveConnector } from '@/lib/google-drive-connector'
import { prisma } from '@/lib/prisma'
import { config, getRedirectUrl } from '@/lib/config'

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceRoleKey!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=oauth_error'))
    }

    if (!code) {
      return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=no_code'))
    }

    // Exchange code for tokens
    const clientId = config.googleDrive.clientId
    const clientSecret = config.googleDrive.clientSecret
    const redirectUri = config.googleDrive.redirectUri

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text())
      return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=token_exchange_failed'))
    }

    const tokens = await tokenResponse.json()

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokens.access_token}`,
      },
    })

    if (!userResponse.ok) {
      console.error('User info fetch failed:', await userResponse.text())
      return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=user_info_failed'))
    }

    const userInfo = await userResponse.json()

    // Extract user ID from state parameter (passed during OAuth initiation)
    const userId = state

    if (!userId) {
      console.error('No user ID in state parameter')
      return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=no_user_id'))
    }

    try {
      // Get user's default organization via OrganizationMember
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: userId,
          isDefault: true
        },
        include: {
          organization: true
        }
      })

      if (!membership || !membership.organization) {
        console.error('No default organization found for user:', userId)
        return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=no_organization'))
      }

      const organization = membership.organization

      // Store the Google Drive connection
      const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      await googleDriveConnector.storeConnection(
        organization.id,
        userInfo.id, // Google's unique account ID
        userInfo.email,
        userInfo.name,
        tokens.access_token,
        tokens.refresh_token,
        tokenExpiresAt,
        userInfo.picture
      )

      return NextResponse.redirect(getRedirectUrl(`/dash/connectors?success=google_drive_connected&email=${encodeURIComponent(userInfo.email)}`))

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=database_error'))
    }

  } catch (error) {
    console.error('Google Drive callback error:', error)
    return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=callback_error'))
  }
}
