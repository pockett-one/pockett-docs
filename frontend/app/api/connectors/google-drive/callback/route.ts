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
      const txt = await tokenResponse.text()
      console.error('Token exchange failed:', txt)
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

    // Decode state parameter
    let userId: string
    let nextPath: string = '/dash/connectors'
    let organizationId = ''

    try {
      if (state) {
        const decodedState = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
        userId = decodedState.userId
        organizationId = decodedState.organizationId
        nextPath = decodedState.next || '/dash/connectors'
      } else {
        throw new Error('No state provided')
      }
    } catch (e) {
      console.error('Failed to parse state, falling back to raw state as userId', e)
      userId = state || ''
      // Fallback for backward compatibility if state was just userId
    }

    if (!userId) {
      console.error('No user ID in state parameter')
      return NextResponse.redirect(getRedirectUrl(`${nextPath}?error=no_user_id`))
    }

    let organization: any = null

    if (organizationId) {
      // 1. Try to find membership for this specific org
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId,
            userId
          }
        },
        include: { organization: true }
      })
      if (membership) {
        organization = membership.organization
      }
    }

    // 2. Fallback to default if no specific org requested or found
    if (!organization) {
      const membership = await prisma.organizationMember.findFirst({
        where: {
          userId: userId,
          isDefault: true
        },
        include: {
          organization: true
        }
      })
      if (membership) {
        organization = membership.organization
      }
    }

    if (!organization) {
      console.error('No organization found for user:', userId)
      return NextResponse.redirect(getRedirectUrl(`${nextPath}?error=no_organization`))
    }

    try {
      // Store the Google Drive connection
      const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000)

      const connector = await googleDriveConnector.storeConnection(
        organization.id,
        userInfo.id, // Google's unique account ID
        userInfo.email,
        userInfo.name,
        tokens.access_token,
        tokens.refresh_token,
        tokenExpiresAt,
        userInfo.picture
      )

      // Update Onboarding Progress (Step 2 -> 3)
      // We merge with existing settings to avoid data loss
      const currentSettings = (organization.settings as any) || {}
      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          settings: {
            ...currentSettings,
            onboarding: {
              ...currentSettings.onboarding,
              currentStep: 3, // Ready to Select Folder 
              isComplete: false,
              lastUpdated: new Date().toISOString()
            }
          }
        }
      })

      // Initialize App Folder Structure
      // REMOVED: We now wait for the User to select the folder via the Picker (Auto-open flow)
      // await googleDriveConnector.ensureAppFolderStructure(connector.id)

      // Redirect to the dynamic next path
      return NextResponse.redirect(getRedirectUrl(`${nextPath}?success=google_drive_connected&email=${encodeURIComponent(userInfo.email)}`))

    } catch (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.redirect(getRedirectUrl(`${nextPath}?error=database_error`))
    }

  } catch (error) {
    console.error('Google Drive callback error:', error)
    // Try to redirect to default path if everything fails
    return NextResponse.redirect(getRedirectUrl('/dash/connectors?error=callback_error'))
  }
}
